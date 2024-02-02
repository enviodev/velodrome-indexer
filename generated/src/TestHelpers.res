open Belt
RegisterHandlers.registerAllHandlers()

/***** TAKE NOTE ******
This is a hack to get genType to work!

In order for genType to produce recursive types, it needs to be at the 
root module of a file. If it's defined in a nested module it does not 
work. So all the MockDb types and internal functions are defined in TestHelpers_MockDb
and only public functions are recreated and exported from this module.

the following module:
```rescript
module MyModule = {
  @genType
  type rec a = {fieldB: b}
  @genType and b = {fieldA: a}
}
```

produces the following in ts:
```ts
// tslint:disable-next-line:interface-over-type-literal
export type MyModule_a = { readonly fieldB: b };

// tslint:disable-next-line:interface-over-type-literal
export type MyModule_b = { readonly fieldA: MyModule_a };
```

fieldB references type b which doesn't exist because it's defined
as MyModule_b
*/

module MockDb = {
  @genType
  let createMockDb = TestHelpers_MockDb.createMockDb
}

module EventFunctions = {
  //Note these are made into a record to make operate in the same way
  //for Res, JS and TS.

  /**
  The arguements that get passed to a "processEvent" helper function
  */
  @genType
  type eventProcessorArgs<'eventArgs> = {
    event: Types.eventLog<'eventArgs>,
    mockDb: TestHelpers_MockDb.t,
    chainId?: int,
  }

  /**
  The default chain ID to use (ethereum mainnet) if a user does not specify int the 
  eventProcessor helper
  */
  let \"DEFAULT_CHAIN_ID" = 1

  /**
  A function composer to help create individual processEvent functions
  */
  let makeEventProcessor = (
    ~contextCreator: Context.contextCreator<
      'eventArgs,
      'loaderContext,
      'handlerContextSync,
      'handlerContextAsync,
    >,
    ~getLoader,
    ~eventWithContextAccessor: (
      Types.eventLog<'eventArgs>,
      Context.genericContextCreatorFunctions<
        'loaderContext,
        'handlerContextSync,
        'handlerContextAsync,
      >,
    ) => Context.eventAndContext,
    ~eventName: Types.eventName,
    ~cb: TestHelpers_MockDb.t => unit,
  ) => {
    ({event, mockDb, ?chainId}) => {
      //The user can specify a chainId of an event or leave it off
      //and it will default to "DEFAULT_CHAIN_ID"
      let chainId = chainId->Option.getWithDefault(\"DEFAULT_CHAIN_ID")

      //Create an individual logging context for traceability
      let logger = Logging.createChild(
        ~params={
          "Context": `Test Processor for ${eventName
            ->Types.eventName_encode
            ->Js.Json.stringify} Event`,
          "Chain ID": chainId,
          "event": event,
        },
      )

      //Deep copy the data in mockDb, mutate the clone and return the clone
      //So no side effects occur here and state can be compared between process
      //steps
      let mockDbClone = mockDb->TestHelpers_MockDb.cloneMockDb

      let asyncGetters: Context.entityGetters = {
        getGauge: async id =>
          mockDbClone.entities.gauge.get(id)->Belt.Option.mapWithDefault([], entity => [entity]),
        getLatestETHPrice: async id =>
          mockDbClone.entities.latestETHPrice.get(id)->Belt.Option.mapWithDefault([], entity => [
            entity,
          ]),
        getLiquidityPool: async id =>
          mockDbClone.entities.liquidityPool.get(id)->Belt.Option.mapWithDefault([], entity => [
            entity,
          ]),
        getLiquidityPoolDailySnapshot: async id =>
          mockDbClone.entities.liquidityPoolDailySnapshot.get(id)->Belt.Option.mapWithDefault(
            [],
            entity => [entity],
          ),
        getLiquidityPoolHourlySnapshot: async id =>
          mockDbClone.entities.liquidityPoolHourlySnapshot.get(id)->Belt.Option.mapWithDefault(
            [],
            entity => [entity],
          ),
        getLiquidityPoolUserMapping: async id =>
          mockDbClone.entities.liquidityPoolUserMapping.get(id)->Belt.Option.mapWithDefault(
            [],
            entity => [entity],
          ),
        getLiquidityPoolWeeklySnapshot: async id =>
          mockDbClone.entities.liquidityPoolWeeklySnapshot.get(id)->Belt.Option.mapWithDefault(
            [],
            entity => [entity],
          ),
        getStateStore: async id =>
          mockDbClone.entities.stateStore.get(id)->Belt.Option.mapWithDefault([], entity => [
            entity,
          ]),
        getToken: async id =>
          mockDbClone.entities.token.get(id)->Belt.Option.mapWithDefault([], entity => [entity]),
        getTokenDailySnapshot: async id =>
          mockDbClone.entities.tokenDailySnapshot.get(id)->Belt.Option.mapWithDefault(
            [],
            entity => [entity],
          ),
        getTokenHourlySnapshot: async id =>
          mockDbClone.entities.tokenHourlySnapshot.get(id)->Belt.Option.mapWithDefault(
            [],
            entity => [entity],
          ),
        getTokenWeeklySnapshot: async id =>
          mockDbClone.entities.tokenWeeklySnapshot.get(id)->Belt.Option.mapWithDefault(
            [],
            entity => [entity],
          ),
        getUser: async id =>
          mockDbClone.entities.user.get(id)->Belt.Option.mapWithDefault([], entity => [entity]),
      }

      //Construct a new instance of an in memory store to run for the given event
      let inMemoryStore = IO.InMemoryStore.make()

      //Construct a context with the inMemory store for the given event to run
      //loaders and handlers
      let context = contextCreator(~event, ~inMemoryStore, ~chainId, ~logger, ~asyncGetters)

      let loaderContext = context.getLoaderContext()

      let loader = getLoader()

      //Run the loader, to get all the read values/contract registrations
      //into the context
      loader(~event, ~context=loaderContext)

      //Get all the entities are requested to be loaded from the mockDB
      let entityBatch = context.getEntitiesToLoad()

      //Load requested entities from the cloned mockDb into the inMemoryStore
      mockDbClone->TestHelpers_MockDb.loadEntitiesToInMemStore(~entityBatch, ~inMemoryStore)

      //Run the event and handler context through the eventRouter
      //With inMemoryStore
      let eventAndContext: Context.eventRouterEventAndContext = {
        chainId,
        event: eventWithContextAccessor(event, context),
      }

      eventAndContext->EventProcessing.eventRouter(~inMemoryStore, ~cb=() => {
        //Now that the processing is finished. Simulate writing a batch
        //(Although in this case a batch of 1 event only) to the cloned mockDb
        mockDbClone->TestHelpers_MockDb.writeFromMemoryStore(~inMemoryStore)

        //Return the cloned mock db
        cb(mockDbClone)
      })
    }
  }

  /**Creates a mock event processor, wrapping the callback in a Promise for async use*/
  let makeAsyncEventProcessor = (
    ~contextCreator,
    ~getLoader,
    ~eventWithContextAccessor,
    ~eventName,
    eventProcessorArgs,
  ) => {
    Promise.make((res, _rej) => {
      makeEventProcessor(
        ~contextCreator,
        ~getLoader,
        ~eventWithContextAccessor,
        ~eventName,
        ~cb=mockDb => res(. mockDb),
        eventProcessorArgs,
      )
    })
  }

  /**
  Creates a mock event processor, exposing the return of the callback in the return,
  raises an exception if the handler is async
  */
  let makeSyncEventProcessor = (
    ~contextCreator,
    ~getLoader,
    ~eventWithContextAccessor,
    ~eventName,
    eventProcessorArgs,
  ) => {
    //Dangerously set to None, nextMockDb will be set in the callback
    let nextMockDb = ref(None)
    makeEventProcessor(
      ~contextCreator,
      ~getLoader,
      ~eventWithContextAccessor,
      ~eventName,
      ~cb=mockDb => nextMockDb := Some(mockDb),
      eventProcessorArgs,
    )

    //The callback is called synchronously so nextMockDb should be set.
    //In the case it's not set it would mean that the user is using an async handler
    //in which case we want to error and alert the user.
    switch nextMockDb.contents {
    | Some(mockDb) => mockDb
    | None =>
      Js.Exn.raiseError(
        "processEvent failed because handler is not synchronous, please use processEventAsync instead",
      )
    }
  }

  /**
  Optional params for all additional data related to an eventLog
  */
  @genType
  type mockEventData = {
    blockNumber?: int,
    blockTimestamp?: int,
    blockHash?: string,
    chainId?: int,
    srcAddress?: Ethers.ethAddress,
    transactionHash?: string,
    transactionIndex?: int,
    logIndex?: int,
  }

  /**
  Applies optional paramters with defaults for all common eventLog field
  */
  let makeEventMocker = (
    ~params: 'eventParams,
    ~mockEventData: option<mockEventData>,
  ): Types.eventLog<'eventParams> => {
    let {
      ?blockNumber,
      ?blockTimestamp,
      ?blockHash,
      ?srcAddress,
      ?chainId,
      ?transactionHash,
      ?transactionIndex,
      ?logIndex,
    } =
      mockEventData->Belt.Option.getWithDefault({})

    {
      params,
      chainId: chainId->Belt.Option.getWithDefault(1),
      blockNumber: blockNumber->Belt.Option.getWithDefault(0),
      blockTimestamp: blockTimestamp->Belt.Option.getWithDefault(0),
      blockHash: blockHash->Belt.Option.getWithDefault(Ethers.Constants.zeroHash),
      srcAddress: srcAddress->Belt.Option.getWithDefault(Ethers.Addresses.defaultAddress),
      transactionHash: transactionHash->Belt.Option.getWithDefault(Ethers.Constants.zeroHash),
      transactionIndex: transactionIndex->Belt.Option.getWithDefault(0),
      logIndex: logIndex->Belt.Option.getWithDefault(0),
    }
  }
}

module Pool = {
  module Fees = {
    @genType
    let processEvent = EventFunctions.makeSyncEventProcessor(
      ~contextCreator=Context.PoolContract.FeesEvent.contextCreator,
      ~getLoader=Handlers.PoolContract.Fees.getLoader,
      ~eventWithContextAccessor=Context.poolContract_FeesWithContext,
      ~eventName=Types.Pool_Fees,
    )

    @genType
    let processEventAsync = EventFunctions.makeAsyncEventProcessor(
      ~contextCreator=Context.PoolContract.FeesEvent.contextCreator,
      ~getLoader=Handlers.PoolContract.Fees.getLoader,
      ~eventWithContextAccessor=Context.poolContract_FeesWithContext,
      ~eventName=Types.Pool_Fees,
    )

    @genType
    type createMockArgs = {
      sender?: Ethers.ethAddress,
      amount0?: Ethers.BigInt.t,
      amount1?: Ethers.BigInt.t,
      mockEventData?: EventFunctions.mockEventData,
    }

    @genType
    let createMockEvent = args => {
      let {?sender, ?amount0, ?amount1, ?mockEventData} = args

      let params: Types.PoolContract.FeesEvent.eventArgs = {
        sender: sender->Belt.Option.getWithDefault(Ethers.Addresses.defaultAddress),
        amount0: amount0->Belt.Option.getWithDefault(Ethers.BigInt.zero),
        amount1: amount1->Belt.Option.getWithDefault(Ethers.BigInt.zero),
      }

      EventFunctions.makeEventMocker(~params, ~mockEventData)
    }
  }

  module Swap = {
    @genType
    let processEvent = EventFunctions.makeSyncEventProcessor(
      ~contextCreator=Context.PoolContract.SwapEvent.contextCreator,
      ~getLoader=Handlers.PoolContract.Swap.getLoader,
      ~eventWithContextAccessor=Context.poolContract_SwapWithContext,
      ~eventName=Types.Pool_Swap,
    )

    @genType
    let processEventAsync = EventFunctions.makeAsyncEventProcessor(
      ~contextCreator=Context.PoolContract.SwapEvent.contextCreator,
      ~getLoader=Handlers.PoolContract.Swap.getLoader,
      ~eventWithContextAccessor=Context.poolContract_SwapWithContext,
      ~eventName=Types.Pool_Swap,
    )

    @genType
    type createMockArgs = {
      sender?: Ethers.ethAddress,
      to?: Ethers.ethAddress,
      amount0In?: Ethers.BigInt.t,
      amount1In?: Ethers.BigInt.t,
      amount0Out?: Ethers.BigInt.t,
      amount1Out?: Ethers.BigInt.t,
      mockEventData?: EventFunctions.mockEventData,
    }

    @genType
    let createMockEvent = args => {
      let {?sender, ?to, ?amount0In, ?amount1In, ?amount0Out, ?amount1Out, ?mockEventData} = args

      let params: Types.PoolContract.SwapEvent.eventArgs = {
        sender: sender->Belt.Option.getWithDefault(Ethers.Addresses.defaultAddress),
        to: to->Belt.Option.getWithDefault(Ethers.Addresses.defaultAddress),
        amount0In: amount0In->Belt.Option.getWithDefault(Ethers.BigInt.zero),
        amount1In: amount1In->Belt.Option.getWithDefault(Ethers.BigInt.zero),
        amount0Out: amount0Out->Belt.Option.getWithDefault(Ethers.BigInt.zero),
        amount1Out: amount1Out->Belt.Option.getWithDefault(Ethers.BigInt.zero),
      }

      EventFunctions.makeEventMocker(~params, ~mockEventData)
    }
  }

  module Sync = {
    @genType
    let processEvent = EventFunctions.makeSyncEventProcessor(
      ~contextCreator=Context.PoolContract.SyncEvent.contextCreator,
      ~getLoader=Handlers.PoolContract.Sync.getLoader,
      ~eventWithContextAccessor=Context.poolContract_SyncWithContext,
      ~eventName=Types.Pool_Sync,
    )

    @genType
    let processEventAsync = EventFunctions.makeAsyncEventProcessor(
      ~contextCreator=Context.PoolContract.SyncEvent.contextCreator,
      ~getLoader=Handlers.PoolContract.Sync.getLoader,
      ~eventWithContextAccessor=Context.poolContract_SyncWithContext,
      ~eventName=Types.Pool_Sync,
    )

    @genType
    type createMockArgs = {
      reserve0?: Ethers.BigInt.t,
      reserve1?: Ethers.BigInt.t,
      mockEventData?: EventFunctions.mockEventData,
    }

    @genType
    let createMockEvent = args => {
      let {?reserve0, ?reserve1, ?mockEventData} = args

      let params: Types.PoolContract.SyncEvent.eventArgs = {
        reserve0: reserve0->Belt.Option.getWithDefault(Ethers.BigInt.zero),
        reserve1: reserve1->Belt.Option.getWithDefault(Ethers.BigInt.zero),
      }

      EventFunctions.makeEventMocker(~params, ~mockEventData)
    }
  }
}

module PoolFactory = {
  module PoolCreated = {
    @genType
    let processEvent = EventFunctions.makeSyncEventProcessor(
      ~contextCreator=Context.PoolFactoryContract.PoolCreatedEvent.contextCreator,
      ~getLoader=Handlers.PoolFactoryContract.PoolCreated.getLoader,
      ~eventWithContextAccessor=Context.poolFactoryContract_PoolCreatedWithContext,
      ~eventName=Types.PoolFactory_PoolCreated,
    )

    @genType
    let processEventAsync = EventFunctions.makeAsyncEventProcessor(
      ~contextCreator=Context.PoolFactoryContract.PoolCreatedEvent.contextCreator,
      ~getLoader=Handlers.PoolFactoryContract.PoolCreated.getLoader,
      ~eventWithContextAccessor=Context.poolFactoryContract_PoolCreatedWithContext,
      ~eventName=Types.PoolFactory_PoolCreated,
    )

    @genType
    type createMockArgs = {
      token0?: Ethers.ethAddress,
      token1?: Ethers.ethAddress,
      stable?: bool,
      pool?: Ethers.ethAddress,
      unnamed?: Ethers.BigInt.t,
      mockEventData?: EventFunctions.mockEventData,
    }

    @genType
    let createMockEvent = args => {
      let {?token0, ?token1, ?stable, ?pool, ?unnamed, ?mockEventData} = args

      let params: Types.PoolFactoryContract.PoolCreatedEvent.eventArgs = {
        token0: token0->Belt.Option.getWithDefault(Ethers.Addresses.defaultAddress),
        token1: token1->Belt.Option.getWithDefault(Ethers.Addresses.defaultAddress),
        stable: stable->Belt.Option.getWithDefault(false),
        pool: pool->Belt.Option.getWithDefault(Ethers.Addresses.defaultAddress),
        unnamed: unnamed->Belt.Option.getWithDefault(Ethers.BigInt.zero),
      }

      EventFunctions.makeEventMocker(~params, ~mockEventData)
    }
  }
}

module Voter = {
  module DistributeReward = {
    @genType
    let processEvent = EventFunctions.makeSyncEventProcessor(
      ~contextCreator=Context.VoterContract.DistributeRewardEvent.contextCreator,
      ~getLoader=Handlers.VoterContract.DistributeReward.getLoader,
      ~eventWithContextAccessor=Context.voterContract_DistributeRewardWithContext,
      ~eventName=Types.Voter_DistributeReward,
    )

    @genType
    let processEventAsync = EventFunctions.makeAsyncEventProcessor(
      ~contextCreator=Context.VoterContract.DistributeRewardEvent.contextCreator,
      ~getLoader=Handlers.VoterContract.DistributeReward.getLoader,
      ~eventWithContextAccessor=Context.voterContract_DistributeRewardWithContext,
      ~eventName=Types.Voter_DistributeReward,
    )

    @genType
    type createMockArgs = {
      sender?: Ethers.ethAddress,
      gauge?: Ethers.ethAddress,
      amount?: Ethers.BigInt.t,
      mockEventData?: EventFunctions.mockEventData,
    }

    @genType
    let createMockEvent = args => {
      let {?sender, ?gauge, ?amount, ?mockEventData} = args

      let params: Types.VoterContract.DistributeRewardEvent.eventArgs = {
        sender: sender->Belt.Option.getWithDefault(Ethers.Addresses.defaultAddress),
        gauge: gauge->Belt.Option.getWithDefault(Ethers.Addresses.defaultAddress),
        amount: amount->Belt.Option.getWithDefault(Ethers.BigInt.zero),
      }

      EventFunctions.makeEventMocker(~params, ~mockEventData)
    }
  }

  module GaugeCreated = {
    @genType
    let processEvent = EventFunctions.makeSyncEventProcessor(
      ~contextCreator=Context.VoterContract.GaugeCreatedEvent.contextCreator,
      ~getLoader=Handlers.VoterContract.GaugeCreated.getLoader,
      ~eventWithContextAccessor=Context.voterContract_GaugeCreatedWithContext,
      ~eventName=Types.Voter_GaugeCreated,
    )

    @genType
    let processEventAsync = EventFunctions.makeAsyncEventProcessor(
      ~contextCreator=Context.VoterContract.GaugeCreatedEvent.contextCreator,
      ~getLoader=Handlers.VoterContract.GaugeCreated.getLoader,
      ~eventWithContextAccessor=Context.voterContract_GaugeCreatedWithContext,
      ~eventName=Types.Voter_GaugeCreated,
    )

    @genType
    type createMockArgs = {
      poolFactory?: Ethers.ethAddress,
      votingRewardsFactory?: Ethers.ethAddress,
      gaugeFactory?: Ethers.ethAddress,
      pool?: Ethers.ethAddress,
      bribeVotingReward?: Ethers.ethAddress,
      feeVotingReward?: Ethers.ethAddress,
      gauge?: Ethers.ethAddress,
      creator?: Ethers.ethAddress,
      mockEventData?: EventFunctions.mockEventData,
    }

    @genType
    let createMockEvent = args => {
      let {
        ?poolFactory,
        ?votingRewardsFactory,
        ?gaugeFactory,
        ?pool,
        ?bribeVotingReward,
        ?feeVotingReward,
        ?gauge,
        ?creator,
        ?mockEventData,
      } = args

      let params: Types.VoterContract.GaugeCreatedEvent.eventArgs = {
        poolFactory: poolFactory->Belt.Option.getWithDefault(Ethers.Addresses.defaultAddress),
        votingRewardsFactory: votingRewardsFactory->Belt.Option.getWithDefault(
          Ethers.Addresses.defaultAddress,
        ),
        gaugeFactory: gaugeFactory->Belt.Option.getWithDefault(Ethers.Addresses.defaultAddress),
        pool: pool->Belt.Option.getWithDefault(Ethers.Addresses.defaultAddress),
        bribeVotingReward: bribeVotingReward->Belt.Option.getWithDefault(
          Ethers.Addresses.defaultAddress,
        ),
        feeVotingReward: feeVotingReward->Belt.Option.getWithDefault(
          Ethers.Addresses.defaultAddress,
        ),
        gauge: gauge->Belt.Option.getWithDefault(Ethers.Addresses.defaultAddress),
        creator: creator->Belt.Option.getWithDefault(Ethers.Addresses.defaultAddress),
      }

      EventFunctions.makeEventMocker(~params, ~mockEventData)
    }
  }
}
