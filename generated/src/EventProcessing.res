open Belt

let addEventToRawEvents = (
  event: Types.eventLog<'a>,
  ~inMemoryStore: IO.InMemoryStore.t,
  ~chainId,
  ~jsonSerializedParams: Js.Json.t,
  ~eventName: Types.eventName,
) => {
  let {
    blockNumber,
    logIndex,
    transactionIndex,
    transactionHash,
    srcAddress,
    blockHash,
    blockTimestamp,
  } = event

  let eventId = EventUtils.packEventIndex(~logIndex, ~blockNumber)
  let rawEvent: Types.rawEventsEntity = {
    chainId,
    eventId: eventId->Ethers.BigInt.toString,
    blockNumber,
    logIndex,
    transactionIndex,
    transactionHash,
    srcAddress,
    blockHash,
    blockTimestamp,
    eventType: eventName->Types.eventName_encode,
    params: jsonSerializedParams->Js.Json.stringify,
  }

  let eventIdStr = eventId->Ethers.BigInt.toString

  inMemoryStore.rawEvents->IO.InMemoryStore.RawEvents.set(
    ~key={chainId, eventId: eventIdStr},
    ~entity=Types.Set(
      rawEvent,
      {
        // Setting this all to `-1` to show it isn't needed in hackathon
        // TODO: make raw events have its own type.
        chainId: -1,
        blockNumber: -1,
        logIndex: -1,
      },
    ),
  )
}

let updateEventSyncState = (
  event: Types.eventLog<'a>,
  ~chainId,
  ~inMemoryStore: IO.InMemoryStore.t,
) => {
  let {blockNumber, logIndex, transactionIndex, blockTimestamp} = event
  let _ = inMemoryStore.eventSyncState->IO.InMemoryStore.EventSyncState.set(
    ~key=chainId,
    ~entity=Set(
      {
        chainId,
        blockTimestamp,
        blockNumber,
        logIndex,
        transactionIndex,
      },
      // TODO: make thes not needed
      {
        chainId: -1,
        blockNumber: -1,
        logIndex: -1,
      },
    ),
  )
}

/** Function composer for handling an event*/
let handleEvent = (
  ~inMemoryStore,
  ~chainId,
  ~serializer,
  ~context: Context.genericContextCreatorFunctions<'b, 'c, 'd>,
  ~handlerWithContextGetter: Handlers.handlerWithContextGetterSyncAsync<'a, 'b, 'c, 'd>,
  ~event,
  ~eventName,
  ~cb,
) => {
  event->updateEventSyncState(~chainId, ~inMemoryStore)

  let jsonSerializedParams = event.params->serializer

  event->addEventToRawEvents(~inMemoryStore, ~chainId, ~jsonSerializedParams, ~eventName)

  let makeErr = ErrorHandling.make(
    ~msg="Event Handler failed, please fix the error to keep the indexer running smoothly",
    ~logger=context.logger,
  )

  switch handlerWithContextGetter {
  | Sync({handler, contextGetter}) =>
    //Call the context getter here, ensures no stale values in the context
    //Since loaders and previous handlers have already run
    let handlerContext = contextGetter(context)
    switch handler(~event, ~context=handlerContext) {
    | exception exn => Error(makeErr(exn))
    | () => Ok()
    }->cb
  | Async({handler, contextGetter}) =>
    //Call the context getter here, ensures no stale values in the context
    //Since loaders and previous handlers have already run
    let handlerContext = contextGetter(context)
    handler(~event, ~context=handlerContext)
    ->Promise.thenResolve(_ => cb(Ok()))
    ->Promise.catch(exn => {
      cb(Error(makeErr(exn)))
      Promise.resolve()
    })
    ->ignore
  }
}

let eventRouter = (item: Context.eventRouterEventAndContext, ~inMemoryStore, ~cb) => {
  let {event, chainId} = item

  switch event {
  | PoolContract_FeesWithContext(event, context) =>
    handleEvent(
      ~event,
      ~eventName=Pool_Fees,
      ~serializer=Types.PoolContract.FeesEvent.eventArgs_encode,
      ~handlerWithContextGetter=Handlers.PoolContract.Fees.getHandler(),
      ~chainId,
      ~inMemoryStore,
      ~cb,
      ~context,
    )

  | PoolContract_SwapWithContext(event, context) =>
    handleEvent(
      ~event,
      ~eventName=Pool_Swap,
      ~serializer=Types.PoolContract.SwapEvent.eventArgs_encode,
      ~handlerWithContextGetter=Handlers.PoolContract.Swap.getHandler(),
      ~chainId,
      ~inMemoryStore,
      ~cb,
      ~context,
    )

  | PoolContract_SyncWithContext(event, context) =>
    handleEvent(
      ~event,
      ~eventName=Pool_Sync,
      ~serializer=Types.PoolContract.SyncEvent.eventArgs_encode,
      ~handlerWithContextGetter=Handlers.PoolContract.Sync.getHandler(),
      ~chainId,
      ~inMemoryStore,
      ~cb,
      ~context,
    )

  | PoolFactoryContract_PoolCreatedWithContext(event, context) =>
    handleEvent(
      ~event,
      ~eventName=PoolFactory_PoolCreated,
      ~serializer=Types.PoolFactoryContract.PoolCreatedEvent.eventArgs_encode,
      ~handlerWithContextGetter=Handlers.PoolFactoryContract.PoolCreated.getHandler(),
      ~chainId,
      ~inMemoryStore,
      ~cb,
      ~context,
    )

  | VoterContract_DistributeRewardWithContext(event, context) =>
    handleEvent(
      ~event,
      ~eventName=Voter_DistributeReward,
      ~serializer=Types.VoterContract.DistributeRewardEvent.eventArgs_encode,
      ~handlerWithContextGetter=Handlers.VoterContract.DistributeReward.getHandler(),
      ~chainId,
      ~inMemoryStore,
      ~cb,
      ~context,
    )

  | VoterContract_GaugeCreatedWithContext(event, context) =>
    handleEvent(
      ~event,
      ~eventName=Voter_GaugeCreated,
      ~serializer=Types.VoterContract.GaugeCreatedEvent.eventArgs_encode,
      ~handlerWithContextGetter=Handlers.VoterContract.GaugeCreated.getHandler(),
      ~chainId,
      ~inMemoryStore,
      ~cb,
      ~context,
    )

  | VotingRewardContract_NotifyRewardWithContext(event, context) =>
    handleEvent(
      ~event,
      ~eventName=VotingReward_NotifyReward,
      ~serializer=Types.VotingRewardContract.NotifyRewardEvent.eventArgs_encode,
      ~handlerWithContextGetter=Handlers.VotingRewardContract.NotifyReward.getHandler(),
      ~chainId,
      ~inMemoryStore,
      ~cb,
      ~context,
    )
  }
}

let asyncGetters: Context.entityGetters = {
  getLiquidityPoolDailySnapshot: id =>
    DbFunctions.LiquidityPoolDailySnapshot.readEntities(DbFunctions.sql, [id]),
  getLiquidityPoolHourlySnapshot: id =>
    DbFunctions.LiquidityPoolHourlySnapshot.readEntities(DbFunctions.sql, [id]),
  getLiquidityPoolNew: id => DbFunctions.LiquidityPoolNew.readEntities(DbFunctions.sql, [id]),
  getLiquidityPoolWeeklySnapshot: id =>
    DbFunctions.LiquidityPoolWeeklySnapshot.readEntities(DbFunctions.sql, [id]),
  getToken: id => DbFunctions.Token.readEntities(DbFunctions.sql, [id]),
  getTokenDailySnapshot: id => DbFunctions.TokenDailySnapshot.readEntities(DbFunctions.sql, [id]),
  getTokenHourlySnapshot: id => DbFunctions.TokenHourlySnapshot.readEntities(DbFunctions.sql, [id]),
  getTokenWeeklySnapshot: id => DbFunctions.TokenWeeklySnapshot.readEntities(DbFunctions.sql, [id]),
  getUser: id => DbFunctions.User.readEntities(DbFunctions.sql, [id]),
}

type dynamicContractRegistration = {
  registeringEventBlockNumber: int,
  registeringEventLogIndex: int,
  registeringEventChain: ChainMap.Chain.t,
  dynamicContracts: array<Types.dynamicContractRegistryEntity>,
}

type dynamicContractRegistrations = {
  //Its better to apply these in reverse so that we register them with
  //the fetcher from latest to earliest. That way there are less recursions
  registrationsReversed: list<dynamicContractRegistration>,
  unprocessedBatchReversed: list<Types.eventBatchQueueItem>,
  //Once a single registration happens, the rest of the batches
  //loaders should be run on an isolated in memory store so that
  //they don't affect state of the batch that will be processed
  inMemoryStore: IO.InMemoryStore.t,
}

type loadResponse<'a> = {
  val: 'a,
  dynamicContractRegistrations: option<dynamicContractRegistrations>,
}

type getReadEntitiesRes = loadResponse<
  array<(array<Types.entityRead>, Context.eventRouterEventAndContext)>,
>

/**
Composer for getting entitiesToLoad and dynamicContractRegistrations for a given event
*/
let composeGetReadEntity = (
  ~event: Types.eventLog<_>,
  ~contextCreator,
  ~inMemoryStore,
  ~logger,
  ~asyncGetters,
  ~getLoader,
  ~item: Types.eventBatchQueueItem,
  ~entitiesToLoad,
  ~dynamicContractRegistrations: option<dynamicContractRegistrations>,
  ~eventWithContextAccessor,
  ~checkContractIsRegistered,
): result<getReadEntitiesRes, ErrorHandling.t> => {
  let {chain} = item
  let chainId = chain->ChainMap.Chain.toChainId
  //If there are dynamic contracts, context loader should use the cloned in memory store
  //Otherwise we can use the passed in one
  let inMemoryStore =
    dynamicContractRegistrations->Option.mapWithDefault(inMemoryStore, d => d.inMemoryStore)

  let contextHelper: Context.genericContextCreatorFunctions<_> = contextCreator(
    ~inMemoryStore,
    ~chainId,
    ~event,
    ~logger,
    ~asyncGetters,
  )

  let context = contextHelper.getLoaderContext()

  let loader = getLoader()

  switch loader(~event, ~context) {
  | exception exn =>
    let errorHandler =
      exn->ErrorHandling.make(
        ~msg="Event Loader failed, please fix the error to keep the indexer running smoothly",
        ~logger=contextHelper.logger,
      )
    Error(errorHandler)
  | () =>
    let dynamicContracts = if item.hasRegisteredDynamicContracts->Option.getWithDefault(false) {
      //If an item has already been registered, it would have been
      //put back on the arbitrary events queue and is now being reprocessed
      []
    } else {
      contextHelper.getAddedDynamicContractRegistrations()->Array.keep(({
        contractAddress,
        contractType,
      }) => {
        !checkContractIsRegistered(~chain, ~contractAddress, ~contractName=contractType)
      })
    }

    let addToDynamicContractRegistrations = (
      ~registrationsReversed,
      ~unprocessedBatchReversed,
      ~inMemoryStore,
    ) => {
      //If there are any dynamic contract registrations, put this item in the unprocessedBatch flagged
      //with "hasRegisteredDynamicContracts" and return the same list of entitiesToLoad without the
      //current item
      let unprocessedBatchReversed = list{
        {...item, hasRegisteredDynamicContracts: true},
        ...unprocessedBatchReversed,
      }

      let dynamicContractRegistration = {
        dynamicContracts,
        registeringEventBlockNumber: event.blockNumber,
        registeringEventLogIndex: event.logIndex,
        registeringEventChain: chain,
      }
      let dynamicContractRegistrations = {
        unprocessedBatchReversed,
        registrationsReversed: list{dynamicContractRegistration, ...registrationsReversed},
        inMemoryStore,
      }->Some
      {val: entitiesToLoad, dynamicContractRegistrations}
    }

    switch dynamicContractRegistrations {
    | None =>
      if dynamicContracts->Array.length > 0 {
        //Clone the inMemoryStore
        let inMemoryStoreDeepClone = inMemoryStore->IO.InMemoryStore.clone

        addToDynamicContractRegistrations(
          ~registrationsReversed=list{},
          ~unprocessedBatchReversed=list{},
          ~inMemoryStore=inMemoryStoreDeepClone,
        )
      } else {
        //If there are no dynamic contract registrations, get the entities to load and
        //return a context with the event for the handlers
        let entitiesToLoad = entitiesToLoad->Array.concat([
          (
            contextHelper.getEntitiesToLoad(),
            (
              {
                chainId,
                event: eventWithContextAccessor(event, contextHelper),
              }: Context.eventRouterEventAndContext
            ),
          ),
        ])

        {val: entitiesToLoad, dynamicContractRegistrations: None}
      }
    | Some({unprocessedBatchReversed, registrationsReversed, inMemoryStore}) =>
      if dynamicContracts->Array.length > 0 {
        addToDynamicContractRegistrations(
          ~registrationsReversed,
          ~unprocessedBatchReversed,
          ~inMemoryStore,
        )
      } else {
        let unprocessedBatchReversed = list{item, ...unprocessedBatchReversed}

        let dynamicContractRegistrations = {
          unprocessedBatchReversed,
          registrationsReversed,
          inMemoryStore,
        }->Some
        {val: entitiesToLoad, dynamicContractRegistrations}
      }
    }->Ok
  }
}

let rec getReadEntities = (
  ~inMemoryStore,
  ~logger,
  ~entitiesToLoad=[],
  ~checkContractIsRegistered,
  ~dynamicContractRegistrations=None,
  eventBatch: list<Types.eventBatchQueueItem>,
): result<getReadEntitiesRes, ErrorHandling.t> => {
  switch eventBatch {
  | list{} => {val: entitiesToLoad, dynamicContractRegistrations}->Ok
  | list{item, ...tail} => {
      let composer = composeGetReadEntity(
        ~entitiesToLoad,
        ~asyncGetters,
        ~inMemoryStore,
        ~logger,
        ~item,
        ~checkContractIsRegistered,
        ~dynamicContractRegistrations,
      )

      let res = switch item.event {
      | PoolContract_Fees(event) =>
        composer(
          ~event,
          ~contextCreator=Context.PoolContract.FeesEvent.contextCreator,
          ~getLoader=Handlers.PoolContract.Fees.getLoader,
          ~eventWithContextAccessor=Context.poolContract_FeesWithContext,
        )
      | PoolContract_Swap(event) =>
        composer(
          ~event,
          ~contextCreator=Context.PoolContract.SwapEvent.contextCreator,
          ~getLoader=Handlers.PoolContract.Swap.getLoader,
          ~eventWithContextAccessor=Context.poolContract_SwapWithContext,
        )
      | PoolContract_Sync(event) =>
        composer(
          ~event,
          ~contextCreator=Context.PoolContract.SyncEvent.contextCreator,
          ~getLoader=Handlers.PoolContract.Sync.getLoader,
          ~eventWithContextAccessor=Context.poolContract_SyncWithContext,
        )
      | PoolFactoryContract_PoolCreated(event) =>
        composer(
          ~event,
          ~contextCreator=Context.PoolFactoryContract.PoolCreatedEvent.contextCreator,
          ~getLoader=Handlers.PoolFactoryContract.PoolCreated.getLoader,
          ~eventWithContextAccessor=Context.poolFactoryContract_PoolCreatedWithContext,
        )
      | VoterContract_DistributeReward(event) =>
        composer(
          ~event,
          ~contextCreator=Context.VoterContract.DistributeRewardEvent.contextCreator,
          ~getLoader=Handlers.VoterContract.DistributeReward.getLoader,
          ~eventWithContextAccessor=Context.voterContract_DistributeRewardWithContext,
        )
      | VoterContract_GaugeCreated(event) =>
        composer(
          ~event,
          ~contextCreator=Context.VoterContract.GaugeCreatedEvent.contextCreator,
          ~getLoader=Handlers.VoterContract.GaugeCreated.getLoader,
          ~eventWithContextAccessor=Context.voterContract_GaugeCreatedWithContext,
        )
      | VotingRewardContract_NotifyReward(event) =>
        composer(
          ~event,
          ~contextCreator=Context.VotingRewardContract.NotifyRewardEvent.contextCreator,
          ~getLoader=Handlers.VotingRewardContract.NotifyReward.getLoader,
          ~eventWithContextAccessor=Context.votingRewardContract_NotifyRewardWithContext,
        )
      }

      //else keep getting read entities from batch
      switch res {
      | Error(e) => Error(e)
      | Ok(res) =>
        tail->getReadEntities(
          ~inMemoryStore,
          ~logger,
          ~entitiesToLoad=res.val,
          ~checkContractIsRegistered,
          ~dynamicContractRegistrations=res.dynamicContractRegistrations,
        )
      }
    }
  }
}

let loadReadEntities = async (
  ~inMemoryStore,
  ~eventBatch: list<Types.eventBatchQueueItem>,
  ~checkContractIsRegistered,
  ~logger: Pino.t,
): result<loadResponse<array<Context.eventRouterEventAndContext>>, ErrorHandling.t> => {
  switch eventBatch->getReadEntities(~inMemoryStore, ~logger, ~checkContractIsRegistered) {
  | Ok({val: entitiesToLoad, dynamicContractRegistrations}) =>
    let (readEntitiesGrouped, contexts): (
      array<array<Types.entityRead>>,
      array<Context.eventRouterEventAndContext>,
    ) =
      entitiesToLoad->Array.unzip

    let readEntities = readEntitiesGrouped->Belt.Array.concatMany

    await IO.loadEntitiesToInMemStore(~inMemoryStore, ~entityBatch=readEntities)

    {val: contexts, dynamicContractRegistrations}->Ok
  | Error(e) => Error(e)
  }
}

let registerProcessEventBatchMetrics = (
  ~logger,
  ~batchSize,
  ~loadDuration,
  ~handlerDuration,
  ~dbWriteDuration,
) => {
  logger->Logging.childTrace({
    "message": "Finished processing batch",
    "batch_size": batchSize,
    "loader_time_elapsed": loadDuration,
    "handlers_time_elapsed": handlerDuration,
    "write_time_elapsed": dbWriteDuration,
  })

  Prometheus.incrementLoadEntityDurationCounter(~duration=loadDuration)

  Prometheus.incrementEventRouterDurationCounter(~duration=handlerDuration)

  Prometheus.incrementExecuteBatchDurationCounter(~duration=dbWriteDuration)

  Prometheus.incrementEventsProcessedCounter(~number=batchSize)
}

let processEventBatch = async (
  ~eventBatch: list<Types.eventBatchQueueItem>,
  ~inMemoryStore: IO.InMemoryStore.t,
  ~checkContractIsRegistered,
) => {
  let logger = Logging.createChild(
    ~params={
      "context": "batch",
    },
  )

  let timeRef = Hrtime.makeTimer()

  switch await loadReadEntities(~inMemoryStore, ~eventBatch, ~logger, ~checkContractIsRegistered) {
  | Ok({val: eventBatchAndContext, dynamicContractRegistrations}) =>
    let elapsedAfterLoad = timeRef->Hrtime.timeSince->Hrtime.toMillis->Hrtime.intFromMillis

    switch await eventBatchAndContext->Belt.Array.reduce(Promise.resolve(Ok()), async (
      previousPromise,
      event,
    ) => {
      switch await previousPromise {
      | Error(e) => Error(e)
      | Ok() =>
        await Promise.make((resolve, _reject) =>
          event->eventRouter(~inMemoryStore, ~cb=res => resolve(. res))
        )
      }
    }) {
    | Ok() =>
      let elapsedTimeAfterProcess = timeRef->Hrtime.timeSince->Hrtime.toMillis->Hrtime.intFromMillis
      switch await DbFunctions.sql->IO.executeBatch(~inMemoryStore) {
      | exception exn =>
        exn->ErrorHandling.make(~msg="Failed writing batch to database", ~logger)->Error
      | () =>
        let elapsedTimeAfterDbWrite =
          timeRef->Hrtime.timeSince->Hrtime.toMillis->Hrtime.intFromMillis

        registerProcessEventBatchMetrics(
          ~logger,
          ~batchSize=eventBatchAndContext->Array.length,
          ~loadDuration=elapsedAfterLoad,
          ~handlerDuration=elapsedTimeAfterProcess - elapsedAfterLoad,
          ~dbWriteDuration=elapsedTimeAfterDbWrite - elapsedTimeAfterProcess,
        )

        {val: (), dynamicContractRegistrations}->Ok
      }
    | Error(e) => Error(e)
    }
  | Error(e) => Error(e)
  }
}
