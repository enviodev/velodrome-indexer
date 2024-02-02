open Belt
type blockNumber = int
type logIndex = int
type dynamicContractId = {blockNumber: int, logIndex: int}
type id = Root | DynamicContract(dynamicContractId)

type fetchState = {
  latestFetchedBlockTimestamp: int,
  latestFetchedBlockNumber: int,
  contractAddressMapping: ContractAddressingMap.mapping,
  fetchedEventQueue: list<Types.eventBatchQueueItem>,
}

module DynamicContractCmpId = Id.MakeComparable({
  type t = dynamicContractId
  let cmp = (a: t, b: t) =>
    Pervasives.compare((a.blockNumber, a.logIndex), (b.blockNumber, b.logIndex))
})

type dynamicContractMapping = Map.t<dynamicContractId, fetchState, DynamicContractCmpId.identity>
let emptyDynamicContractMapping = Map.make(~id=module(DynamicContractCmpId))

type t = {
  fetchState: fetchState,
  pendingDynamicContractRegistrations: dynamicContractMapping,
}

let rec mergeSortedListInternal = (a, b, ~cmp, ~sortedRev) => {
  switch (a, b) {
  | (list{aHead, ...aTail}, list{bHead, ...bTail}) =>
    let (nextA, nextB, nextItem) = if cmp(aHead, bHead) {
      (aTail, b, aHead)
    } else {
      (bTail, a, bHead)
    }
    mergeSortedListInternal(nextA, nextB, ~cmp, ~sortedRev=sortedRev->List.add(nextItem))
  | (rest, list{}) | (list{}, rest) => List.reverseConcat(sortedRev, rest)
  }
}

let mergeSortedList = mergeSortedListInternal(~sortedRev=list{})

let getEventCmp = (event: Types.eventBatchQueueItem) => {
  (event.timestamp, event.blockNumber, event.logIndex)
}

let eventCmp = (a, b) => a->getEventCmp <= b->getEventCmp

let mergeSortedEventList = mergeSortedList(~cmp=eventCmp)

let mergeFetchState = (root: fetchState, child: fetchState) => {
  let fetchedEventQueue = mergeSortedEventList(root.fetchedEventQueue, child.fetchedEventQueue)
  let contractAddressMapping = ContractAddressingMap.combine(
    root.contractAddressMapping,
    child.contractAddressMapping,
  )
  {
    fetchedEventQueue,
    contractAddressMapping,
    latestFetchedBlockTimestamp: Pervasives.max(
      root.latestFetchedBlockTimestamp,
      child.latestFetchedBlockTimestamp,
    ),
    latestFetchedBlockNumber: Pervasives.max(
      root.latestFetchedBlockNumber,
      child.latestFetchedBlockNumber,
    ),
  }
}

let mergeDynamicContractRegistration = (self: t, dynamicContractId: dynamicContractId) => {
  switch self.pendingDynamicContractRegistrations->Map.get(dynamicContractId) {
  | None => self
  | Some(d) =>
    let fetchState = self.fetchState->mergeFetchState(d)
    let pendingDynamicContractRegistrations =
      self.pendingDynamicContractRegistrations->Map.remove(dynamicContractId)
    {fetchState, pendingDynamicContractRegistrations}
  }
}

exception UnexpectedDynamicContractExists(id)

let addDynamicContractNode = (self: t, ~dynamicContractId, ~dynamicContractFetchState) => {
  let pendingDynamicContractRegistrations =
    self.pendingDynamicContractRegistrations->Map.set(dynamicContractId, dynamicContractFetchState)
  {...self, pendingDynamicContractRegistrations}
}

let updateFetchState = (
  fetchState: fetchState,
  ~latestFetchedBlockTimestamp,
  ~latestFetchedBlockNumber,
  ~fetchedEvents,
) => {
  {
    ...fetchState,
    latestFetchedBlockNumber,
    latestFetchedBlockTimestamp,
    fetchedEventQueue: List.concat(fetchedEvents, fetchState.fetchedEventQueue),
  }
}

let updateDynamicContractFetchState = (
  pendingDynamicContractRegistrations: dynamicContractMapping,
  ~dynamicContractId,
  ~latestFetchedBlockTimestamp,
  ~latestFetchedBlockNumber,
  ~fetchedEvents,
) =>
  pendingDynamicContractRegistrations->Map.update(dynamicContractId, v =>
    v->Option.map(
      updateFetchState(~latestFetchedBlockTimestamp, ~latestFetchedBlockNumber, ~fetchedEvents),
    )
  )

exception UnexpectedDynamicContractDoesNotExist(dynamicContractId)
type updateResponse = {newState: t, nextQueryId: id}
let makeUpdateResponse = (newState, nextQueryId) => {newState, nextQueryId}
let update = (
  ~id,
  ~latestFetchedBlockTimestamp,
  ~latestFetchedBlockNumber,
  ~fetchedEvents,
  self: t,
): updateResponse => {
  let updateFetchState = updateFetchState(
    ~latestFetchedBlockNumber,
    ~latestFetchedBlockTimestamp,
    ~fetchedEvents,
  )
  switch id {
  | Root =>
    //Updates the root an selects the same root id as next query id
    let fetchState = self.fetchState->updateFetchState
    {
      ...self,
      fetchState,
    }->makeUpdateResponse(id)

  | DynamicContract(dynamicContractId) =>
    switch self.pendingDynamicContractRegistrations->Map.get(dynamicContractId) {
    //Should not happen that we query for a dynamic contract that doesn't exist. For now raise an exception
    //We can always change this to just return self with Root id
    | None => UnexpectedDynamicContractDoesNotExist(dynamicContractId)->raise
    | Some(d) =>
      //Update the state of the given pending contract
      let newState = {
        ...self,
        pendingDynamicContractRegistrations: self.pendingDynamicContractRegistrations->Map.set(
          dynamicContractId,
          d->updateFetchState,
        ),
      }

      if latestFetchedBlockNumber < self.fetchState.latestFetchedBlockNumber {
        //If the dynamic contract has not caught up to the root fetcher, return
        //the same id as a next query id
        newState->makeUpdateResponse(id)
      } else {
        //If the dynamic contract has caught up to the root fetcher, return
        //merge it into the root and return next id as Root
        newState->mergeDynamicContractRegistration(dynamicContractId)->makeUpdateResponse(Root)
      }
    }
  }
}

type nextQuery = {
  fetcherId: id,
  fromBlock: int,
  contractAddressMapping: ContractAddressingMap.mapping,
  currentLatestBlockTimestamp: int,
}

let getNextQueryFromFetchState = (fetchState, ~fetcherId) => {
  fetcherId,
  fromBlock: fetchState.latestFetchedBlockNumber + 1,
  contractAddressMapping: fetchState.contractAddressMapping,
  currentLatestBlockTimestamp: fetchState.latestFetchedBlockTimestamp,
}

let getNextQuery = (self: t, ~fetcherId) =>
  switch fetcherId {
  | Root =>
    if self.pendingDynamicContractRegistrations->Map.size > 0 {
      //If there are pending dynamic contract registrations
      //Don't action a request until they are all merged int
      None
    } else {
      //
      self.fetchState->getNextQueryFromFetchState(~fetcherId)->Some
    }
  | DynamicContract(dynamicContractId) =>
    self.pendingDynamicContractRegistrations
    ->Map.get(dynamicContractId)
    ->Option.map(getNextQueryFromFetchState(~fetcherId))
  }

type latestFetchedBlockTimestamp = int
type queueItem =
  | Item(Types.eventBatchQueueItem)
  | NoItem(latestFetchedBlockTimestamp)

let getCmp = qItem =>
  switch qItem {
  | Item({timestamp, blockNumber, logIndex}) => (timestamp, blockNumber, logIndex)
  | NoItem(timestamp) => (timestamp, 0, 0)
  }

let qItemLt = (a, b) => a->getCmp < b->getCmp

let earlierQItem = (a, b) =>
  if a->qItemLt(b) {
    a
  } else {
    b
  }

type latestEventResponseGeneric<'a> = {
  updatedFetcher: 'a,
  earliestQueueItem: queueItem,
}

type latestEventResponse = latestEventResponseGeneric<t>

let getNodeEarliestEvent = (fetchState: fetchState) => {
  let (updatedFetcher, earliestQueueItem) = switch fetchState.fetchedEventQueue {
  | list{} => (fetchState, NoItem(fetchState.latestFetchedBlockTimestamp))
  | list{head, ...fetchedEventQueue} => ({...fetchState, fetchedEventQueue}, Item(head))
  }

  {updatedFetcher, earliestQueueItem}
}

let getEarliestEvent = (self: t): latestEventResponse => {
  let rootEarliestEvent = self.fetchState->getNodeEarliestEvent

  let optEarliestDynamicContract =
    self.pendingDynamicContractRegistrations
    ->Map.toArray
    ->Array.reduce(None, (accum, (chain, fetchState)) => {
      let currentEarliest = fetchState->getNodeEarliestEvent
      switch accum {
      | None =>
        if currentEarliest.earliestQueueItem->qItemLt(rootEarliestEvent.earliestQueueItem) {
          Some((chain, currentEarliest))
        } else {
          None
        }
      | Some((_, prevEarliest)) =>
        if currentEarliest.earliestQueueItem->qItemLt(prevEarliest.earliestQueueItem) {
          Some((chain, currentEarliest))
        } else {
          accum
        }
      }
    })

  switch optEarliestDynamicContract {
  | Some((chain, dynamicContractEarliest))
    if dynamicContractEarliest.earliestQueueItem->qItemLt(rootEarliestEvent.earliestQueueItem) =>
    let pendingDynamicContractRegistrations =
      self.pendingDynamicContractRegistrations->Map.set(
        chain,
        dynamicContractEarliest.updatedFetcher,
      )
    let updatedFetcher = {...self, pendingDynamicContractRegistrations}

    {
      updatedFetcher,
      earliestQueueItem: dynamicContractEarliest.earliestQueueItem,
    }

  | _ =>
    let updatedFetcher = {...self, fetchState: rootEarliestEvent.updatedFetcher}
    {
      updatedFetcher,
      earliestQueueItem: rootEarliestEvent.earliestQueueItem,
    }
  }
  // switch self.pendingDynamicContractRegistrations {
  // | None => self->getNodeEarliestEvent
  // | Some(child) =>
  //   let currentEarliest = child->getNodeEarliestEvent
  //   let nextEarliest = child->getEarliestEvent
  //
  //   let nextChild = if currentEarliest.earliestQueueItem->qItemLt(nextEarliest.earliestQueueItem) {
  //     currentEarliest
  //   } else {
  //     nextEarliest
  //   }
  //
  //   self->getSelfWithChildResponse(nextChild)
  // }
}

let makeInternal = (~id, ~contractAddressMapping): t => {
  fetchState: {
    latestFetchedBlockTimestamp: 0,
    latestFetchedBlockNumber: 0,
    contractAddressMapping,
    fetchedEventQueue: list{},
  },
  pendingDynamicContractRegistrations: emptyDynamicContractMapping,
}

let makeRoot = makeInternal(~id=Root)

let registerDynamicContract = (
  self: t,
  ~registeringEventBlockNumber,
  ~registeringEventLogIndex,
  ~contractAddressMapping,
) => {
  let dynamicContractId = {
    blockNumber: registeringEventBlockNumber,
    logIndex: registeringEventLogIndex,
  }
  let dynamicContractFetchState = {
    latestFetchedBlockNumber: registeringEventBlockNumber - 1,
    latestFetchedBlockTimestamp: 0,
    contractAddressMapping,
    fetchedEventQueue: list{},
  }
  {
    nextQueryId: DynamicContract(dynamicContractId),
    newState: self->addDynamicContractNode(~dynamicContractId, ~dynamicContractFetchState),
  }
}

let queueSize = (self: t) => {
  self.fetchState.fetchedEventQueue->List.size +
    self.pendingDynamicContractRegistrations->Map.reduce(0, (accum, _chain, p) =>
      accum + p.fetchedEventQueue->List.size
    )
}

let isReadyForNextRootQuery = (self: t, ~maxQueueSize) =>
  if self.pendingDynamicContractRegistrations->Map.size > 0 {
    false
  } else {
    self.fetchState.fetchedEventQueue->List.size < maxQueueSize
  }

let getAllAddressesForContract = (~contractName, self: t) => {
  self.pendingDynamicContractRegistrations
  ->Map.valuesToArray
  ->Array.concat([self.fetchState])
  ->Array.reduce(Set.String.empty, (accum, fetchState) => {
    fetchState.contractAddressMapping
    ->ContractAddressingMap.getAddresses(contractName)
    ->Option.mapWithDefault(accum, newAddresses => {
      accum->Set.String.union(newAddresses)
    })
  })
}

let checkContainsRegisteredContractAddress = (self: t, ~contractName, ~contractAddress) => {
  let allAddr = self->getAllAddressesForContract(~contractName)
  allAddr->Set.String.has(contractAddress->Ethers.ethAddressToString)
}

let getQueueSizes = (self: t) => {
  [("Root", self.fetchState.fetchedEventQueue->List.size)]
  ->Array.concat(
    self.pendingDynamicContractRegistrations
    ->Map.toArray
    ->Array.map((({blockNumber, logIndex}, fs)) => (
      `${blockNumber->Int.toString}-${logIndex->Int.toString}`,
      fs.fetchedEventQueue->List.size,
    )),
  )
  ->Js.Dict.fromArray
}
