let unwrapExn = res =>
  switch res {
  | Ok(v) => v
  | Error(exn) => exn->raise
  }

open Belt
type t = {
  chainManager: ChainManager.t,
  currentlyProcessingBatch: bool,
  maxBatchSize: int,
  maxPerChainQueueSize: int,
}
type chain = ChainMap.Chain.t
type arbitraryEventQueue = list<Types.eventBatchQueueItem>
type action =
  | HyperSyncBlockRangeResponse(chain, HyperSyncWorker.blockRangeFetchResponse)
  | SetFetcherCurrentBlockHeight(chain, int)
  | EventBatchProcessed(EventProcessing.loadResponse<unit>)
  | SetCurrentlyProcessing(bool)
  | SetCurrentlyFetchingBatch(chain, bool)
  | UpdateQueues(ChainMap.t<DynamicContractFetcher.t>, arbitraryEventQueue)

type queryChain = CheckAllChainsRoot | Chain(chain, DynamicContractFetcher.id)
type task =
  | NextQuery(queryChain)
  | ProcessEventBatch

let updateChainFetcherCurrentBlockHeight = (chainFetcher: ChainFetcher.t, ~currentBlockHeight) => {
  if currentBlockHeight > chainFetcher.currentBlockHeight {
    //Don't await this set, it can happen in its own time
    DbFunctions.ChainMetadata.setChainMetadataRow(
      ~chainId=chainFetcher.chainConfig.chain->ChainMap.Chain.toChainId,
      ~startBlock=chainFetcher.chainConfig.startBlock,
      ~blockHeight=currentBlockHeight,
    )->ignore

    {...chainFetcher, currentBlockHeight}
  } else {
    chainFetcher
  }
}

let handleSetCurrentBlockHeight = (state, ~chain, ~currentBlockHeight) => {
  let chainFetcher = state.chainManager.chainFetchers->ChainMap.get(chain)
  let updatedFetcher = chainFetcher->updateChainFetcherCurrentBlockHeight(~currentBlockHeight)
  let updatedFetchers = state.chainManager.chainFetchers->ChainMap.set(chain, updatedFetcher)
  let nextState = {...state, chainManager: {...state.chainManager, chainFetchers: updatedFetchers}}
  let nextTasks = []
  (nextState, nextTasks)
}

let handleHyperSyncBlockRangeResponse = (
  state,
  ~chain,
  ~response: HyperSyncWorker.blockRangeFetchResponse,
) => {
  let chainFetcher = state.chainManager.chainFetchers->ChainMap.get(chain)
  let {
    parsedQueueItems,
    heighestQueriedBlockNumber,
    stats,
    currentBlockHeight,
    reorgGuard,
    fromBlockQueried,
    fetcherId,
    latestFetchedBlockTimestamp,
    contractAddressMapping,
  } = response

  chainFetcher.logger->Logging.childTrace({
    "message": "Finished page range",
    "fromBlock": fromBlockQueried,
    "toBlock": heighestQueriedBlockNumber,
    "number of logs": parsedQueueItems->Array.length,
    "stats": stats,
  })

  //TODO: Check reorg has occurred  here and action reorg if need be
  let {parentHash, lastBlockScannedData} = reorgGuard

  // lastBlockScannedData->checkHasReorgOccurred(~parentHash, ~currentHeight=currentBlockHeight)

  let {newState, nextQueryId} =
    chainFetcher.fetcher->DynamicContractFetcher.update(
      ~latestFetchedBlockTimestamp,
      ~latestFetchedBlockNumber=heighestQueriedBlockNumber,
      ~fetchedEvents=parsedQueueItems->List.fromArray,
      ~id=fetcherId,
    )
  Logging.debug((
    "Response received. Fetcher id:",
    "fetcher id",
    fetcherId,
    "heighestQueriedBlockNumber",
    heighestQueriedBlockNumber,
    "parsed items:",
    parsedQueueItems->Array.length,
    newState->DynamicContractFetcher.queueSize,
  ))

  let updatedChainFetcher = {
    ...chainFetcher->updateChainFetcherCurrentBlockHeight(~currentBlockHeight),
    fetcher: newState,
    isFetchingBatch: false,
  }

  let updatedFetchers = state.chainManager.chainFetchers->ChainMap.set(chain, updatedChainFetcher)

  let nextState = {
    ...state,
    chainManager: {...state.chainManager, chainFetchers: updatedFetchers},
  }

  (nextState, [ProcessEventBatch, NextQuery(Chain(chain, nextQueryId))])
}

let actionReducer = (state: t, action: action) => {
  switch action {
  | SetFetcherCurrentBlockHeight(chain, currentBlockHeight) =>
    state->handleSetCurrentBlockHeight(~chain, ~currentBlockHeight)
  | HyperSyncBlockRangeResponse(chain, response) =>
    Logging.debug("Updating fetchers with hypersync block range res action")
    state->handleHyperSyncBlockRangeResponse(~chain, ~response)
  | EventBatchProcessed({
      dynamicContractRegistration: Some({
        registeringEventBlockNumber,
        registeringEventLogIndex,
        registeringEventChain,
        dynamicContracts,
        unprocessedBatch,
      }),
    }) =>
    let updatedArbQueue = unprocessedBatch->DynamicContractFetcher.mergeSortedList(~cmp=(a, b) => {
      a->EventUtils.getEventComparatorFromQueueItem < b->EventUtils.getEventComparatorFromQueueItem
    }, state.chainManager.arbitraryEventPriorityQueue)

    let contractAddressMapping =
      dynamicContracts
      ->Array.map(d => (d.contractAddress, d.contractType))
      ->ContractAddressingMap.fromArray

    let currentChainFetcher = state.chainManager.chainFetchers->ChainMap.get(registeringEventChain)

    let {newState, nextQueryId} =
      currentChainFetcher.fetcher->DynamicContractFetcher.registerDynamicContract(
        ~contractAddressMapping,
        ~registeringEventBlockNumber,
        ~registeringEventLogIndex,
      )

    let updatedChainFetcher = {...currentChainFetcher, fetcher: newState}
    let updatedChainFetchers =
      state.chainManager.chainFetchers->ChainMap.set(registeringEventChain, updatedChainFetcher)

    let updatedChainManager: ChainManager.t = {
      chainFetchers: updatedChainFetchers,
      arbitraryEventPriorityQueue: updatedArbQueue,
    }

    (
      {
        ...state,
        chainManager: updatedChainManager,
        currentlyProcessingBatch: false,
      },
      [
        ProcessEventBatch,
        NextQuery(Chain(registeringEventChain, nextQueryId)),
        NextQuery(CheckAllChainsRoot),
      ],
    )
  | EventBatchProcessed({dynamicContractRegistration: None}) => (
      {...state, currentlyProcessingBatch: false},
      [ProcessEventBatch],
    )
  | SetCurrentlyProcessing(currentlyProcessingBatch) => ({...state, currentlyProcessingBatch}, [])
  | SetCurrentlyFetchingBatch(chain, isFetchingBatch) =>
    let currentChainFetcher = state.chainManager.chainFetchers->ChainMap.get(chain)
    let chainFetchers =
      state.chainManager.chainFetchers->ChainMap.set(
        chain,
        {...currentChainFetcher, isFetchingBatch},
      )

    ({...state, chainManager: {...state.chainManager, chainFetchers}}, [])
  | UpdateQueues(fetchers, arbitraryEventPriorityQueue) =>
    Logging.debug("Updating fetchers action")
    let chainFetchers = state.chainManager.chainFetchers->ChainMap.mapWithKey((chain, cf) => {
      {
        ...cf,
        fetcher: fetchers->ChainMap.get(chain),
      }
    })

    (
      {
        ...state,
        chainManager: {
          chainFetchers,
          arbitraryEventPriorityQueue,
        },
      },
      [NextQuery(CheckAllChainsRoot)],
    )
  }
}

let checkAndFetchForChain = (chain, ~fetcherId, ~state, ~dispatchAction) => {
  let {fetcher, chainWorker, logger, currentBlockHeight, isFetchingBatch} =
    state.chainManager.chainFetchers->ChainMap.get(chain)
  Logging.debug("Check and fetch for chain")
  if (
    !isFetchingBatch &&
    fetcher->DynamicContractFetcher.isReadyForNextQuery(
      ~fetcherId,
      ~maxQueueSize=state.maxPerChainQueueSize,
    )
  ) {
    switch chainWorker.contents {
    | HyperSync(worker) =>
      let optQuery = fetcher->DynamicContractFetcher.getNextQuery(~fetcherId)

      switch optQuery {
      | Some(query) =>
        dispatchAction(SetCurrentlyFetchingBatch(chain, true))
        Logging.debug(("Query:", query))
        let setCurrentBlockHeight = (~currentBlockHeight) =>
          dispatchAction(SetFetcherCurrentBlockHeight(chain, currentBlockHeight))
        worker
        ->HyperSyncWorker.fetchBlockRange(
          ~query,
          ~logger,
          ~currentBlockHeight,
          ~setCurrentBlockHeight,
        )
        ->Promise.thenResolve(res => dispatchAction(HyperSyncBlockRangeResponse(chain, res)))
        ->ignore
      | None => () //No action to dispatch
      }
    | Rpc(_) | RawEvents(_) =>
      Js.Exn.raiseError("Currently unhandled rpc or raw events worker with hypersync query")
    }
  }
}

let taskReducer = (state: t, task: task, ~dispatchAction) => {
  switch task {
  | NextQuery(chainCheck) =>
    let fetchForChain = checkAndFetchForChain(~state, ~dispatchAction)

    switch chainCheck {
    | Chain(chain, fetcherId) => chain->fetchForChain(~fetcherId)
    | CheckAllChainsRoot => ChainMap.Chain.all->Array.forEach(fetchForChain(~fetcherId=Root))
    }
  | ProcessEventBatch =>
    if !state.currentlyProcessingBatch {
      Logging.debug("Start processing")
      dispatchAction(SetCurrentlyProcessing(true))
      switch state.chainManager->ChainManager.createBatch(~maxBatchSize=state.maxBatchSize) {
      | Some({batch, fetchers, arbitraryEventQueue}) =>
        Logging.debug("got batch")

        dispatchAction(UpdateQueues(fetchers, arbitraryEventQueue))
        let inMemoryStore = IO.InMemoryStore.make()
        EventProcessing.processEventBatch(~eventBatch=batch, ~inMemoryStore, ~fetchers)
        ->Promise.thenResolve(res => dispatchAction(EventBatchProcessed(res)))
        ->ignore
      | None =>
        Logging.debug("no batch")
        dispatchAction(SetCurrentlyProcessing(false))
      }
    } else {
      Logging.debug("Currently processing")
    }
  }
}
