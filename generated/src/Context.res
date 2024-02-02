type entityGetters = {
  getGauge: Types.id => promise<array<Types.gaugeEntity>>,
  getLatestETHPrice: Types.id => promise<array<Types.latestETHPriceEntity>>,
  getLiquidityPool: Types.id => promise<array<Types.liquidityPoolEntity>>,
  getLiquidityPoolDailySnapshot: Types.id => promise<array<Types.liquidityPoolDailySnapshotEntity>>,
  getLiquidityPoolHourlySnapshot: Types.id => promise<
    array<Types.liquidityPoolHourlySnapshotEntity>,
  >,
  getLiquidityPoolUserMapping: Types.id => promise<array<Types.liquidityPoolUserMappingEntity>>,
  getLiquidityPoolWeeklySnapshot: Types.id => promise<
    array<Types.liquidityPoolWeeklySnapshotEntity>,
  >,
  getStateStore: Types.id => promise<array<Types.stateStoreEntity>>,
  getToken: Types.id => promise<array<Types.tokenEntity>>,
  getTokenDailySnapshot: Types.id => promise<array<Types.tokenDailySnapshotEntity>>,
  getTokenHourlySnapshot: Types.id => promise<array<Types.tokenHourlySnapshotEntity>>,
  getTokenWeeklySnapshot: Types.id => promise<array<Types.tokenWeeklySnapshotEntity>>,
  getUser: Types.id => promise<array<Types.userEntity>>,
}

@genType
type genericContextCreatorFunctions<'loaderContext, 'handlerContextSync, 'handlerContextAsync> = {
  log: Logs.userLogger,
  getLoaderContext: unit => 'loaderContext,
  getHandlerContextSync: unit => 'handlerContextSync,
  getHandlerContextAsync: unit => 'handlerContextAsync,
  getEntitiesToLoad: unit => array<Types.entityRead>,
  getAddedDynamicContractRegistrations: unit => array<Types.dynamicContractRegistryEntity>,
}

type contextCreator<'eventArgs, 'loaderContext, 'handlerContext, 'handlerContextAsync> = (
  ~inMemoryStore: IO.InMemoryStore.t,
  ~chainId: int,
  ~event: Types.eventLog<'eventArgs>,
  ~logger: Pino.t,
  ~asyncGetters: entityGetters,
) => genericContextCreatorFunctions<'loaderContext, 'handlerContext, 'handlerContextAsync>

exception UnableToLoadNonNullableLinkedEntity(string)
exception LinkedEntityNotAvailableInSyncHandler(string)

module PoolContract = {
  module FeesEvent = {
    type loaderContext = Types.PoolContract.FeesEvent.loaderContext
    type handlerContext = Types.PoolContract.FeesEvent.handlerContext
    type handlerContextAsync = Types.PoolContract.FeesEvent.handlerContextAsync
    type context = genericContextCreatorFunctions<
      loaderContext,
      handlerContext,
      handlerContextAsync,
    >

    let contextCreator: contextCreator<
      Types.PoolContract.FeesEvent.eventArgs,
      loaderContext,
      handlerContext,
      handlerContextAsync,
    > = (~inMemoryStore, ~chainId, ~event, ~logger, ~asyncGetters) => {
      // NOTE: we could optimise this code to onle create a logger if there was a log called.
      let logger = logger->Logging.createChildFrom(
        ~logger=_,
        ~params={
          "context": "Pool.Fees",
          "chainId": chainId,
          "block": event.blockNumber,
          "logIndex": event.logIndex,
          "txHash": event.transactionHash,
        },
      )

      let contextLogger: Logs.userLogger = {
        info: (message: string) => logger->Logging.uinfo(message),
        debug: (message: string) => logger->Logging.udebug(message),
        warn: (message: string) => logger->Logging.uwarn(message),
        error: (message: string) => logger->Logging.uerror(message),
        errorWithExn: (exn: option<Js.Exn.t>, message: string) =>
          logger->Logging.uerrorWithExn(exn, message),
      }

      let optSetOfIds_liquidityPool: Set.t<Types.id> = Set.make()

      let entitiesToLoad: array<Types.entityRead> = []

      let addedDynamicContractRegistrations: array<Types.dynamicContractRegistryEntity> = []

      //Loader context can be defined as a value and the getter can return that value

      @warning("-16")
      let loaderContext: loaderContext = {
        log: contextLogger,
        contractRegistration: {
          //TODO only add contracts we've registered for the event in the config
          addPool: (contractAddress: Ethers.ethAddress) => {
            let eventId = EventUtils.packEventIndex(
              ~blockNumber=event.blockNumber,
              ~logIndex=event.logIndex,
            )
            let dynamicContractRegistration: Types.dynamicContractRegistryEntity = {
              chainId,
              eventId,
              contractAddress,
              contractType: "Pool",
            }

            addedDynamicContractRegistrations->Js.Array2.push(dynamicContractRegistration)->ignore

            inMemoryStore.dynamicContractRegistry->IO.InMemoryStore.DynamicContractRegistry.set(
              ~key={chainId, contractAddress},
              ~entity=dynamicContractRegistration,
              ~dbOp=Set,
            )
          },
          //TODO only add contracts we've registered for the event in the config
          addPoolFactory: (contractAddress: Ethers.ethAddress) => {
            let eventId = EventUtils.packEventIndex(
              ~blockNumber=event.blockNumber,
              ~logIndex=event.logIndex,
            )
            let dynamicContractRegistration: Types.dynamicContractRegistryEntity = {
              chainId,
              eventId,
              contractAddress,
              contractType: "PoolFactory",
            }

            addedDynamicContractRegistrations->Js.Array2.push(dynamicContractRegistration)->ignore

            inMemoryStore.dynamicContractRegistry->IO.InMemoryStore.DynamicContractRegistry.set(
              ~key={chainId, contractAddress},
              ~entity=dynamicContractRegistration,
              ~dbOp=Set,
            )
          },
          //TODO only add contracts we've registered for the event in the config
          addVoter: (contractAddress: Ethers.ethAddress) => {
            let eventId = EventUtils.packEventIndex(
              ~blockNumber=event.blockNumber,
              ~logIndex=event.logIndex,
            )
            let dynamicContractRegistration: Types.dynamicContractRegistryEntity = {
              chainId,
              eventId,
              contractAddress,
              contractType: "Voter",
            }

            addedDynamicContractRegistrations->Js.Array2.push(dynamicContractRegistration)->ignore

            inMemoryStore.dynamicContractRegistry->IO.InMemoryStore.DynamicContractRegistry.set(
              ~key={chainId, contractAddress},
              ~entity=dynamicContractRegistration,
              ~dbOp=Set,
            )
          },
        },
        liquidityPool: {
          load: (id: Types.id, ~loaders={}) => {
            let _ = optSetOfIds_liquidityPool->Set.add(id)
            let _ = Js.Array2.push(entitiesToLoad, Types.LiquidityPoolRead(id, loaders))
          },
        },
      }

      //handler context must be defined as a getter functoin so that it can construct the context
      //without stale values whenever it is used
      let getHandlerContextSync: unit => handlerContext = () => {
        {
          log: contextLogger,
          gauge: {
            set: entity => {
              inMemoryStore.gauge->IO.InMemoryStore.Gauge.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(`[unimplemented delete] can't delete entity(gauge) with ID ${id}.`),
            getPool: gauge => {
              let optPool =
                inMemoryStore.liquidityPool->IO.InMemoryStore.LiquidityPool.get(gauge.pool)
              switch optPool {
              | Some(pool) => pool
              | None =>
                Logging.warn(`Gauge pool data not found. Loading associated liquidityPool from database.
Please consider loading the liquidityPool in the UpdateGauge entity loader to greatly improve sync speed of your application.
`)

                raise(
                  LinkedEntityNotAvailableInSyncHandler(
                    "The required linked entity of Gauge is undefined.",
                  ),
                )
              }
            },
          },
          latestETHPrice: {
            set: entity => {
              inMemoryStore.latestETHPrice->IO.InMemoryStore.LatestETHPrice.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(latestETHPrice) with ID ${id}.`,
              ),
          },
          liquidityPool: {
            set: entity => {
              inMemoryStore.liquidityPool->IO.InMemoryStore.LiquidityPool.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(liquidityPool) with ID ${id}.`,
              ),
            get: (id: Types.id) => {
              if optSetOfIds_liquidityPool->Set.has(id) {
                inMemoryStore.liquidityPool->IO.InMemoryStore.LiquidityPool.get(id)
              } else {
                Logging.warn(
                  `The loader for a "LiquidityPool" of entity with id "${id}" was not used please add it to your default loader function (ie. place 'context.liquidityPool.load("${id}")' inside your loader) to avoid unexpected behaviour. This is a runtime validation check.`,
                )

                // NOTE: this will still retern the value if it exists in the in-memory store (despite the loader not being run).
                inMemoryStore.liquidityPool->IO.InMemoryStore.LiquidityPool.get(id)

                // TODO: add a further step to syncronously try fetch this from the DB if it isn't in the in-memory store - similar to this PR: https://github.com/Float-Capital/indexer/pull/759
              }
            },
            getToken0: liquidityPool => {
              let optToken0 = inMemoryStore.token->IO.InMemoryStore.Token.get(liquidityPool.token0)
              switch optToken0 {
              | Some(token0) => token0
              | None =>
                Logging.warn(`LiquidityPool token0 data not found. Loading associated token from database.
Please consider loading the token in the UpdateLiquidityPool entity loader to greatly improve sync speed of your application.
`)

                raise(
                  LinkedEntityNotAvailableInSyncHandler(
                    "The required linked entity of LiquidityPool is undefined.",
                  ),
                )
              }
            },
            getToken1: liquidityPool => {
              let optToken1 = inMemoryStore.token->IO.InMemoryStore.Token.get(liquidityPool.token1)
              switch optToken1 {
              | Some(token1) => token1
              | None =>
                Logging.warn(`LiquidityPool token1 data not found. Loading associated token from database.
Please consider loading the token in the UpdateLiquidityPool entity loader to greatly improve sync speed of your application.
`)

                raise(
                  LinkedEntityNotAvailableInSyncHandler(
                    "The required linked entity of LiquidityPool is undefined.",
                  ),
                )
              }
            },
          },
          liquidityPoolDailySnapshot: {
            set: entity => {
              inMemoryStore.liquidityPoolDailySnapshot->IO.InMemoryStore.LiquidityPoolDailySnapshot.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(liquidityPoolDailySnapshot) with ID ${id}.`,
              ),
          },
          liquidityPoolHourlySnapshot: {
            set: entity => {
              inMemoryStore.liquidityPoolHourlySnapshot->IO.InMemoryStore.LiquidityPoolHourlySnapshot.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(liquidityPoolHourlySnapshot) with ID ${id}.`,
              ),
          },
          liquidityPoolUserMapping: {
            set: entity => {
              inMemoryStore.liquidityPoolUserMapping->IO.InMemoryStore.LiquidityPoolUserMapping.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(liquidityPoolUserMapping) with ID ${id}.`,
              ),
            getLiquidityPool: liquidityPoolUserMapping => {
              let optLiquidityPool =
                inMemoryStore.liquidityPool->IO.InMemoryStore.LiquidityPool.get(
                  liquidityPoolUserMapping.liquidityPool,
                )
              switch optLiquidityPool {
              | Some(liquidityPool) => liquidityPool
              | None =>
                Logging.warn(`LiquidityPoolUserMapping liquidityPool data not found. Loading associated liquidityPool from database.
Please consider loading the liquidityPool in the UpdateLiquidityPoolUserMapping entity loader to greatly improve sync speed of your application.
`)

                raise(
                  LinkedEntityNotAvailableInSyncHandler(
                    "The required linked entity of LiquidityPoolUserMapping is undefined.",
                  ),
                )
              }
            },
            getUser: liquidityPoolUserMapping => {
              let optUser =
                inMemoryStore.user->IO.InMemoryStore.User.get(liquidityPoolUserMapping.user)
              switch optUser {
              | Some(user) => user
              | None =>
                Logging.warn(`LiquidityPoolUserMapping user data not found. Loading associated user from database.
Please consider loading the user in the UpdateLiquidityPoolUserMapping entity loader to greatly improve sync speed of your application.
`)

                raise(
                  LinkedEntityNotAvailableInSyncHandler(
                    "The required linked entity of LiquidityPoolUserMapping is undefined.",
                  ),
                )
              }
            },
          },
          liquidityPoolWeeklySnapshot: {
            set: entity => {
              inMemoryStore.liquidityPoolWeeklySnapshot->IO.InMemoryStore.LiquidityPoolWeeklySnapshot.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(liquidityPoolWeeklySnapshot) with ID ${id}.`,
              ),
          },
          stateStore: {
            set: entity => {
              inMemoryStore.stateStore->IO.InMemoryStore.StateStore.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(`[unimplemented delete] can't delete entity(stateStore) with ID ${id}.`),
            getLatestEthPrice: stateStore => {
              let optLatestEthPrice =
                inMemoryStore.latestETHPrice->IO.InMemoryStore.LatestETHPrice.get(
                  stateStore.latestEthPrice,
                )
              switch optLatestEthPrice {
              | Some(latestEthPrice) => latestEthPrice
              | None =>
                Logging.warn(`StateStore latestEthPrice data not found. Loading associated latestETHPrice from database.
Please consider loading the latestETHPrice in the UpdateStateStore entity loader to greatly improve sync speed of your application.
`)

                raise(
                  LinkedEntityNotAvailableInSyncHandler(
                    "The required linked entity of StateStore is undefined.",
                  ),
                )
              }
            },
          },
          token: {
            set: entity => {
              inMemoryStore.token->IO.InMemoryStore.Token.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(`[unimplemented delete] can't delete entity(token) with ID ${id}.`),
          },
          tokenDailySnapshot: {
            set: entity => {
              inMemoryStore.tokenDailySnapshot->IO.InMemoryStore.TokenDailySnapshot.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(tokenDailySnapshot) with ID ${id}.`,
              ),
          },
          tokenHourlySnapshot: {
            set: entity => {
              inMemoryStore.tokenHourlySnapshot->IO.InMemoryStore.TokenHourlySnapshot.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(tokenHourlySnapshot) with ID ${id}.`,
              ),
          },
          tokenWeeklySnapshot: {
            set: entity => {
              inMemoryStore.tokenWeeklySnapshot->IO.InMemoryStore.TokenWeeklySnapshot.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(tokenWeeklySnapshot) with ID ${id}.`,
              ),
          },
          user: {
            set: entity => {
              inMemoryStore.user->IO.InMemoryStore.User.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(`[unimplemented delete] can't delete entity(user) with ID ${id}.`),
          },
        }
      }

      let getHandlerContextAsync = (): handlerContextAsync => {
        {
          log: contextLogger,
          gauge: {
            set: entity => {
              inMemoryStore.gauge->IO.InMemoryStore.Gauge.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(`[unimplemented delete] can't delete entity(gauge) with ID ${id}.`),
            getPool: async gauge => {
              let pool_field = gauge.pool
              let optPool =
                inMemoryStore.liquidityPool->IO.InMemoryStore.LiquidityPool.get(pool_field)
              switch optPool {
              | Some(pool) => pool
              | None =>
                let entities = await asyncGetters.getLiquidityPool(pool_field)

                switch entities->Belt.Array.get(0) {
                | Some(entity) =>
                  // TODO: make this work with the test framework too.
                  IO.InMemoryStore.LiquidityPool.set(
                    inMemoryStore.liquidityPool,
                    ~key=entity.id,
                    ~dbOp=Types.Read,
                    ~entity,
                  )
                  entity
                | None =>
                  Logging.error(`Gauge pool data not found. Loading associated liquidityPool from database.
This is likely due to a database corruption. Please reach out to the team on discord.
`)

                  raise(
                    UnableToLoadNonNullableLinkedEntity(
                      "The required linked entity pool of Gauge is undefined.",
                    ),
                  )
                }
              }
            },
          },
          latestETHPrice: {
            set: entity => {
              inMemoryStore.latestETHPrice->IO.InMemoryStore.LatestETHPrice.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(latestETHPrice) with ID ${id}.`,
              ),
          },
          liquidityPool: {
            set: entity => {
              inMemoryStore.liquidityPool->IO.InMemoryStore.LiquidityPool.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(liquidityPool) with ID ${id}.`,
              ),
            get: async (id: Types.id) => {
              if optSetOfIds_liquidityPool->Set.has(id) {
                inMemoryStore.liquidityPool->IO.InMemoryStore.LiquidityPool.get(id)
              } else {
                // NOTE: this will still retern the value if it exists in the in-memory store (despite the loader not being run).
                switch inMemoryStore.liquidityPool->IO.InMemoryStore.LiquidityPool.get(id) {
                | Some(entity) => Some(entity)
                | None =>
                  let entities = await asyncGetters.getLiquidityPool(id)

                  switch entities->Belt.Array.get(0) {
                  | Some(entity) =>
                    // TODO: make this work with the test framework too.
                    IO.InMemoryStore.LiquidityPool.set(
                      inMemoryStore.liquidityPool,
                      ~key=entity.id,
                      ~dbOp=Types.Read,
                      ~entity,
                    )
                    Some(entity)
                  | None => None
                  }
                }
              }
            },
            getToken0: async liquidityPool => {
              let token0_field = liquidityPool.token0
              let optToken0 = inMemoryStore.token->IO.InMemoryStore.Token.get(token0_field)
              switch optToken0 {
              | Some(token0) => token0
              | None =>
                let entities = await asyncGetters.getToken(token0_field)

                switch entities->Belt.Array.get(0) {
                | Some(entity) =>
                  // TODO: make this work with the test framework too.
                  IO.InMemoryStore.Token.set(
                    inMemoryStore.token,
                    ~key=entity.id,
                    ~dbOp=Types.Read,
                    ~entity,
                  )
                  entity
                | None =>
                  Logging.error(`LiquidityPool token0 data not found. Loading associated token from database.
This is likely due to a database corruption. Please reach out to the team on discord.
`)

                  raise(
                    UnableToLoadNonNullableLinkedEntity(
                      "The required linked entity token0 of LiquidityPool is undefined.",
                    ),
                  )
                }
              }
            },
            getToken1: async liquidityPool => {
              let token1_field = liquidityPool.token1
              let optToken1 = inMemoryStore.token->IO.InMemoryStore.Token.get(token1_field)
              switch optToken1 {
              | Some(token1) => token1
              | None =>
                let entities = await asyncGetters.getToken(token1_field)

                switch entities->Belt.Array.get(0) {
                | Some(entity) =>
                  // TODO: make this work with the test framework too.
                  IO.InMemoryStore.Token.set(
                    inMemoryStore.token,
                    ~key=entity.id,
                    ~dbOp=Types.Read,
                    ~entity,
                  )
                  entity
                | None =>
                  Logging.error(`LiquidityPool token1 data not found. Loading associated token from database.
This is likely due to a database corruption. Please reach out to the team on discord.
`)

                  raise(
                    UnableToLoadNonNullableLinkedEntity(
                      "The required linked entity token1 of LiquidityPool is undefined.",
                    ),
                  )
                }
              }
            },
          },
          liquidityPoolDailySnapshot: {
            set: entity => {
              inMemoryStore.liquidityPoolDailySnapshot->IO.InMemoryStore.LiquidityPoolDailySnapshot.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(liquidityPoolDailySnapshot) with ID ${id}.`,
              ),
          },
          liquidityPoolHourlySnapshot: {
            set: entity => {
              inMemoryStore.liquidityPoolHourlySnapshot->IO.InMemoryStore.LiquidityPoolHourlySnapshot.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(liquidityPoolHourlySnapshot) with ID ${id}.`,
              ),
          },
          liquidityPoolUserMapping: {
            set: entity => {
              inMemoryStore.liquidityPoolUserMapping->IO.InMemoryStore.LiquidityPoolUserMapping.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(liquidityPoolUserMapping) with ID ${id}.`,
              ),
            getLiquidityPool: async liquidityPoolUserMapping => {
              let liquidityPool_field = liquidityPoolUserMapping.liquidityPool
              let optLiquidityPool =
                inMemoryStore.liquidityPool->IO.InMemoryStore.LiquidityPool.get(liquidityPool_field)
              switch optLiquidityPool {
              | Some(liquidityPool) => liquidityPool
              | None =>
                let entities = await asyncGetters.getLiquidityPool(liquidityPool_field)

                switch entities->Belt.Array.get(0) {
                | Some(entity) =>
                  // TODO: make this work with the test framework too.
                  IO.InMemoryStore.LiquidityPool.set(
                    inMemoryStore.liquidityPool,
                    ~key=entity.id,
                    ~dbOp=Types.Read,
                    ~entity,
                  )
                  entity
                | None =>
                  Logging.error(`LiquidityPoolUserMapping liquidityPool data not found. Loading associated liquidityPool from database.
This is likely due to a database corruption. Please reach out to the team on discord.
`)

                  raise(
                    UnableToLoadNonNullableLinkedEntity(
                      "The required linked entity liquidityPool of LiquidityPoolUserMapping is undefined.",
                    ),
                  )
                }
              }
            },
            getUser: async liquidityPoolUserMapping => {
              let user_field = liquidityPoolUserMapping.user
              let optUser = inMemoryStore.user->IO.InMemoryStore.User.get(user_field)
              switch optUser {
              | Some(user) => user
              | None =>
                let entities = await asyncGetters.getUser(user_field)

                switch entities->Belt.Array.get(0) {
                | Some(entity) =>
                  // TODO: make this work with the test framework too.
                  IO.InMemoryStore.User.set(
                    inMemoryStore.user,
                    ~key=entity.id,
                    ~dbOp=Types.Read,
                    ~entity,
                  )
                  entity
                | None =>
                  Logging.error(`LiquidityPoolUserMapping user data not found. Loading associated user from database.
This is likely due to a database corruption. Please reach out to the team on discord.
`)

                  raise(
                    UnableToLoadNonNullableLinkedEntity(
                      "The required linked entity user of LiquidityPoolUserMapping is undefined.",
                    ),
                  )
                }
              }
            },
          },
          liquidityPoolWeeklySnapshot: {
            set: entity => {
              inMemoryStore.liquidityPoolWeeklySnapshot->IO.InMemoryStore.LiquidityPoolWeeklySnapshot.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(liquidityPoolWeeklySnapshot) with ID ${id}.`,
              ),
          },
          stateStore: {
            set: entity => {
              inMemoryStore.stateStore->IO.InMemoryStore.StateStore.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(`[unimplemented delete] can't delete entity(stateStore) with ID ${id}.`),
            getLatestEthPrice: async stateStore => {
              let latestEthPrice_field = stateStore.latestEthPrice
              let optLatestEthPrice =
                inMemoryStore.latestETHPrice->IO.InMemoryStore.LatestETHPrice.get(
                  latestEthPrice_field,
                )
              switch optLatestEthPrice {
              | Some(latestEthPrice) => latestEthPrice
              | None =>
                let entities = await asyncGetters.getLatestETHPrice(latestEthPrice_field)

                switch entities->Belt.Array.get(0) {
                | Some(entity) =>
                  // TODO: make this work with the test framework too.
                  IO.InMemoryStore.LatestETHPrice.set(
                    inMemoryStore.latestETHPrice,
                    ~key=entity.id,
                    ~dbOp=Types.Read,
                    ~entity,
                  )
                  entity
                | None =>
                  Logging.error(`StateStore latestEthPrice data not found. Loading associated latestETHPrice from database.
This is likely due to a database corruption. Please reach out to the team on discord.
`)

                  raise(
                    UnableToLoadNonNullableLinkedEntity(
                      "The required linked entity latestEthPrice of StateStore is undefined.",
                    ),
                  )
                }
              }
            },
          },
          token: {
            set: entity => {
              inMemoryStore.token->IO.InMemoryStore.Token.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(`[unimplemented delete] can't delete entity(token) with ID ${id}.`),
          },
          tokenDailySnapshot: {
            set: entity => {
              inMemoryStore.tokenDailySnapshot->IO.InMemoryStore.TokenDailySnapshot.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(tokenDailySnapshot) with ID ${id}.`,
              ),
          },
          tokenHourlySnapshot: {
            set: entity => {
              inMemoryStore.tokenHourlySnapshot->IO.InMemoryStore.TokenHourlySnapshot.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(tokenHourlySnapshot) with ID ${id}.`,
              ),
          },
          tokenWeeklySnapshot: {
            set: entity => {
              inMemoryStore.tokenWeeklySnapshot->IO.InMemoryStore.TokenWeeklySnapshot.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(tokenWeeklySnapshot) with ID ${id}.`,
              ),
          },
          user: {
            set: entity => {
              inMemoryStore.user->IO.InMemoryStore.User.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(`[unimplemented delete] can't delete entity(user) with ID ${id}.`),
          },
        }
      }

      {
        log: contextLogger,
        getEntitiesToLoad: () => entitiesToLoad,
        getAddedDynamicContractRegistrations: () => addedDynamicContractRegistrations,
        getLoaderContext: () => loaderContext,
        getHandlerContextSync,
        getHandlerContextAsync,
      }
    }
  }

  module SwapEvent = {
    type loaderContext = Types.PoolContract.SwapEvent.loaderContext
    type handlerContext = Types.PoolContract.SwapEvent.handlerContext
    type handlerContextAsync = Types.PoolContract.SwapEvent.handlerContextAsync
    type context = genericContextCreatorFunctions<
      loaderContext,
      handlerContext,
      handlerContextAsync,
    >

    let contextCreator: contextCreator<
      Types.PoolContract.SwapEvent.eventArgs,
      loaderContext,
      handlerContext,
      handlerContextAsync,
    > = (~inMemoryStore, ~chainId, ~event, ~logger, ~asyncGetters) => {
      // NOTE: we could optimise this code to onle create a logger if there was a log called.
      let logger = logger->Logging.createChildFrom(
        ~logger=_,
        ~params={
          "context": "Pool.Swap",
          "chainId": chainId,
          "block": event.blockNumber,
          "logIndex": event.logIndex,
          "txHash": event.transactionHash,
        },
      )

      let contextLogger: Logs.userLogger = {
        info: (message: string) => logger->Logging.uinfo(message),
        debug: (message: string) => logger->Logging.udebug(message),
        warn: (message: string) => logger->Logging.uwarn(message),
        error: (message: string) => logger->Logging.uerror(message),
        errorWithExn: (exn: option<Js.Exn.t>, message: string) =>
          logger->Logging.uerrorWithExn(exn, message),
      }

      let optSetOfIds_liquidityPool: Set.t<Types.id> = Set.make()
      let optSetOfIds_liquidityPoolUserMapping: Set.t<Types.id> = Set.make()
      let optIdOf_user = ref(None)
      let optSetOfIds_user: Set.t<Types.id> = Set.make()

      let entitiesToLoad: array<Types.entityRead> = []

      let addedDynamicContractRegistrations: array<Types.dynamicContractRegistryEntity> = []

      //Loader context can be defined as a value and the getter can return that value

      @warning("-16")
      let loaderContext: loaderContext = {
        log: contextLogger,
        contractRegistration: {
          //TODO only add contracts we've registered for the event in the config
          addPool: (contractAddress: Ethers.ethAddress) => {
            let eventId = EventUtils.packEventIndex(
              ~blockNumber=event.blockNumber,
              ~logIndex=event.logIndex,
            )
            let dynamicContractRegistration: Types.dynamicContractRegistryEntity = {
              chainId,
              eventId,
              contractAddress,
              contractType: "Pool",
            }

            addedDynamicContractRegistrations->Js.Array2.push(dynamicContractRegistration)->ignore

            inMemoryStore.dynamicContractRegistry->IO.InMemoryStore.DynamicContractRegistry.set(
              ~key={chainId, contractAddress},
              ~entity=dynamicContractRegistration,
              ~dbOp=Set,
            )
          },
          //TODO only add contracts we've registered for the event in the config
          addPoolFactory: (contractAddress: Ethers.ethAddress) => {
            let eventId = EventUtils.packEventIndex(
              ~blockNumber=event.blockNumber,
              ~logIndex=event.logIndex,
            )
            let dynamicContractRegistration: Types.dynamicContractRegistryEntity = {
              chainId,
              eventId,
              contractAddress,
              contractType: "PoolFactory",
            }

            addedDynamicContractRegistrations->Js.Array2.push(dynamicContractRegistration)->ignore

            inMemoryStore.dynamicContractRegistry->IO.InMemoryStore.DynamicContractRegistry.set(
              ~key={chainId, contractAddress},
              ~entity=dynamicContractRegistration,
              ~dbOp=Set,
            )
          },
          //TODO only add contracts we've registered for the event in the config
          addVoter: (contractAddress: Ethers.ethAddress) => {
            let eventId = EventUtils.packEventIndex(
              ~blockNumber=event.blockNumber,
              ~logIndex=event.logIndex,
            )
            let dynamicContractRegistration: Types.dynamicContractRegistryEntity = {
              chainId,
              eventId,
              contractAddress,
              contractType: "Voter",
            }

            addedDynamicContractRegistrations->Js.Array2.push(dynamicContractRegistration)->ignore

            inMemoryStore.dynamicContractRegistry->IO.InMemoryStore.DynamicContractRegistry.set(
              ~key={chainId, contractAddress},
              ~entity=dynamicContractRegistration,
              ~dbOp=Set,
            )
          },
        },
        liquidityPool: {
          load: (id: Types.id, ~loaders={}) => {
            let _ = optSetOfIds_liquidityPool->Set.add(id)
            let _ = Js.Array2.push(entitiesToLoad, Types.LiquidityPoolRead(id, loaders))
          },
        },
        liquidityPoolUserMapping: {
          load: (id: Types.id, ~loaders={}) => {
            let _ = optSetOfIds_liquidityPoolUserMapping->Set.add(id)
            let _ = Js.Array2.push(entitiesToLoad, Types.LiquidityPoolUserMappingRead(id, loaders))
          },
        },
        user: {
          userLoad: (id: Types.id) => {
            optIdOf_user := Some(id)

            let _ = Js.Array2.push(entitiesToLoad, Types.UserRead(id))
          },
          load: (id: Types.id) => {
            let _ = optSetOfIds_user->Set.add(id)
            let _ = Js.Array2.push(entitiesToLoad, Types.UserRead(id))
          },
        },
      }

      //handler context must be defined as a getter functoin so that it can construct the context
      //without stale values whenever it is used
      let getHandlerContextSync: unit => handlerContext = () => {
        let user_User = switch optIdOf_user.contents {
        | Some(id) => inMemoryStore.user->IO.InMemoryStore.User.get(id)
        | None =>
          Logging.warn(`The loader for "user" of entity type "User"" was not used please add it to your loader function or remove it from your config.yaml file to avoid unexpected behaviour. This is a runtime validation check.`)
          None
        }
        {
          log: contextLogger,
          gauge: {
            set: entity => {
              inMemoryStore.gauge->IO.InMemoryStore.Gauge.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(`[unimplemented delete] can't delete entity(gauge) with ID ${id}.`),
            getPool: gauge => {
              let optPool =
                inMemoryStore.liquidityPool->IO.InMemoryStore.LiquidityPool.get(gauge.pool)
              switch optPool {
              | Some(pool) => pool
              | None =>
                Logging.warn(`Gauge pool data not found. Loading associated liquidityPool from database.
Please consider loading the liquidityPool in the UpdateGauge entity loader to greatly improve sync speed of your application.
`)

                raise(
                  LinkedEntityNotAvailableInSyncHandler(
                    "The required linked entity of Gauge is undefined.",
                  ),
                )
              }
            },
          },
          latestETHPrice: {
            set: entity => {
              inMemoryStore.latestETHPrice->IO.InMemoryStore.LatestETHPrice.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(latestETHPrice) with ID ${id}.`,
              ),
          },
          liquidityPool: {
            set: entity => {
              inMemoryStore.liquidityPool->IO.InMemoryStore.LiquidityPool.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(liquidityPool) with ID ${id}.`,
              ),
            get: (id: Types.id) => {
              if optSetOfIds_liquidityPool->Set.has(id) {
                inMemoryStore.liquidityPool->IO.InMemoryStore.LiquidityPool.get(id)
              } else {
                Logging.warn(
                  `The loader for a "LiquidityPool" of entity with id "${id}" was not used please add it to your default loader function (ie. place 'context.liquidityPool.load("${id}")' inside your loader) to avoid unexpected behaviour. This is a runtime validation check.`,
                )

                // NOTE: this will still retern the value if it exists in the in-memory store (despite the loader not being run).
                inMemoryStore.liquidityPool->IO.InMemoryStore.LiquidityPool.get(id)

                // TODO: add a further step to syncronously try fetch this from the DB if it isn't in the in-memory store - similar to this PR: https://github.com/Float-Capital/indexer/pull/759
              }
            },
            getToken0: liquidityPool => {
              let optToken0 = inMemoryStore.token->IO.InMemoryStore.Token.get(liquidityPool.token0)
              switch optToken0 {
              | Some(token0) => token0
              | None =>
                Logging.warn(`LiquidityPool token0 data not found. Loading associated token from database.
Please consider loading the token in the UpdateLiquidityPool entity loader to greatly improve sync speed of your application.
`)

                raise(
                  LinkedEntityNotAvailableInSyncHandler(
                    "The required linked entity of LiquidityPool is undefined.",
                  ),
                )
              }
            },
            getToken1: liquidityPool => {
              let optToken1 = inMemoryStore.token->IO.InMemoryStore.Token.get(liquidityPool.token1)
              switch optToken1 {
              | Some(token1) => token1
              | None =>
                Logging.warn(`LiquidityPool token1 data not found. Loading associated token from database.
Please consider loading the token in the UpdateLiquidityPool entity loader to greatly improve sync speed of your application.
`)

                raise(
                  LinkedEntityNotAvailableInSyncHandler(
                    "The required linked entity of LiquidityPool is undefined.",
                  ),
                )
              }
            },
          },
          liquidityPoolDailySnapshot: {
            set: entity => {
              inMemoryStore.liquidityPoolDailySnapshot->IO.InMemoryStore.LiquidityPoolDailySnapshot.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(liquidityPoolDailySnapshot) with ID ${id}.`,
              ),
          },
          liquidityPoolHourlySnapshot: {
            set: entity => {
              inMemoryStore.liquidityPoolHourlySnapshot->IO.InMemoryStore.LiquidityPoolHourlySnapshot.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(liquidityPoolHourlySnapshot) with ID ${id}.`,
              ),
          },
          liquidityPoolUserMapping: {
            set: entity => {
              inMemoryStore.liquidityPoolUserMapping->IO.InMemoryStore.LiquidityPoolUserMapping.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(liquidityPoolUserMapping) with ID ${id}.`,
              ),
            get: (id: Types.id) => {
              if optSetOfIds_liquidityPoolUserMapping->Set.has(id) {
                inMemoryStore.liquidityPoolUserMapping->IO.InMemoryStore.LiquidityPoolUserMapping.get(
                  id,
                )
              } else {
                Logging.warn(
                  `The loader for a "LiquidityPoolUserMapping" of entity with id "${id}" was not used please add it to your default loader function (ie. place 'context.liquidityPoolUserMapping.load("${id}")' inside your loader) to avoid unexpected behaviour. This is a runtime validation check.`,
                )

                // NOTE: this will still retern the value if it exists in the in-memory store (despite the loader not being run).
                inMemoryStore.liquidityPoolUserMapping->IO.InMemoryStore.LiquidityPoolUserMapping.get(
                  id,
                )

                // TODO: add a further step to syncronously try fetch this from the DB if it isn't in the in-memory store - similar to this PR: https://github.com/Float-Capital/indexer/pull/759
              }
            },
            getLiquidityPool: liquidityPoolUserMapping => {
              let optLiquidityPool =
                inMemoryStore.liquidityPool->IO.InMemoryStore.LiquidityPool.get(
                  liquidityPoolUserMapping.liquidityPool,
                )
              switch optLiquidityPool {
              | Some(liquidityPool) => liquidityPool
              | None =>
                Logging.warn(`LiquidityPoolUserMapping liquidityPool data not found. Loading associated liquidityPool from database.
Please consider loading the liquidityPool in the UpdateLiquidityPoolUserMapping entity loader to greatly improve sync speed of your application.
`)

                raise(
                  LinkedEntityNotAvailableInSyncHandler(
                    "The required linked entity of LiquidityPoolUserMapping is undefined.",
                  ),
                )
              }
            },
            getUser: liquidityPoolUserMapping => {
              let optUser =
                inMemoryStore.user->IO.InMemoryStore.User.get(liquidityPoolUserMapping.user)
              switch optUser {
              | Some(user) => user
              | None =>
                Logging.warn(`LiquidityPoolUserMapping user data not found. Loading associated user from database.
Please consider loading the user in the UpdateLiquidityPoolUserMapping entity loader to greatly improve sync speed of your application.
`)

                raise(
                  LinkedEntityNotAvailableInSyncHandler(
                    "The required linked entity of LiquidityPoolUserMapping is undefined.",
                  ),
                )
              }
            },
          },
          liquidityPoolWeeklySnapshot: {
            set: entity => {
              inMemoryStore.liquidityPoolWeeklySnapshot->IO.InMemoryStore.LiquidityPoolWeeklySnapshot.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(liquidityPoolWeeklySnapshot) with ID ${id}.`,
              ),
          },
          stateStore: {
            set: entity => {
              inMemoryStore.stateStore->IO.InMemoryStore.StateStore.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(`[unimplemented delete] can't delete entity(stateStore) with ID ${id}.`),
            getLatestEthPrice: stateStore => {
              let optLatestEthPrice =
                inMemoryStore.latestETHPrice->IO.InMemoryStore.LatestETHPrice.get(
                  stateStore.latestEthPrice,
                )
              switch optLatestEthPrice {
              | Some(latestEthPrice) => latestEthPrice
              | None =>
                Logging.warn(`StateStore latestEthPrice data not found. Loading associated latestETHPrice from database.
Please consider loading the latestETHPrice in the UpdateStateStore entity loader to greatly improve sync speed of your application.
`)

                raise(
                  LinkedEntityNotAvailableInSyncHandler(
                    "The required linked entity of StateStore is undefined.",
                  ),
                )
              }
            },
          },
          token: {
            set: entity => {
              inMemoryStore.token->IO.InMemoryStore.Token.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(`[unimplemented delete] can't delete entity(token) with ID ${id}.`),
          },
          tokenDailySnapshot: {
            set: entity => {
              inMemoryStore.tokenDailySnapshot->IO.InMemoryStore.TokenDailySnapshot.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(tokenDailySnapshot) with ID ${id}.`,
              ),
          },
          tokenHourlySnapshot: {
            set: entity => {
              inMemoryStore.tokenHourlySnapshot->IO.InMemoryStore.TokenHourlySnapshot.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(tokenHourlySnapshot) with ID ${id}.`,
              ),
          },
          tokenWeeklySnapshot: {
            set: entity => {
              inMemoryStore.tokenWeeklySnapshot->IO.InMemoryStore.TokenWeeklySnapshot.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(tokenWeeklySnapshot) with ID ${id}.`,
              ),
          },
          user: {
            set: entity => {
              inMemoryStore.user->IO.InMemoryStore.User.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(`[unimplemented delete] can't delete entity(user) with ID ${id}.`),
            user: user_User,
            get: (id: Types.id) => {
              if optSetOfIds_user->Set.has(id) {
                inMemoryStore.user->IO.InMemoryStore.User.get(id)
              } else {
                Logging.warn(
                  `The loader for a "User" of entity with id "${id}" was not used please add it to your default loader function (ie. place 'context.user.load("${id}")' inside your loader) to avoid unexpected behaviour. This is a runtime validation check.`,
                )

                // NOTE: this will still retern the value if it exists in the in-memory store (despite the loader not being run).
                inMemoryStore.user->IO.InMemoryStore.User.get(id)

                // TODO: add a further step to syncronously try fetch this from the DB if it isn't in the in-memory store - similar to this PR: https://github.com/Float-Capital/indexer/pull/759
              }
            },
          },
        }
      }

      let getHandlerContextAsync = (): handlerContextAsync => {
        let user_User = switch optIdOf_user.contents {
        | Some(id) => inMemoryStore.user->IO.InMemoryStore.User.get(id)
        | None =>
          Logging.warn(`The loader for "user" of entity type "User"" was not used please add it to your loader function or remove it from your config.yaml file to avoid unexpected behaviour. This is a runtime validation check.`)
          None
        }
        {
          log: contextLogger,
          gauge: {
            set: entity => {
              inMemoryStore.gauge->IO.InMemoryStore.Gauge.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(`[unimplemented delete] can't delete entity(gauge) with ID ${id}.`),
            getPool: async gauge => {
              let pool_field = gauge.pool
              let optPool =
                inMemoryStore.liquidityPool->IO.InMemoryStore.LiquidityPool.get(pool_field)
              switch optPool {
              | Some(pool) => pool
              | None =>
                let entities = await asyncGetters.getLiquidityPool(pool_field)

                switch entities->Belt.Array.get(0) {
                | Some(entity) =>
                  // TODO: make this work with the test framework too.
                  IO.InMemoryStore.LiquidityPool.set(
                    inMemoryStore.liquidityPool,
                    ~key=entity.id,
                    ~dbOp=Types.Read,
                    ~entity,
                  )
                  entity
                | None =>
                  Logging.error(`Gauge pool data not found. Loading associated liquidityPool from database.
This is likely due to a database corruption. Please reach out to the team on discord.
`)

                  raise(
                    UnableToLoadNonNullableLinkedEntity(
                      "The required linked entity pool of Gauge is undefined.",
                    ),
                  )
                }
              }
            },
          },
          latestETHPrice: {
            set: entity => {
              inMemoryStore.latestETHPrice->IO.InMemoryStore.LatestETHPrice.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(latestETHPrice) with ID ${id}.`,
              ),
          },
          liquidityPool: {
            set: entity => {
              inMemoryStore.liquidityPool->IO.InMemoryStore.LiquidityPool.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(liquidityPool) with ID ${id}.`,
              ),
            get: async (id: Types.id) => {
              if optSetOfIds_liquidityPool->Set.has(id) {
                inMemoryStore.liquidityPool->IO.InMemoryStore.LiquidityPool.get(id)
              } else {
                // NOTE: this will still retern the value if it exists in the in-memory store (despite the loader not being run).
                switch inMemoryStore.liquidityPool->IO.InMemoryStore.LiquidityPool.get(id) {
                | Some(entity) => Some(entity)
                | None =>
                  let entities = await asyncGetters.getLiquidityPool(id)

                  switch entities->Belt.Array.get(0) {
                  | Some(entity) =>
                    // TODO: make this work with the test framework too.
                    IO.InMemoryStore.LiquidityPool.set(
                      inMemoryStore.liquidityPool,
                      ~key=entity.id,
                      ~dbOp=Types.Read,
                      ~entity,
                    )
                    Some(entity)
                  | None => None
                  }
                }
              }
            },
            getToken0: async liquidityPool => {
              let token0_field = liquidityPool.token0
              let optToken0 = inMemoryStore.token->IO.InMemoryStore.Token.get(token0_field)
              switch optToken0 {
              | Some(token0) => token0
              | None =>
                let entities = await asyncGetters.getToken(token0_field)

                switch entities->Belt.Array.get(0) {
                | Some(entity) =>
                  // TODO: make this work with the test framework too.
                  IO.InMemoryStore.Token.set(
                    inMemoryStore.token,
                    ~key=entity.id,
                    ~dbOp=Types.Read,
                    ~entity,
                  )
                  entity
                | None =>
                  Logging.error(`LiquidityPool token0 data not found. Loading associated token from database.
This is likely due to a database corruption. Please reach out to the team on discord.
`)

                  raise(
                    UnableToLoadNonNullableLinkedEntity(
                      "The required linked entity token0 of LiquidityPool is undefined.",
                    ),
                  )
                }
              }
            },
            getToken1: async liquidityPool => {
              let token1_field = liquidityPool.token1
              let optToken1 = inMemoryStore.token->IO.InMemoryStore.Token.get(token1_field)
              switch optToken1 {
              | Some(token1) => token1
              | None =>
                let entities = await asyncGetters.getToken(token1_field)

                switch entities->Belt.Array.get(0) {
                | Some(entity) =>
                  // TODO: make this work with the test framework too.
                  IO.InMemoryStore.Token.set(
                    inMemoryStore.token,
                    ~key=entity.id,
                    ~dbOp=Types.Read,
                    ~entity,
                  )
                  entity
                | None =>
                  Logging.error(`LiquidityPool token1 data not found. Loading associated token from database.
This is likely due to a database corruption. Please reach out to the team on discord.
`)

                  raise(
                    UnableToLoadNonNullableLinkedEntity(
                      "The required linked entity token1 of LiquidityPool is undefined.",
                    ),
                  )
                }
              }
            },
          },
          liquidityPoolDailySnapshot: {
            set: entity => {
              inMemoryStore.liquidityPoolDailySnapshot->IO.InMemoryStore.LiquidityPoolDailySnapshot.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(liquidityPoolDailySnapshot) with ID ${id}.`,
              ),
          },
          liquidityPoolHourlySnapshot: {
            set: entity => {
              inMemoryStore.liquidityPoolHourlySnapshot->IO.InMemoryStore.LiquidityPoolHourlySnapshot.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(liquidityPoolHourlySnapshot) with ID ${id}.`,
              ),
          },
          liquidityPoolUserMapping: {
            set: entity => {
              inMemoryStore.liquidityPoolUserMapping->IO.InMemoryStore.LiquidityPoolUserMapping.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(liquidityPoolUserMapping) with ID ${id}.`,
              ),
            get: async (id: Types.id) => {
              if optSetOfIds_liquidityPoolUserMapping->Set.has(id) {
                inMemoryStore.liquidityPoolUserMapping->IO.InMemoryStore.LiquidityPoolUserMapping.get(
                  id,
                )
              } else {
                // NOTE: this will still retern the value if it exists in the in-memory store (despite the loader not being run).
                switch inMemoryStore.liquidityPoolUserMapping->IO.InMemoryStore.LiquidityPoolUserMapping.get(
                  id,
                ) {
                | Some(entity) => Some(entity)
                | None =>
                  let entities = await asyncGetters.getLiquidityPoolUserMapping(id)

                  switch entities->Belt.Array.get(0) {
                  | Some(entity) =>
                    // TODO: make this work with the test framework too.
                    IO.InMemoryStore.LiquidityPoolUserMapping.set(
                      inMemoryStore.liquidityPoolUserMapping,
                      ~key=entity.id,
                      ~dbOp=Types.Read,
                      ~entity,
                    )
                    Some(entity)
                  | None => None
                  }
                }
              }
            },
            getLiquidityPool: async liquidityPoolUserMapping => {
              let liquidityPool_field = liquidityPoolUserMapping.liquidityPool
              let optLiquidityPool =
                inMemoryStore.liquidityPool->IO.InMemoryStore.LiquidityPool.get(liquidityPool_field)
              switch optLiquidityPool {
              | Some(liquidityPool) => liquidityPool
              | None =>
                let entities = await asyncGetters.getLiquidityPool(liquidityPool_field)

                switch entities->Belt.Array.get(0) {
                | Some(entity) =>
                  // TODO: make this work with the test framework too.
                  IO.InMemoryStore.LiquidityPool.set(
                    inMemoryStore.liquidityPool,
                    ~key=entity.id,
                    ~dbOp=Types.Read,
                    ~entity,
                  )
                  entity
                | None =>
                  Logging.error(`LiquidityPoolUserMapping liquidityPool data not found. Loading associated liquidityPool from database.
This is likely due to a database corruption. Please reach out to the team on discord.
`)

                  raise(
                    UnableToLoadNonNullableLinkedEntity(
                      "The required linked entity liquidityPool of LiquidityPoolUserMapping is undefined.",
                    ),
                  )
                }
              }
            },
            getUser: async liquidityPoolUserMapping => {
              let user_field = liquidityPoolUserMapping.user
              let optUser = inMemoryStore.user->IO.InMemoryStore.User.get(user_field)
              switch optUser {
              | Some(user) => user
              | None =>
                let entities = await asyncGetters.getUser(user_field)

                switch entities->Belt.Array.get(0) {
                | Some(entity) =>
                  // TODO: make this work with the test framework too.
                  IO.InMemoryStore.User.set(
                    inMemoryStore.user,
                    ~key=entity.id,
                    ~dbOp=Types.Read,
                    ~entity,
                  )
                  entity
                | None =>
                  Logging.error(`LiquidityPoolUserMapping user data not found. Loading associated user from database.
This is likely due to a database corruption. Please reach out to the team on discord.
`)

                  raise(
                    UnableToLoadNonNullableLinkedEntity(
                      "The required linked entity user of LiquidityPoolUserMapping is undefined.",
                    ),
                  )
                }
              }
            },
          },
          liquidityPoolWeeklySnapshot: {
            set: entity => {
              inMemoryStore.liquidityPoolWeeklySnapshot->IO.InMemoryStore.LiquidityPoolWeeklySnapshot.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(liquidityPoolWeeklySnapshot) with ID ${id}.`,
              ),
          },
          stateStore: {
            set: entity => {
              inMemoryStore.stateStore->IO.InMemoryStore.StateStore.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(`[unimplemented delete] can't delete entity(stateStore) with ID ${id}.`),
            getLatestEthPrice: async stateStore => {
              let latestEthPrice_field = stateStore.latestEthPrice
              let optLatestEthPrice =
                inMemoryStore.latestETHPrice->IO.InMemoryStore.LatestETHPrice.get(
                  latestEthPrice_field,
                )
              switch optLatestEthPrice {
              | Some(latestEthPrice) => latestEthPrice
              | None =>
                let entities = await asyncGetters.getLatestETHPrice(latestEthPrice_field)

                switch entities->Belt.Array.get(0) {
                | Some(entity) =>
                  // TODO: make this work with the test framework too.
                  IO.InMemoryStore.LatestETHPrice.set(
                    inMemoryStore.latestETHPrice,
                    ~key=entity.id,
                    ~dbOp=Types.Read,
                    ~entity,
                  )
                  entity
                | None =>
                  Logging.error(`StateStore latestEthPrice data not found. Loading associated latestETHPrice from database.
This is likely due to a database corruption. Please reach out to the team on discord.
`)

                  raise(
                    UnableToLoadNonNullableLinkedEntity(
                      "The required linked entity latestEthPrice of StateStore is undefined.",
                    ),
                  )
                }
              }
            },
          },
          token: {
            set: entity => {
              inMemoryStore.token->IO.InMemoryStore.Token.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(`[unimplemented delete] can't delete entity(token) with ID ${id}.`),
          },
          tokenDailySnapshot: {
            set: entity => {
              inMemoryStore.tokenDailySnapshot->IO.InMemoryStore.TokenDailySnapshot.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(tokenDailySnapshot) with ID ${id}.`,
              ),
          },
          tokenHourlySnapshot: {
            set: entity => {
              inMemoryStore.tokenHourlySnapshot->IO.InMemoryStore.TokenHourlySnapshot.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(tokenHourlySnapshot) with ID ${id}.`,
              ),
          },
          tokenWeeklySnapshot: {
            set: entity => {
              inMemoryStore.tokenWeeklySnapshot->IO.InMemoryStore.TokenWeeklySnapshot.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(tokenWeeklySnapshot) with ID ${id}.`,
              ),
          },
          user: {
            set: entity => {
              inMemoryStore.user->IO.InMemoryStore.User.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(`[unimplemented delete] can't delete entity(user) with ID ${id}.`),
            user: user_User,
            get: async (id: Types.id) => {
              if optSetOfIds_user->Set.has(id) {
                inMemoryStore.user->IO.InMemoryStore.User.get(id)
              } else {
                // NOTE: this will still retern the value if it exists in the in-memory store (despite the loader not being run).
                switch inMemoryStore.user->IO.InMemoryStore.User.get(id) {
                | Some(entity) => Some(entity)
                | None =>
                  let entities = await asyncGetters.getUser(id)

                  switch entities->Belt.Array.get(0) {
                  | Some(entity) =>
                    // TODO: make this work with the test framework too.
                    IO.InMemoryStore.User.set(
                      inMemoryStore.user,
                      ~key=entity.id,
                      ~dbOp=Types.Read,
                      ~entity,
                    )
                    Some(entity)
                  | None => None
                  }
                }
              }
            },
          },
        }
      }

      {
        log: contextLogger,
        getEntitiesToLoad: () => entitiesToLoad,
        getAddedDynamicContractRegistrations: () => addedDynamicContractRegistrations,
        getLoaderContext: () => loaderContext,
        getHandlerContextSync,
        getHandlerContextAsync,
      }
    }
  }

  module SyncEvent = {
    type loaderContext = Types.PoolContract.SyncEvent.loaderContext
    type handlerContext = Types.PoolContract.SyncEvent.handlerContext
    type handlerContextAsync = Types.PoolContract.SyncEvent.handlerContextAsync
    type context = genericContextCreatorFunctions<
      loaderContext,
      handlerContext,
      handlerContextAsync,
    >

    let contextCreator: contextCreator<
      Types.PoolContract.SyncEvent.eventArgs,
      loaderContext,
      handlerContext,
      handlerContextAsync,
    > = (~inMemoryStore, ~chainId, ~event, ~logger, ~asyncGetters) => {
      // NOTE: we could optimise this code to onle create a logger if there was a log called.
      let logger = logger->Logging.createChildFrom(
        ~logger=_,
        ~params={
          "context": "Pool.Sync",
          "chainId": chainId,
          "block": event.blockNumber,
          "logIndex": event.logIndex,
          "txHash": event.transactionHash,
        },
      )

      let contextLogger: Logs.userLogger = {
        info: (message: string) => logger->Logging.uinfo(message),
        debug: (message: string) => logger->Logging.udebug(message),
        warn: (message: string) => logger->Logging.uwarn(message),
        error: (message: string) => logger->Logging.uerror(message),
        errorWithExn: (exn: option<Js.Exn.t>, message: string) =>
          logger->Logging.uerrorWithExn(exn, message),
      }

      let optIdOf_stateStore = ref(None)
      let optSetOfIds_stateStore: Set.t<Types.id> = Set.make()
      let optIdOf_singlePool = ref(None)
      let optIdArrayOf_stablecoinPools = ref(None)
      let optIdArrayOf_whitelistedPools = ref(None)
      let optSetOfIds_liquidityPool: Set.t<Types.id> = Set.make()
      let optIdArrayOf_whitelistedTokens = ref(None)
      let optSetOfIds_token: Set.t<Types.id> = Set.make()

      let entitiesToLoad: array<Types.entityRead> = []

      let addedDynamicContractRegistrations: array<Types.dynamicContractRegistryEntity> = []

      //Loader context can be defined as a value and the getter can return that value

      @warning("-16")
      let loaderContext: loaderContext = {
        log: contextLogger,
        contractRegistration: {
          //TODO only add contracts we've registered for the event in the config
          addPool: (contractAddress: Ethers.ethAddress) => {
            let eventId = EventUtils.packEventIndex(
              ~blockNumber=event.blockNumber,
              ~logIndex=event.logIndex,
            )
            let dynamicContractRegistration: Types.dynamicContractRegistryEntity = {
              chainId,
              eventId,
              contractAddress,
              contractType: "Pool",
            }

            addedDynamicContractRegistrations->Js.Array2.push(dynamicContractRegistration)->ignore

            inMemoryStore.dynamicContractRegistry->IO.InMemoryStore.DynamicContractRegistry.set(
              ~key={chainId, contractAddress},
              ~entity=dynamicContractRegistration,
              ~dbOp=Set,
            )
          },
          //TODO only add contracts we've registered for the event in the config
          addPoolFactory: (contractAddress: Ethers.ethAddress) => {
            let eventId = EventUtils.packEventIndex(
              ~blockNumber=event.blockNumber,
              ~logIndex=event.logIndex,
            )
            let dynamicContractRegistration: Types.dynamicContractRegistryEntity = {
              chainId,
              eventId,
              contractAddress,
              contractType: "PoolFactory",
            }

            addedDynamicContractRegistrations->Js.Array2.push(dynamicContractRegistration)->ignore

            inMemoryStore.dynamicContractRegistry->IO.InMemoryStore.DynamicContractRegistry.set(
              ~key={chainId, contractAddress},
              ~entity=dynamicContractRegistration,
              ~dbOp=Set,
            )
          },
          //TODO only add contracts we've registered for the event in the config
          addVoter: (contractAddress: Ethers.ethAddress) => {
            let eventId = EventUtils.packEventIndex(
              ~blockNumber=event.blockNumber,
              ~logIndex=event.logIndex,
            )
            let dynamicContractRegistration: Types.dynamicContractRegistryEntity = {
              chainId,
              eventId,
              contractAddress,
              contractType: "Voter",
            }

            addedDynamicContractRegistrations->Js.Array2.push(dynamicContractRegistration)->ignore

            inMemoryStore.dynamicContractRegistry->IO.InMemoryStore.DynamicContractRegistry.set(
              ~key={chainId, contractAddress},
              ~entity=dynamicContractRegistration,
              ~dbOp=Set,
            )
          },
        },
        stateStore: {
          stateStoreLoad: (id: Types.id, ~loaders={}) => {
            optIdOf_stateStore := Some(id)

            let _ = Js.Array2.push(entitiesToLoad, Types.StateStoreRead(id, loaders))
          },
          load: (id: Types.id, ~loaders={}) => {
            let _ = optSetOfIds_stateStore->Set.add(id)
            let _ = Js.Array2.push(entitiesToLoad, Types.StateStoreRead(id, loaders))
          },
        },
        liquidityPool: {
          singlePoolLoad: (id: Types.id, ~loaders={}) => {
            optIdOf_singlePool := Some(id)

            let _ = Js.Array2.push(entitiesToLoad, Types.LiquidityPoolRead(id, loaders))
          },
          stablecoinPoolsLoad: (ids: array<Types.id>, ~loaders={}) => {
            optIdArrayOf_stablecoinPools := Some(ids)

            let _ =
              ids->Belt.Array.map(id =>
                entitiesToLoad->Js.Array2.push(Types.LiquidityPoolRead(id, loaders))
              )
          },
          whitelistedPoolsLoad: (ids: array<Types.id>, ~loaders={}) => {
            optIdArrayOf_whitelistedPools := Some(ids)

            let _ =
              ids->Belt.Array.map(id =>
                entitiesToLoad->Js.Array2.push(Types.LiquidityPoolRead(id, loaders))
              )
          },
          load: (id: Types.id, ~loaders={}) => {
            let _ = optSetOfIds_liquidityPool->Set.add(id)
            let _ = Js.Array2.push(entitiesToLoad, Types.LiquidityPoolRead(id, loaders))
          },
        },
        token: {
          whitelistedTokensLoad: (ids: array<Types.id>) => {
            optIdArrayOf_whitelistedTokens := Some(ids)

            let _ = ids->Belt.Array.map(id => entitiesToLoad->Js.Array2.push(Types.TokenRead(id)))
          },
          load: (id: Types.id) => {
            let _ = optSetOfIds_token->Set.add(id)
            let _ = Js.Array2.push(entitiesToLoad, Types.TokenRead(id))
          },
        },
      }

      //handler context must be defined as a getter functoin so that it can construct the context
      //without stale values whenever it is used
      let getHandlerContextSync: unit => handlerContext = () => {
        let singlePool_LiquidityPool = switch optIdOf_singlePool.contents {
        | Some(id) => inMemoryStore.liquidityPool->IO.InMemoryStore.LiquidityPool.get(id)
        | None =>
          Logging.warn(`The loader for "singlePool" of entity type "LiquidityPool"" was not used please add it to your loader function or remove it from your config.yaml file to avoid unexpected behaviour. This is a runtime validation check.`)
          None
        }
        let stablecoinPools_LiquidityPool = switch optIdArrayOf_stablecoinPools.contents {
        | Some(ids) =>
          ids->Belt.Array.map(id =>
            inMemoryStore.liquidityPool->IO.InMemoryStore.LiquidityPool.get(id)
          )
        | None =>
          Logging.warn(`The array loader for "stablecoinPools" of entity type "LiquidityPool"" was not used please add it to your loader function or remove it from your config.yaml file to avoid unexpected behaviour. This is a runtime validation check.`)
          []
        }
        let whitelistedPools_LiquidityPool = switch optIdArrayOf_whitelistedPools.contents {
        | Some(ids) =>
          ids->Belt.Array.map(id =>
            inMemoryStore.liquidityPool->IO.InMemoryStore.LiquidityPool.get(id)
          )
        | None =>
          Logging.warn(`The array loader for "whitelistedPools" of entity type "LiquidityPool"" was not used please add it to your loader function or remove it from your config.yaml file to avoid unexpected behaviour. This is a runtime validation check.`)
          []
        }
        let stateStore_StateStore = switch optIdOf_stateStore.contents {
        | Some(id) => inMemoryStore.stateStore->IO.InMemoryStore.StateStore.get(id)
        | None =>
          Logging.warn(`The loader for "stateStore" of entity type "StateStore"" was not used please add it to your loader function or remove it from your config.yaml file to avoid unexpected behaviour. This is a runtime validation check.`)
          None
        }
        let whitelistedTokens_Token = switch optIdArrayOf_whitelistedTokens.contents {
        | Some(ids) =>
          ids->Belt.Array.map(id => inMemoryStore.token->IO.InMemoryStore.Token.get(id))
        | None =>
          Logging.warn(`The array loader for "whitelistedTokens" of entity type "Token"" was not used please add it to your loader function or remove it from your config.yaml file to avoid unexpected behaviour. This is a runtime validation check.`)
          []
        }
        {
          log: contextLogger,
          gauge: {
            set: entity => {
              inMemoryStore.gauge->IO.InMemoryStore.Gauge.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(`[unimplemented delete] can't delete entity(gauge) with ID ${id}.`),
            getPool: gauge => {
              let optPool =
                inMemoryStore.liquidityPool->IO.InMemoryStore.LiquidityPool.get(gauge.pool)
              switch optPool {
              | Some(pool) => pool
              | None =>
                Logging.warn(`Gauge pool data not found. Loading associated liquidityPool from database.
Please consider loading the liquidityPool in the UpdateGauge entity loader to greatly improve sync speed of your application.
`)

                raise(
                  LinkedEntityNotAvailableInSyncHandler(
                    "The required linked entity of Gauge is undefined.",
                  ),
                )
              }
            },
          },
          latestETHPrice: {
            set: entity => {
              inMemoryStore.latestETHPrice->IO.InMemoryStore.LatestETHPrice.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(latestETHPrice) with ID ${id}.`,
              ),
          },
          liquidityPool: {
            set: entity => {
              inMemoryStore.liquidityPool->IO.InMemoryStore.LiquidityPool.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(liquidityPool) with ID ${id}.`,
              ),
            singlePool: singlePool_LiquidityPool,
            stablecoinPools: stablecoinPools_LiquidityPool,
            whitelistedPools: whitelistedPools_LiquidityPool,
            get: (id: Types.id) => {
              if optSetOfIds_liquidityPool->Set.has(id) {
                inMemoryStore.liquidityPool->IO.InMemoryStore.LiquidityPool.get(id)
              } else {
                Logging.warn(
                  `The loader for a "LiquidityPool" of entity with id "${id}" was not used please add it to your default loader function (ie. place 'context.liquidityPool.load("${id}")' inside your loader) to avoid unexpected behaviour. This is a runtime validation check.`,
                )

                // NOTE: this will still retern the value if it exists in the in-memory store (despite the loader not being run).
                inMemoryStore.liquidityPool->IO.InMemoryStore.LiquidityPool.get(id)

                // TODO: add a further step to syncronously try fetch this from the DB if it isn't in the in-memory store - similar to this PR: https://github.com/Float-Capital/indexer/pull/759
              }
            },
            getToken0: liquidityPool => {
              let optToken0 = inMemoryStore.token->IO.InMemoryStore.Token.get(liquidityPool.token0)
              switch optToken0 {
              | Some(token0) => token0
              | None =>
                Logging.warn(`LiquidityPool token0 data not found. Loading associated token from database.
Please consider loading the token in the UpdateLiquidityPool entity loader to greatly improve sync speed of your application.
`)

                raise(
                  LinkedEntityNotAvailableInSyncHandler(
                    "The required linked entity of LiquidityPool is undefined.",
                  ),
                )
              }
            },
            getToken1: liquidityPool => {
              let optToken1 = inMemoryStore.token->IO.InMemoryStore.Token.get(liquidityPool.token1)
              switch optToken1 {
              | Some(token1) => token1
              | None =>
                Logging.warn(`LiquidityPool token1 data not found. Loading associated token from database.
Please consider loading the token in the UpdateLiquidityPool entity loader to greatly improve sync speed of your application.
`)

                raise(
                  LinkedEntityNotAvailableInSyncHandler(
                    "The required linked entity of LiquidityPool is undefined.",
                  ),
                )
              }
            },
          },
          liquidityPoolDailySnapshot: {
            set: entity => {
              inMemoryStore.liquidityPoolDailySnapshot->IO.InMemoryStore.LiquidityPoolDailySnapshot.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(liquidityPoolDailySnapshot) with ID ${id}.`,
              ),
          },
          liquidityPoolHourlySnapshot: {
            set: entity => {
              inMemoryStore.liquidityPoolHourlySnapshot->IO.InMemoryStore.LiquidityPoolHourlySnapshot.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(liquidityPoolHourlySnapshot) with ID ${id}.`,
              ),
          },
          liquidityPoolUserMapping: {
            set: entity => {
              inMemoryStore.liquidityPoolUserMapping->IO.InMemoryStore.LiquidityPoolUserMapping.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(liquidityPoolUserMapping) with ID ${id}.`,
              ),
            getLiquidityPool: liquidityPoolUserMapping => {
              let optLiquidityPool =
                inMemoryStore.liquidityPool->IO.InMemoryStore.LiquidityPool.get(
                  liquidityPoolUserMapping.liquidityPool,
                )
              switch optLiquidityPool {
              | Some(liquidityPool) => liquidityPool
              | None =>
                Logging.warn(`LiquidityPoolUserMapping liquidityPool data not found. Loading associated liquidityPool from database.
Please consider loading the liquidityPool in the UpdateLiquidityPoolUserMapping entity loader to greatly improve sync speed of your application.
`)

                raise(
                  LinkedEntityNotAvailableInSyncHandler(
                    "The required linked entity of LiquidityPoolUserMapping is undefined.",
                  ),
                )
              }
            },
            getUser: liquidityPoolUserMapping => {
              let optUser =
                inMemoryStore.user->IO.InMemoryStore.User.get(liquidityPoolUserMapping.user)
              switch optUser {
              | Some(user) => user
              | None =>
                Logging.warn(`LiquidityPoolUserMapping user data not found. Loading associated user from database.
Please consider loading the user in the UpdateLiquidityPoolUserMapping entity loader to greatly improve sync speed of your application.
`)

                raise(
                  LinkedEntityNotAvailableInSyncHandler(
                    "The required linked entity of LiquidityPoolUserMapping is undefined.",
                  ),
                )
              }
            },
          },
          liquidityPoolWeeklySnapshot: {
            set: entity => {
              inMemoryStore.liquidityPoolWeeklySnapshot->IO.InMemoryStore.LiquidityPoolWeeklySnapshot.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(liquidityPoolWeeklySnapshot) with ID ${id}.`,
              ),
          },
          stateStore: {
            set: entity => {
              inMemoryStore.stateStore->IO.InMemoryStore.StateStore.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(`[unimplemented delete] can't delete entity(stateStore) with ID ${id}.`),
            stateStore: stateStore_StateStore,
            get: (id: Types.id) => {
              if optSetOfIds_stateStore->Set.has(id) {
                inMemoryStore.stateStore->IO.InMemoryStore.StateStore.get(id)
              } else {
                Logging.warn(
                  `The loader for a "StateStore" of entity with id "${id}" was not used please add it to your default loader function (ie. place 'context.stateStore.load("${id}")' inside your loader) to avoid unexpected behaviour. This is a runtime validation check.`,
                )

                // NOTE: this will still retern the value if it exists in the in-memory store (despite the loader not being run).
                inMemoryStore.stateStore->IO.InMemoryStore.StateStore.get(id)

                // TODO: add a further step to syncronously try fetch this from the DB if it isn't in the in-memory store - similar to this PR: https://github.com/Float-Capital/indexer/pull/759
              }
            },
            getLatestEthPrice: stateStore => {
              let optLatestEthPrice =
                inMemoryStore.latestETHPrice->IO.InMemoryStore.LatestETHPrice.get(
                  stateStore.latestEthPrice,
                )
              switch optLatestEthPrice {
              | Some(latestEthPrice) => latestEthPrice
              | None =>
                Logging.warn(`StateStore latestEthPrice data not found. Loading associated latestETHPrice from database.
Please consider loading the latestETHPrice in the UpdateStateStore entity loader to greatly improve sync speed of your application.
`)

                raise(
                  LinkedEntityNotAvailableInSyncHandler(
                    "The required linked entity of StateStore is undefined.",
                  ),
                )
              }
            },
          },
          token: {
            set: entity => {
              inMemoryStore.token->IO.InMemoryStore.Token.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(`[unimplemented delete] can't delete entity(token) with ID ${id}.`),
            whitelistedTokens: whitelistedTokens_Token,
            get: (id: Types.id) => {
              if optSetOfIds_token->Set.has(id) {
                inMemoryStore.token->IO.InMemoryStore.Token.get(id)
              } else {
                Logging.warn(
                  `The loader for a "Token" of entity with id "${id}" was not used please add it to your default loader function (ie. place 'context.token.load("${id}")' inside your loader) to avoid unexpected behaviour. This is a runtime validation check.`,
                )

                // NOTE: this will still retern the value if it exists in the in-memory store (despite the loader not being run).
                inMemoryStore.token->IO.InMemoryStore.Token.get(id)

                // TODO: add a further step to syncronously try fetch this from the DB if it isn't in the in-memory store - similar to this PR: https://github.com/Float-Capital/indexer/pull/759
              }
            },
          },
          tokenDailySnapshot: {
            set: entity => {
              inMemoryStore.tokenDailySnapshot->IO.InMemoryStore.TokenDailySnapshot.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(tokenDailySnapshot) with ID ${id}.`,
              ),
          },
          tokenHourlySnapshot: {
            set: entity => {
              inMemoryStore.tokenHourlySnapshot->IO.InMemoryStore.TokenHourlySnapshot.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(tokenHourlySnapshot) with ID ${id}.`,
              ),
          },
          tokenWeeklySnapshot: {
            set: entity => {
              inMemoryStore.tokenWeeklySnapshot->IO.InMemoryStore.TokenWeeklySnapshot.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(tokenWeeklySnapshot) with ID ${id}.`,
              ),
          },
          user: {
            set: entity => {
              inMemoryStore.user->IO.InMemoryStore.User.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(`[unimplemented delete] can't delete entity(user) with ID ${id}.`),
          },
        }
      }

      let getHandlerContextAsync = (): handlerContextAsync => {
        let singlePool_LiquidityPool = switch optIdOf_singlePool.contents {
        | Some(id) => inMemoryStore.liquidityPool->IO.InMemoryStore.LiquidityPool.get(id)
        | None =>
          Logging.warn(`The loader for "singlePool" of entity type "LiquidityPool"" was not used please add it to your loader function or remove it from your config.yaml file to avoid unexpected behaviour. This is a runtime validation check.`)
          None
        }
        let stablecoinPools_LiquidityPool = switch optIdArrayOf_stablecoinPools.contents {
        | Some(ids) =>
          ids->Belt.Array.map(id =>
            inMemoryStore.liquidityPool->IO.InMemoryStore.LiquidityPool.get(id)
          )
        | None =>
          Logging.warn(`The array loader for "stablecoinPools" of entity type "LiquidityPool"" was not used please add it to your loader function or remove it from your config.yaml file to avoid unexpected behaviour. This is a runtime validation check.`)
          []
        }
        let whitelistedPools_LiquidityPool = switch optIdArrayOf_whitelistedPools.contents {
        | Some(ids) =>
          ids->Belt.Array.map(id =>
            inMemoryStore.liquidityPool->IO.InMemoryStore.LiquidityPool.get(id)
          )
        | None =>
          Logging.warn(`The array loader for "whitelistedPools" of entity type "LiquidityPool"" was not used please add it to your loader function or remove it from your config.yaml file to avoid unexpected behaviour. This is a runtime validation check.`)
          []
        }
        let stateStore_StateStore = switch optIdOf_stateStore.contents {
        | Some(id) => inMemoryStore.stateStore->IO.InMemoryStore.StateStore.get(id)
        | None =>
          Logging.warn(`The loader for "stateStore" of entity type "StateStore"" was not used please add it to your loader function or remove it from your config.yaml file to avoid unexpected behaviour. This is a runtime validation check.`)
          None
        }
        let whitelistedTokens_Token = switch optIdArrayOf_whitelistedTokens.contents {
        | Some(ids) =>
          ids->Belt.Array.map(id => inMemoryStore.token->IO.InMemoryStore.Token.get(id))
        | None =>
          Logging.warn(`The array loader for "whitelistedTokens" of entity type "Token"" was not used please add it to your loader function or remove it from your config.yaml file to avoid unexpected behaviour. This is a runtime validation check.`)
          []
        }
        {
          log: contextLogger,
          gauge: {
            set: entity => {
              inMemoryStore.gauge->IO.InMemoryStore.Gauge.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(`[unimplemented delete] can't delete entity(gauge) with ID ${id}.`),
            getPool: async gauge => {
              let pool_field = gauge.pool
              let optPool =
                inMemoryStore.liquidityPool->IO.InMemoryStore.LiquidityPool.get(pool_field)
              switch optPool {
              | Some(pool) => pool
              | None =>
                let entities = await asyncGetters.getLiquidityPool(pool_field)

                switch entities->Belt.Array.get(0) {
                | Some(entity) =>
                  // TODO: make this work with the test framework too.
                  IO.InMemoryStore.LiquidityPool.set(
                    inMemoryStore.liquidityPool,
                    ~key=entity.id,
                    ~dbOp=Types.Read,
                    ~entity,
                  )
                  entity
                | None =>
                  Logging.error(`Gauge pool data not found. Loading associated liquidityPool from database.
This is likely due to a database corruption. Please reach out to the team on discord.
`)

                  raise(
                    UnableToLoadNonNullableLinkedEntity(
                      "The required linked entity pool of Gauge is undefined.",
                    ),
                  )
                }
              }
            },
          },
          latestETHPrice: {
            set: entity => {
              inMemoryStore.latestETHPrice->IO.InMemoryStore.LatestETHPrice.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(latestETHPrice) with ID ${id}.`,
              ),
          },
          liquidityPool: {
            set: entity => {
              inMemoryStore.liquidityPool->IO.InMemoryStore.LiquidityPool.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(liquidityPool) with ID ${id}.`,
              ),
            singlePool: singlePool_LiquidityPool,
            stablecoinPools: stablecoinPools_LiquidityPool,
            whitelistedPools: whitelistedPools_LiquidityPool,
            get: async (id: Types.id) => {
              if optSetOfIds_liquidityPool->Set.has(id) {
                inMemoryStore.liquidityPool->IO.InMemoryStore.LiquidityPool.get(id)
              } else {
                // NOTE: this will still retern the value if it exists in the in-memory store (despite the loader not being run).
                switch inMemoryStore.liquidityPool->IO.InMemoryStore.LiquidityPool.get(id) {
                | Some(entity) => Some(entity)
                | None =>
                  let entities = await asyncGetters.getLiquidityPool(id)

                  switch entities->Belt.Array.get(0) {
                  | Some(entity) =>
                    // TODO: make this work with the test framework too.
                    IO.InMemoryStore.LiquidityPool.set(
                      inMemoryStore.liquidityPool,
                      ~key=entity.id,
                      ~dbOp=Types.Read,
                      ~entity,
                    )
                    Some(entity)
                  | None => None
                  }
                }
              }
            },
            getToken0: async liquidityPool => {
              let token0_field = liquidityPool.token0
              let optToken0 = inMemoryStore.token->IO.InMemoryStore.Token.get(token0_field)
              switch optToken0 {
              | Some(token0) => token0
              | None =>
                let entities = await asyncGetters.getToken(token0_field)

                switch entities->Belt.Array.get(0) {
                | Some(entity) =>
                  // TODO: make this work with the test framework too.
                  IO.InMemoryStore.Token.set(
                    inMemoryStore.token,
                    ~key=entity.id,
                    ~dbOp=Types.Read,
                    ~entity,
                  )
                  entity
                | None =>
                  Logging.error(`LiquidityPool token0 data not found. Loading associated token from database.
This is likely due to a database corruption. Please reach out to the team on discord.
`)

                  raise(
                    UnableToLoadNonNullableLinkedEntity(
                      "The required linked entity token0 of LiquidityPool is undefined.",
                    ),
                  )
                }
              }
            },
            getToken1: async liquidityPool => {
              let token1_field = liquidityPool.token1
              let optToken1 = inMemoryStore.token->IO.InMemoryStore.Token.get(token1_field)
              switch optToken1 {
              | Some(token1) => token1
              | None =>
                let entities = await asyncGetters.getToken(token1_field)

                switch entities->Belt.Array.get(0) {
                | Some(entity) =>
                  // TODO: make this work with the test framework too.
                  IO.InMemoryStore.Token.set(
                    inMemoryStore.token,
                    ~key=entity.id,
                    ~dbOp=Types.Read,
                    ~entity,
                  )
                  entity
                | None =>
                  Logging.error(`LiquidityPool token1 data not found. Loading associated token from database.
This is likely due to a database corruption. Please reach out to the team on discord.
`)

                  raise(
                    UnableToLoadNonNullableLinkedEntity(
                      "The required linked entity token1 of LiquidityPool is undefined.",
                    ),
                  )
                }
              }
            },
          },
          liquidityPoolDailySnapshot: {
            set: entity => {
              inMemoryStore.liquidityPoolDailySnapshot->IO.InMemoryStore.LiquidityPoolDailySnapshot.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(liquidityPoolDailySnapshot) with ID ${id}.`,
              ),
          },
          liquidityPoolHourlySnapshot: {
            set: entity => {
              inMemoryStore.liquidityPoolHourlySnapshot->IO.InMemoryStore.LiquidityPoolHourlySnapshot.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(liquidityPoolHourlySnapshot) with ID ${id}.`,
              ),
          },
          liquidityPoolUserMapping: {
            set: entity => {
              inMemoryStore.liquidityPoolUserMapping->IO.InMemoryStore.LiquidityPoolUserMapping.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(liquidityPoolUserMapping) with ID ${id}.`,
              ),
            getLiquidityPool: async liquidityPoolUserMapping => {
              let liquidityPool_field = liquidityPoolUserMapping.liquidityPool
              let optLiquidityPool =
                inMemoryStore.liquidityPool->IO.InMemoryStore.LiquidityPool.get(liquidityPool_field)
              switch optLiquidityPool {
              | Some(liquidityPool) => liquidityPool
              | None =>
                let entities = await asyncGetters.getLiquidityPool(liquidityPool_field)

                switch entities->Belt.Array.get(0) {
                | Some(entity) =>
                  // TODO: make this work with the test framework too.
                  IO.InMemoryStore.LiquidityPool.set(
                    inMemoryStore.liquidityPool,
                    ~key=entity.id,
                    ~dbOp=Types.Read,
                    ~entity,
                  )
                  entity
                | None =>
                  Logging.error(`LiquidityPoolUserMapping liquidityPool data not found. Loading associated liquidityPool from database.
This is likely due to a database corruption. Please reach out to the team on discord.
`)

                  raise(
                    UnableToLoadNonNullableLinkedEntity(
                      "The required linked entity liquidityPool of LiquidityPoolUserMapping is undefined.",
                    ),
                  )
                }
              }
            },
            getUser: async liquidityPoolUserMapping => {
              let user_field = liquidityPoolUserMapping.user
              let optUser = inMemoryStore.user->IO.InMemoryStore.User.get(user_field)
              switch optUser {
              | Some(user) => user
              | None =>
                let entities = await asyncGetters.getUser(user_field)

                switch entities->Belt.Array.get(0) {
                | Some(entity) =>
                  // TODO: make this work with the test framework too.
                  IO.InMemoryStore.User.set(
                    inMemoryStore.user,
                    ~key=entity.id,
                    ~dbOp=Types.Read,
                    ~entity,
                  )
                  entity
                | None =>
                  Logging.error(`LiquidityPoolUserMapping user data not found. Loading associated user from database.
This is likely due to a database corruption. Please reach out to the team on discord.
`)

                  raise(
                    UnableToLoadNonNullableLinkedEntity(
                      "The required linked entity user of LiquidityPoolUserMapping is undefined.",
                    ),
                  )
                }
              }
            },
          },
          liquidityPoolWeeklySnapshot: {
            set: entity => {
              inMemoryStore.liquidityPoolWeeklySnapshot->IO.InMemoryStore.LiquidityPoolWeeklySnapshot.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(liquidityPoolWeeklySnapshot) with ID ${id}.`,
              ),
          },
          stateStore: {
            set: entity => {
              inMemoryStore.stateStore->IO.InMemoryStore.StateStore.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(`[unimplemented delete] can't delete entity(stateStore) with ID ${id}.`),
            stateStore: stateStore_StateStore,
            get: async (id: Types.id) => {
              if optSetOfIds_stateStore->Set.has(id) {
                inMemoryStore.stateStore->IO.InMemoryStore.StateStore.get(id)
              } else {
                // NOTE: this will still retern the value if it exists in the in-memory store (despite the loader not being run).
                switch inMemoryStore.stateStore->IO.InMemoryStore.StateStore.get(id) {
                | Some(entity) => Some(entity)
                | None =>
                  let entities = await asyncGetters.getStateStore(id)

                  switch entities->Belt.Array.get(0) {
                  | Some(entity) =>
                    // TODO: make this work with the test framework too.
                    IO.InMemoryStore.StateStore.set(
                      inMemoryStore.stateStore,
                      ~key=entity.id,
                      ~dbOp=Types.Read,
                      ~entity,
                    )
                    Some(entity)
                  | None => None
                  }
                }
              }
            },
            getLatestEthPrice: async stateStore => {
              let latestEthPrice_field = stateStore.latestEthPrice
              let optLatestEthPrice =
                inMemoryStore.latestETHPrice->IO.InMemoryStore.LatestETHPrice.get(
                  latestEthPrice_field,
                )
              switch optLatestEthPrice {
              | Some(latestEthPrice) => latestEthPrice
              | None =>
                let entities = await asyncGetters.getLatestETHPrice(latestEthPrice_field)

                switch entities->Belt.Array.get(0) {
                | Some(entity) =>
                  // TODO: make this work with the test framework too.
                  IO.InMemoryStore.LatestETHPrice.set(
                    inMemoryStore.latestETHPrice,
                    ~key=entity.id,
                    ~dbOp=Types.Read,
                    ~entity,
                  )
                  entity
                | None =>
                  Logging.error(`StateStore latestEthPrice data not found. Loading associated latestETHPrice from database.
This is likely due to a database corruption. Please reach out to the team on discord.
`)

                  raise(
                    UnableToLoadNonNullableLinkedEntity(
                      "The required linked entity latestEthPrice of StateStore is undefined.",
                    ),
                  )
                }
              }
            },
          },
          token: {
            set: entity => {
              inMemoryStore.token->IO.InMemoryStore.Token.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(`[unimplemented delete] can't delete entity(token) with ID ${id}.`),
            whitelistedTokens: whitelistedTokens_Token,
            get: async (id: Types.id) => {
              if optSetOfIds_token->Set.has(id) {
                inMemoryStore.token->IO.InMemoryStore.Token.get(id)
              } else {
                // NOTE: this will still retern the value if it exists in the in-memory store (despite the loader not being run).
                switch inMemoryStore.token->IO.InMemoryStore.Token.get(id) {
                | Some(entity) => Some(entity)
                | None =>
                  let entities = await asyncGetters.getToken(id)

                  switch entities->Belt.Array.get(0) {
                  | Some(entity) =>
                    // TODO: make this work with the test framework too.
                    IO.InMemoryStore.Token.set(
                      inMemoryStore.token,
                      ~key=entity.id,
                      ~dbOp=Types.Read,
                      ~entity,
                    )
                    Some(entity)
                  | None => None
                  }
                }
              }
            },
          },
          tokenDailySnapshot: {
            set: entity => {
              inMemoryStore.tokenDailySnapshot->IO.InMemoryStore.TokenDailySnapshot.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(tokenDailySnapshot) with ID ${id}.`,
              ),
          },
          tokenHourlySnapshot: {
            set: entity => {
              inMemoryStore.tokenHourlySnapshot->IO.InMemoryStore.TokenHourlySnapshot.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(tokenHourlySnapshot) with ID ${id}.`,
              ),
          },
          tokenWeeklySnapshot: {
            set: entity => {
              inMemoryStore.tokenWeeklySnapshot->IO.InMemoryStore.TokenWeeklySnapshot.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(tokenWeeklySnapshot) with ID ${id}.`,
              ),
          },
          user: {
            set: entity => {
              inMemoryStore.user->IO.InMemoryStore.User.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(`[unimplemented delete] can't delete entity(user) with ID ${id}.`),
          },
        }
      }

      {
        log: contextLogger,
        getEntitiesToLoad: () => entitiesToLoad,
        getAddedDynamicContractRegistrations: () => addedDynamicContractRegistrations,
        getLoaderContext: () => loaderContext,
        getHandlerContextSync,
        getHandlerContextAsync,
      }
    }
  }
}

module PoolFactoryContract = {
  module PoolCreatedEvent = {
    type loaderContext = Types.PoolFactoryContract.PoolCreatedEvent.loaderContext
    type handlerContext = Types.PoolFactoryContract.PoolCreatedEvent.handlerContext
    type handlerContextAsync = Types.PoolFactoryContract.PoolCreatedEvent.handlerContextAsync
    type context = genericContextCreatorFunctions<
      loaderContext,
      handlerContext,
      handlerContextAsync,
    >

    let contextCreator: contextCreator<
      Types.PoolFactoryContract.PoolCreatedEvent.eventArgs,
      loaderContext,
      handlerContext,
      handlerContextAsync,
    > = (~inMemoryStore, ~chainId, ~event, ~logger, ~asyncGetters) => {
      // NOTE: we could optimise this code to onle create a logger if there was a log called.
      let logger = logger->Logging.createChildFrom(
        ~logger=_,
        ~params={
          "context": "PoolFactory.PoolCreated",
          "chainId": chainId,
          "block": event.blockNumber,
          "logIndex": event.logIndex,
          "txHash": event.transactionHash,
        },
      )

      let contextLogger: Logs.userLogger = {
        info: (message: string) => logger->Logging.uinfo(message),
        debug: (message: string) => logger->Logging.udebug(message),
        warn: (message: string) => logger->Logging.uwarn(message),
        error: (message: string) => logger->Logging.uerror(message),
        errorWithExn: (exn: option<Js.Exn.t>, message: string) =>
          logger->Logging.uerrorWithExn(exn, message),
      }

      let optIdOf_stateStore = ref(None)
      let optSetOfIds_stateStore: Set.t<Types.id> = Set.make()

      let entitiesToLoad: array<Types.entityRead> = []

      let addedDynamicContractRegistrations: array<Types.dynamicContractRegistryEntity> = []

      //Loader context can be defined as a value and the getter can return that value

      @warning("-16")
      let loaderContext: loaderContext = {
        log: contextLogger,
        contractRegistration: {
          //TODO only add contracts we've registered for the event in the config
          addPool: (contractAddress: Ethers.ethAddress) => {
            let eventId = EventUtils.packEventIndex(
              ~blockNumber=event.blockNumber,
              ~logIndex=event.logIndex,
            )
            let dynamicContractRegistration: Types.dynamicContractRegistryEntity = {
              chainId,
              eventId,
              contractAddress,
              contractType: "Pool",
            }

            addedDynamicContractRegistrations->Js.Array2.push(dynamicContractRegistration)->ignore

            inMemoryStore.dynamicContractRegistry->IO.InMemoryStore.DynamicContractRegistry.set(
              ~key={chainId, contractAddress},
              ~entity=dynamicContractRegistration,
              ~dbOp=Set,
            )
          },
          //TODO only add contracts we've registered for the event in the config
          addPoolFactory: (contractAddress: Ethers.ethAddress) => {
            let eventId = EventUtils.packEventIndex(
              ~blockNumber=event.blockNumber,
              ~logIndex=event.logIndex,
            )
            let dynamicContractRegistration: Types.dynamicContractRegistryEntity = {
              chainId,
              eventId,
              contractAddress,
              contractType: "PoolFactory",
            }

            addedDynamicContractRegistrations->Js.Array2.push(dynamicContractRegistration)->ignore

            inMemoryStore.dynamicContractRegistry->IO.InMemoryStore.DynamicContractRegistry.set(
              ~key={chainId, contractAddress},
              ~entity=dynamicContractRegistration,
              ~dbOp=Set,
            )
          },
          //TODO only add contracts we've registered for the event in the config
          addVoter: (contractAddress: Ethers.ethAddress) => {
            let eventId = EventUtils.packEventIndex(
              ~blockNumber=event.blockNumber,
              ~logIndex=event.logIndex,
            )
            let dynamicContractRegistration: Types.dynamicContractRegistryEntity = {
              chainId,
              eventId,
              contractAddress,
              contractType: "Voter",
            }

            addedDynamicContractRegistrations->Js.Array2.push(dynamicContractRegistration)->ignore

            inMemoryStore.dynamicContractRegistry->IO.InMemoryStore.DynamicContractRegistry.set(
              ~key={chainId, contractAddress},
              ~entity=dynamicContractRegistration,
              ~dbOp=Set,
            )
          },
        },
        stateStore: {
          stateStoreLoad: (id: Types.id, ~loaders={}) => {
            optIdOf_stateStore := Some(id)

            let _ = Js.Array2.push(entitiesToLoad, Types.StateStoreRead(id, loaders))
          },
          load: (id: Types.id, ~loaders={}) => {
            let _ = optSetOfIds_stateStore->Set.add(id)
            let _ = Js.Array2.push(entitiesToLoad, Types.StateStoreRead(id, loaders))
          },
        },
      }

      //handler context must be defined as a getter functoin so that it can construct the context
      //without stale values whenever it is used
      let getHandlerContextSync: unit => handlerContext = () => {
        let stateStore_StateStore = switch optIdOf_stateStore.contents {
        | Some(id) => inMemoryStore.stateStore->IO.InMemoryStore.StateStore.get(id)
        | None =>
          Logging.warn(`The loader for "stateStore" of entity type "StateStore"" was not used please add it to your loader function or remove it from your config.yaml file to avoid unexpected behaviour. This is a runtime validation check.`)
          None
        }
        {
          log: contextLogger,
          gauge: {
            set: entity => {
              inMemoryStore.gauge->IO.InMemoryStore.Gauge.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(`[unimplemented delete] can't delete entity(gauge) with ID ${id}.`),
            getPool: gauge => {
              let optPool =
                inMemoryStore.liquidityPool->IO.InMemoryStore.LiquidityPool.get(gauge.pool)
              switch optPool {
              | Some(pool) => pool
              | None =>
                Logging.warn(`Gauge pool data not found. Loading associated liquidityPool from database.
Please consider loading the liquidityPool in the UpdateGauge entity loader to greatly improve sync speed of your application.
`)

                raise(
                  LinkedEntityNotAvailableInSyncHandler(
                    "The required linked entity of Gauge is undefined.",
                  ),
                )
              }
            },
          },
          latestETHPrice: {
            set: entity => {
              inMemoryStore.latestETHPrice->IO.InMemoryStore.LatestETHPrice.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(latestETHPrice) with ID ${id}.`,
              ),
          },
          liquidityPool: {
            set: entity => {
              inMemoryStore.liquidityPool->IO.InMemoryStore.LiquidityPool.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(liquidityPool) with ID ${id}.`,
              ),
            getToken0: liquidityPool => {
              let optToken0 = inMemoryStore.token->IO.InMemoryStore.Token.get(liquidityPool.token0)
              switch optToken0 {
              | Some(token0) => token0
              | None =>
                Logging.warn(`LiquidityPool token0 data not found. Loading associated token from database.
Please consider loading the token in the UpdateLiquidityPool entity loader to greatly improve sync speed of your application.
`)

                raise(
                  LinkedEntityNotAvailableInSyncHandler(
                    "The required linked entity of LiquidityPool is undefined.",
                  ),
                )
              }
            },
            getToken1: liquidityPool => {
              let optToken1 = inMemoryStore.token->IO.InMemoryStore.Token.get(liquidityPool.token1)
              switch optToken1 {
              | Some(token1) => token1
              | None =>
                Logging.warn(`LiquidityPool token1 data not found. Loading associated token from database.
Please consider loading the token in the UpdateLiquidityPool entity loader to greatly improve sync speed of your application.
`)

                raise(
                  LinkedEntityNotAvailableInSyncHandler(
                    "The required linked entity of LiquidityPool is undefined.",
                  ),
                )
              }
            },
          },
          liquidityPoolDailySnapshot: {
            set: entity => {
              inMemoryStore.liquidityPoolDailySnapshot->IO.InMemoryStore.LiquidityPoolDailySnapshot.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(liquidityPoolDailySnapshot) with ID ${id}.`,
              ),
          },
          liquidityPoolHourlySnapshot: {
            set: entity => {
              inMemoryStore.liquidityPoolHourlySnapshot->IO.InMemoryStore.LiquidityPoolHourlySnapshot.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(liquidityPoolHourlySnapshot) with ID ${id}.`,
              ),
          },
          liquidityPoolUserMapping: {
            set: entity => {
              inMemoryStore.liquidityPoolUserMapping->IO.InMemoryStore.LiquidityPoolUserMapping.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(liquidityPoolUserMapping) with ID ${id}.`,
              ),
            getLiquidityPool: liquidityPoolUserMapping => {
              let optLiquidityPool =
                inMemoryStore.liquidityPool->IO.InMemoryStore.LiquidityPool.get(
                  liquidityPoolUserMapping.liquidityPool,
                )
              switch optLiquidityPool {
              | Some(liquidityPool) => liquidityPool
              | None =>
                Logging.warn(`LiquidityPoolUserMapping liquidityPool data not found. Loading associated liquidityPool from database.
Please consider loading the liquidityPool in the UpdateLiquidityPoolUserMapping entity loader to greatly improve sync speed of your application.
`)

                raise(
                  LinkedEntityNotAvailableInSyncHandler(
                    "The required linked entity of LiquidityPoolUserMapping is undefined.",
                  ),
                )
              }
            },
            getUser: liquidityPoolUserMapping => {
              let optUser =
                inMemoryStore.user->IO.InMemoryStore.User.get(liquidityPoolUserMapping.user)
              switch optUser {
              | Some(user) => user
              | None =>
                Logging.warn(`LiquidityPoolUserMapping user data not found. Loading associated user from database.
Please consider loading the user in the UpdateLiquidityPoolUserMapping entity loader to greatly improve sync speed of your application.
`)

                raise(
                  LinkedEntityNotAvailableInSyncHandler(
                    "The required linked entity of LiquidityPoolUserMapping is undefined.",
                  ),
                )
              }
            },
          },
          liquidityPoolWeeklySnapshot: {
            set: entity => {
              inMemoryStore.liquidityPoolWeeklySnapshot->IO.InMemoryStore.LiquidityPoolWeeklySnapshot.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(liquidityPoolWeeklySnapshot) with ID ${id}.`,
              ),
          },
          stateStore: {
            set: entity => {
              inMemoryStore.stateStore->IO.InMemoryStore.StateStore.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(`[unimplemented delete] can't delete entity(stateStore) with ID ${id}.`),
            stateStore: stateStore_StateStore,
            get: (id: Types.id) => {
              if optSetOfIds_stateStore->Set.has(id) {
                inMemoryStore.stateStore->IO.InMemoryStore.StateStore.get(id)
              } else {
                Logging.warn(
                  `The loader for a "StateStore" of entity with id "${id}" was not used please add it to your default loader function (ie. place 'context.stateStore.load("${id}")' inside your loader) to avoid unexpected behaviour. This is a runtime validation check.`,
                )

                // NOTE: this will still retern the value if it exists in the in-memory store (despite the loader not being run).
                inMemoryStore.stateStore->IO.InMemoryStore.StateStore.get(id)

                // TODO: add a further step to syncronously try fetch this from the DB if it isn't in the in-memory store - similar to this PR: https://github.com/Float-Capital/indexer/pull/759
              }
            },
            getLatestEthPrice: stateStore => {
              let optLatestEthPrice =
                inMemoryStore.latestETHPrice->IO.InMemoryStore.LatestETHPrice.get(
                  stateStore.latestEthPrice,
                )
              switch optLatestEthPrice {
              | Some(latestEthPrice) => latestEthPrice
              | None =>
                Logging.warn(`StateStore latestEthPrice data not found. Loading associated latestETHPrice from database.
Please consider loading the latestETHPrice in the UpdateStateStore entity loader to greatly improve sync speed of your application.
`)

                raise(
                  LinkedEntityNotAvailableInSyncHandler(
                    "The required linked entity of StateStore is undefined.",
                  ),
                )
              }
            },
          },
          token: {
            set: entity => {
              inMemoryStore.token->IO.InMemoryStore.Token.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(`[unimplemented delete] can't delete entity(token) with ID ${id}.`),
          },
          tokenDailySnapshot: {
            set: entity => {
              inMemoryStore.tokenDailySnapshot->IO.InMemoryStore.TokenDailySnapshot.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(tokenDailySnapshot) with ID ${id}.`,
              ),
          },
          tokenHourlySnapshot: {
            set: entity => {
              inMemoryStore.tokenHourlySnapshot->IO.InMemoryStore.TokenHourlySnapshot.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(tokenHourlySnapshot) with ID ${id}.`,
              ),
          },
          tokenWeeklySnapshot: {
            set: entity => {
              inMemoryStore.tokenWeeklySnapshot->IO.InMemoryStore.TokenWeeklySnapshot.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(tokenWeeklySnapshot) with ID ${id}.`,
              ),
          },
          user: {
            set: entity => {
              inMemoryStore.user->IO.InMemoryStore.User.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(`[unimplemented delete] can't delete entity(user) with ID ${id}.`),
          },
        }
      }

      let getHandlerContextAsync = (): handlerContextAsync => {
        let stateStore_StateStore = switch optIdOf_stateStore.contents {
        | Some(id) => inMemoryStore.stateStore->IO.InMemoryStore.StateStore.get(id)
        | None =>
          Logging.warn(`The loader for "stateStore" of entity type "StateStore"" was not used please add it to your loader function or remove it from your config.yaml file to avoid unexpected behaviour. This is a runtime validation check.`)
          None
        }
        {
          log: contextLogger,
          gauge: {
            set: entity => {
              inMemoryStore.gauge->IO.InMemoryStore.Gauge.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(`[unimplemented delete] can't delete entity(gauge) with ID ${id}.`),
            getPool: async gauge => {
              let pool_field = gauge.pool
              let optPool =
                inMemoryStore.liquidityPool->IO.InMemoryStore.LiquidityPool.get(pool_field)
              switch optPool {
              | Some(pool) => pool
              | None =>
                let entities = await asyncGetters.getLiquidityPool(pool_field)

                switch entities->Belt.Array.get(0) {
                | Some(entity) =>
                  // TODO: make this work with the test framework too.
                  IO.InMemoryStore.LiquidityPool.set(
                    inMemoryStore.liquidityPool,
                    ~key=entity.id,
                    ~dbOp=Types.Read,
                    ~entity,
                  )
                  entity
                | None =>
                  Logging.error(`Gauge pool data not found. Loading associated liquidityPool from database.
This is likely due to a database corruption. Please reach out to the team on discord.
`)

                  raise(
                    UnableToLoadNonNullableLinkedEntity(
                      "The required linked entity pool of Gauge is undefined.",
                    ),
                  )
                }
              }
            },
          },
          latestETHPrice: {
            set: entity => {
              inMemoryStore.latestETHPrice->IO.InMemoryStore.LatestETHPrice.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(latestETHPrice) with ID ${id}.`,
              ),
          },
          liquidityPool: {
            set: entity => {
              inMemoryStore.liquidityPool->IO.InMemoryStore.LiquidityPool.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(liquidityPool) with ID ${id}.`,
              ),
            getToken0: async liquidityPool => {
              let token0_field = liquidityPool.token0
              let optToken0 = inMemoryStore.token->IO.InMemoryStore.Token.get(token0_field)
              switch optToken0 {
              | Some(token0) => token0
              | None =>
                let entities = await asyncGetters.getToken(token0_field)

                switch entities->Belt.Array.get(0) {
                | Some(entity) =>
                  // TODO: make this work with the test framework too.
                  IO.InMemoryStore.Token.set(
                    inMemoryStore.token,
                    ~key=entity.id,
                    ~dbOp=Types.Read,
                    ~entity,
                  )
                  entity
                | None =>
                  Logging.error(`LiquidityPool token0 data not found. Loading associated token from database.
This is likely due to a database corruption. Please reach out to the team on discord.
`)

                  raise(
                    UnableToLoadNonNullableLinkedEntity(
                      "The required linked entity token0 of LiquidityPool is undefined.",
                    ),
                  )
                }
              }
            },
            getToken1: async liquidityPool => {
              let token1_field = liquidityPool.token1
              let optToken1 = inMemoryStore.token->IO.InMemoryStore.Token.get(token1_field)
              switch optToken1 {
              | Some(token1) => token1
              | None =>
                let entities = await asyncGetters.getToken(token1_field)

                switch entities->Belt.Array.get(0) {
                | Some(entity) =>
                  // TODO: make this work with the test framework too.
                  IO.InMemoryStore.Token.set(
                    inMemoryStore.token,
                    ~key=entity.id,
                    ~dbOp=Types.Read,
                    ~entity,
                  )
                  entity
                | None =>
                  Logging.error(`LiquidityPool token1 data not found. Loading associated token from database.
This is likely due to a database corruption. Please reach out to the team on discord.
`)

                  raise(
                    UnableToLoadNonNullableLinkedEntity(
                      "The required linked entity token1 of LiquidityPool is undefined.",
                    ),
                  )
                }
              }
            },
          },
          liquidityPoolDailySnapshot: {
            set: entity => {
              inMemoryStore.liquidityPoolDailySnapshot->IO.InMemoryStore.LiquidityPoolDailySnapshot.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(liquidityPoolDailySnapshot) with ID ${id}.`,
              ),
          },
          liquidityPoolHourlySnapshot: {
            set: entity => {
              inMemoryStore.liquidityPoolHourlySnapshot->IO.InMemoryStore.LiquidityPoolHourlySnapshot.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(liquidityPoolHourlySnapshot) with ID ${id}.`,
              ),
          },
          liquidityPoolUserMapping: {
            set: entity => {
              inMemoryStore.liquidityPoolUserMapping->IO.InMemoryStore.LiquidityPoolUserMapping.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(liquidityPoolUserMapping) with ID ${id}.`,
              ),
            getLiquidityPool: async liquidityPoolUserMapping => {
              let liquidityPool_field = liquidityPoolUserMapping.liquidityPool
              let optLiquidityPool =
                inMemoryStore.liquidityPool->IO.InMemoryStore.LiquidityPool.get(liquidityPool_field)
              switch optLiquidityPool {
              | Some(liquidityPool) => liquidityPool
              | None =>
                let entities = await asyncGetters.getLiquidityPool(liquidityPool_field)

                switch entities->Belt.Array.get(0) {
                | Some(entity) =>
                  // TODO: make this work with the test framework too.
                  IO.InMemoryStore.LiquidityPool.set(
                    inMemoryStore.liquidityPool,
                    ~key=entity.id,
                    ~dbOp=Types.Read,
                    ~entity,
                  )
                  entity
                | None =>
                  Logging.error(`LiquidityPoolUserMapping liquidityPool data not found. Loading associated liquidityPool from database.
This is likely due to a database corruption. Please reach out to the team on discord.
`)

                  raise(
                    UnableToLoadNonNullableLinkedEntity(
                      "The required linked entity liquidityPool of LiquidityPoolUserMapping is undefined.",
                    ),
                  )
                }
              }
            },
            getUser: async liquidityPoolUserMapping => {
              let user_field = liquidityPoolUserMapping.user
              let optUser = inMemoryStore.user->IO.InMemoryStore.User.get(user_field)
              switch optUser {
              | Some(user) => user
              | None =>
                let entities = await asyncGetters.getUser(user_field)

                switch entities->Belt.Array.get(0) {
                | Some(entity) =>
                  // TODO: make this work with the test framework too.
                  IO.InMemoryStore.User.set(
                    inMemoryStore.user,
                    ~key=entity.id,
                    ~dbOp=Types.Read,
                    ~entity,
                  )
                  entity
                | None =>
                  Logging.error(`LiquidityPoolUserMapping user data not found. Loading associated user from database.
This is likely due to a database corruption. Please reach out to the team on discord.
`)

                  raise(
                    UnableToLoadNonNullableLinkedEntity(
                      "The required linked entity user of LiquidityPoolUserMapping is undefined.",
                    ),
                  )
                }
              }
            },
          },
          liquidityPoolWeeklySnapshot: {
            set: entity => {
              inMemoryStore.liquidityPoolWeeklySnapshot->IO.InMemoryStore.LiquidityPoolWeeklySnapshot.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(liquidityPoolWeeklySnapshot) with ID ${id}.`,
              ),
          },
          stateStore: {
            set: entity => {
              inMemoryStore.stateStore->IO.InMemoryStore.StateStore.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(`[unimplemented delete] can't delete entity(stateStore) with ID ${id}.`),
            stateStore: stateStore_StateStore,
            get: async (id: Types.id) => {
              if optSetOfIds_stateStore->Set.has(id) {
                inMemoryStore.stateStore->IO.InMemoryStore.StateStore.get(id)
              } else {
                // NOTE: this will still retern the value if it exists in the in-memory store (despite the loader not being run).
                switch inMemoryStore.stateStore->IO.InMemoryStore.StateStore.get(id) {
                | Some(entity) => Some(entity)
                | None =>
                  let entities = await asyncGetters.getStateStore(id)

                  switch entities->Belt.Array.get(0) {
                  | Some(entity) =>
                    // TODO: make this work with the test framework too.
                    IO.InMemoryStore.StateStore.set(
                      inMemoryStore.stateStore,
                      ~key=entity.id,
                      ~dbOp=Types.Read,
                      ~entity,
                    )
                    Some(entity)
                  | None => None
                  }
                }
              }
            },
            getLatestEthPrice: async stateStore => {
              let latestEthPrice_field = stateStore.latestEthPrice
              let optLatestEthPrice =
                inMemoryStore.latestETHPrice->IO.InMemoryStore.LatestETHPrice.get(
                  latestEthPrice_field,
                )
              switch optLatestEthPrice {
              | Some(latestEthPrice) => latestEthPrice
              | None =>
                let entities = await asyncGetters.getLatestETHPrice(latestEthPrice_field)

                switch entities->Belt.Array.get(0) {
                | Some(entity) =>
                  // TODO: make this work with the test framework too.
                  IO.InMemoryStore.LatestETHPrice.set(
                    inMemoryStore.latestETHPrice,
                    ~key=entity.id,
                    ~dbOp=Types.Read,
                    ~entity,
                  )
                  entity
                | None =>
                  Logging.error(`StateStore latestEthPrice data not found. Loading associated latestETHPrice from database.
This is likely due to a database corruption. Please reach out to the team on discord.
`)

                  raise(
                    UnableToLoadNonNullableLinkedEntity(
                      "The required linked entity latestEthPrice of StateStore is undefined.",
                    ),
                  )
                }
              }
            },
          },
          token: {
            set: entity => {
              inMemoryStore.token->IO.InMemoryStore.Token.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(`[unimplemented delete] can't delete entity(token) with ID ${id}.`),
          },
          tokenDailySnapshot: {
            set: entity => {
              inMemoryStore.tokenDailySnapshot->IO.InMemoryStore.TokenDailySnapshot.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(tokenDailySnapshot) with ID ${id}.`,
              ),
          },
          tokenHourlySnapshot: {
            set: entity => {
              inMemoryStore.tokenHourlySnapshot->IO.InMemoryStore.TokenHourlySnapshot.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(tokenHourlySnapshot) with ID ${id}.`,
              ),
          },
          tokenWeeklySnapshot: {
            set: entity => {
              inMemoryStore.tokenWeeklySnapshot->IO.InMemoryStore.TokenWeeklySnapshot.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(tokenWeeklySnapshot) with ID ${id}.`,
              ),
          },
          user: {
            set: entity => {
              inMemoryStore.user->IO.InMemoryStore.User.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(`[unimplemented delete] can't delete entity(user) with ID ${id}.`),
          },
        }
      }

      {
        log: contextLogger,
        getEntitiesToLoad: () => entitiesToLoad,
        getAddedDynamicContractRegistrations: () => addedDynamicContractRegistrations,
        getLoaderContext: () => loaderContext,
        getHandlerContextSync,
        getHandlerContextAsync,
      }
    }
  }
}

module VoterContract = {
  module DistributeRewardEvent = {
    type loaderContext = Types.VoterContract.DistributeRewardEvent.loaderContext
    type handlerContext = Types.VoterContract.DistributeRewardEvent.handlerContext
    type handlerContextAsync = Types.VoterContract.DistributeRewardEvent.handlerContextAsync
    type context = genericContextCreatorFunctions<
      loaderContext,
      handlerContext,
      handlerContextAsync,
    >

    let contextCreator: contextCreator<
      Types.VoterContract.DistributeRewardEvent.eventArgs,
      loaderContext,
      handlerContext,
      handlerContextAsync,
    > = (~inMemoryStore, ~chainId, ~event, ~logger, ~asyncGetters) => {
      // NOTE: we could optimise this code to onle create a logger if there was a log called.
      let logger = logger->Logging.createChildFrom(
        ~logger=_,
        ~params={
          "context": "Voter.DistributeReward",
          "chainId": chainId,
          "block": event.blockNumber,
          "logIndex": event.logIndex,
          "txHash": event.transactionHash,
        },
      )

      let contextLogger: Logs.userLogger = {
        info: (message: string) => logger->Logging.uinfo(message),
        debug: (message: string) => logger->Logging.udebug(message),
        warn: (message: string) => logger->Logging.uwarn(message),
        error: (message: string) => logger->Logging.uerror(message),
        errorWithExn: (exn: option<Js.Exn.t>, message: string) =>
          logger->Logging.uerrorWithExn(exn, message),
      }

      let optSetOfIds_gauge: Set.t<Types.id> = Set.make()
      let optIdOf_rewardToken = ref(None)
      let optSetOfIds_token: Set.t<Types.id> = Set.make()

      let entitiesToLoad: array<Types.entityRead> = []

      let addedDynamicContractRegistrations: array<Types.dynamicContractRegistryEntity> = []

      //Loader context can be defined as a value and the getter can return that value

      @warning("-16")
      let loaderContext: loaderContext = {
        log: contextLogger,
        contractRegistration: {
          //TODO only add contracts we've registered for the event in the config
          addPool: (contractAddress: Ethers.ethAddress) => {
            let eventId = EventUtils.packEventIndex(
              ~blockNumber=event.blockNumber,
              ~logIndex=event.logIndex,
            )
            let dynamicContractRegistration: Types.dynamicContractRegistryEntity = {
              chainId,
              eventId,
              contractAddress,
              contractType: "Pool",
            }

            addedDynamicContractRegistrations->Js.Array2.push(dynamicContractRegistration)->ignore

            inMemoryStore.dynamicContractRegistry->IO.InMemoryStore.DynamicContractRegistry.set(
              ~key={chainId, contractAddress},
              ~entity=dynamicContractRegistration,
              ~dbOp=Set,
            )
          },
          //TODO only add contracts we've registered for the event in the config
          addPoolFactory: (contractAddress: Ethers.ethAddress) => {
            let eventId = EventUtils.packEventIndex(
              ~blockNumber=event.blockNumber,
              ~logIndex=event.logIndex,
            )
            let dynamicContractRegistration: Types.dynamicContractRegistryEntity = {
              chainId,
              eventId,
              contractAddress,
              contractType: "PoolFactory",
            }

            addedDynamicContractRegistrations->Js.Array2.push(dynamicContractRegistration)->ignore

            inMemoryStore.dynamicContractRegistry->IO.InMemoryStore.DynamicContractRegistry.set(
              ~key={chainId, contractAddress},
              ~entity=dynamicContractRegistration,
              ~dbOp=Set,
            )
          },
          //TODO only add contracts we've registered for the event in the config
          addVoter: (contractAddress: Ethers.ethAddress) => {
            let eventId = EventUtils.packEventIndex(
              ~blockNumber=event.blockNumber,
              ~logIndex=event.logIndex,
            )
            let dynamicContractRegistration: Types.dynamicContractRegistryEntity = {
              chainId,
              eventId,
              contractAddress,
              contractType: "Voter",
            }

            addedDynamicContractRegistrations->Js.Array2.push(dynamicContractRegistration)->ignore

            inMemoryStore.dynamicContractRegistry->IO.InMemoryStore.DynamicContractRegistry.set(
              ~key={chainId, contractAddress},
              ~entity=dynamicContractRegistration,
              ~dbOp=Set,
            )
          },
        },
        gauge: {
          load: (id: Types.id, ~loaders={}) => {
            let _ = optSetOfIds_gauge->Set.add(id)
            let _ = Js.Array2.push(entitiesToLoad, Types.GaugeRead(id, loaders))
          },
        },
        token: {
          rewardTokenLoad: (id: Types.id) => {
            optIdOf_rewardToken := Some(id)

            let _ = Js.Array2.push(entitiesToLoad, Types.TokenRead(id))
          },
          load: (id: Types.id) => {
            let _ = optSetOfIds_token->Set.add(id)
            let _ = Js.Array2.push(entitiesToLoad, Types.TokenRead(id))
          },
        },
      }

      //handler context must be defined as a getter functoin so that it can construct the context
      //without stale values whenever it is used
      let getHandlerContextSync: unit => handlerContext = () => {
        let rewardToken_Token = switch optIdOf_rewardToken.contents {
        | Some(id) => inMemoryStore.token->IO.InMemoryStore.Token.get(id)
        | None =>
          Logging.warn(`The loader for "rewardToken" of entity type "Token"" was not used please add it to your loader function or remove it from your config.yaml file to avoid unexpected behaviour. This is a runtime validation check.`)
          None
        }
        {
          log: contextLogger,
          gauge: {
            set: entity => {
              inMemoryStore.gauge->IO.InMemoryStore.Gauge.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(`[unimplemented delete] can't delete entity(gauge) with ID ${id}.`),
            get: (id: Types.id) => {
              if optSetOfIds_gauge->Set.has(id) {
                inMemoryStore.gauge->IO.InMemoryStore.Gauge.get(id)
              } else {
                Logging.warn(
                  `The loader for a "Gauge" of entity with id "${id}" was not used please add it to your default loader function (ie. place 'context.gauge.load("${id}")' inside your loader) to avoid unexpected behaviour. This is a runtime validation check.`,
                )

                // NOTE: this will still retern the value if it exists in the in-memory store (despite the loader not being run).
                inMemoryStore.gauge->IO.InMemoryStore.Gauge.get(id)

                // TODO: add a further step to syncronously try fetch this from the DB if it isn't in the in-memory store - similar to this PR: https://github.com/Float-Capital/indexer/pull/759
              }
            },
            getPool: gauge => {
              let optPool =
                inMemoryStore.liquidityPool->IO.InMemoryStore.LiquidityPool.get(gauge.pool)
              switch optPool {
              | Some(pool) => pool
              | None =>
                Logging.warn(`Gauge pool data not found. Loading associated liquidityPool from database.
Please consider loading the liquidityPool in the UpdateGauge entity loader to greatly improve sync speed of your application.
`)

                raise(
                  LinkedEntityNotAvailableInSyncHandler(
                    "The required linked entity of Gauge is undefined.",
                  ),
                )
              }
            },
          },
          latestETHPrice: {
            set: entity => {
              inMemoryStore.latestETHPrice->IO.InMemoryStore.LatestETHPrice.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(latestETHPrice) with ID ${id}.`,
              ),
          },
          liquidityPool: {
            set: entity => {
              inMemoryStore.liquidityPool->IO.InMemoryStore.LiquidityPool.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(liquidityPool) with ID ${id}.`,
              ),
            getToken0: liquidityPool => {
              let optToken0 = inMemoryStore.token->IO.InMemoryStore.Token.get(liquidityPool.token0)
              switch optToken0 {
              | Some(token0) => token0
              | None =>
                Logging.warn(`LiquidityPool token0 data not found. Loading associated token from database.
Please consider loading the token in the UpdateLiquidityPool entity loader to greatly improve sync speed of your application.
`)

                raise(
                  LinkedEntityNotAvailableInSyncHandler(
                    "The required linked entity of LiquidityPool is undefined.",
                  ),
                )
              }
            },
            getToken1: liquidityPool => {
              let optToken1 = inMemoryStore.token->IO.InMemoryStore.Token.get(liquidityPool.token1)
              switch optToken1 {
              | Some(token1) => token1
              | None =>
                Logging.warn(`LiquidityPool token1 data not found. Loading associated token from database.
Please consider loading the token in the UpdateLiquidityPool entity loader to greatly improve sync speed of your application.
`)

                raise(
                  LinkedEntityNotAvailableInSyncHandler(
                    "The required linked entity of LiquidityPool is undefined.",
                  ),
                )
              }
            },
          },
          liquidityPoolDailySnapshot: {
            set: entity => {
              inMemoryStore.liquidityPoolDailySnapshot->IO.InMemoryStore.LiquidityPoolDailySnapshot.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(liquidityPoolDailySnapshot) with ID ${id}.`,
              ),
          },
          liquidityPoolHourlySnapshot: {
            set: entity => {
              inMemoryStore.liquidityPoolHourlySnapshot->IO.InMemoryStore.LiquidityPoolHourlySnapshot.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(liquidityPoolHourlySnapshot) with ID ${id}.`,
              ),
          },
          liquidityPoolUserMapping: {
            set: entity => {
              inMemoryStore.liquidityPoolUserMapping->IO.InMemoryStore.LiquidityPoolUserMapping.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(liquidityPoolUserMapping) with ID ${id}.`,
              ),
            getLiquidityPool: liquidityPoolUserMapping => {
              let optLiquidityPool =
                inMemoryStore.liquidityPool->IO.InMemoryStore.LiquidityPool.get(
                  liquidityPoolUserMapping.liquidityPool,
                )
              switch optLiquidityPool {
              | Some(liquidityPool) => liquidityPool
              | None =>
                Logging.warn(`LiquidityPoolUserMapping liquidityPool data not found. Loading associated liquidityPool from database.
Please consider loading the liquidityPool in the UpdateLiquidityPoolUserMapping entity loader to greatly improve sync speed of your application.
`)

                raise(
                  LinkedEntityNotAvailableInSyncHandler(
                    "The required linked entity of LiquidityPoolUserMapping is undefined.",
                  ),
                )
              }
            },
            getUser: liquidityPoolUserMapping => {
              let optUser =
                inMemoryStore.user->IO.InMemoryStore.User.get(liquidityPoolUserMapping.user)
              switch optUser {
              | Some(user) => user
              | None =>
                Logging.warn(`LiquidityPoolUserMapping user data not found. Loading associated user from database.
Please consider loading the user in the UpdateLiquidityPoolUserMapping entity loader to greatly improve sync speed of your application.
`)

                raise(
                  LinkedEntityNotAvailableInSyncHandler(
                    "The required linked entity of LiquidityPoolUserMapping is undefined.",
                  ),
                )
              }
            },
          },
          liquidityPoolWeeklySnapshot: {
            set: entity => {
              inMemoryStore.liquidityPoolWeeklySnapshot->IO.InMemoryStore.LiquidityPoolWeeklySnapshot.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(liquidityPoolWeeklySnapshot) with ID ${id}.`,
              ),
          },
          stateStore: {
            set: entity => {
              inMemoryStore.stateStore->IO.InMemoryStore.StateStore.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(`[unimplemented delete] can't delete entity(stateStore) with ID ${id}.`),
            getLatestEthPrice: stateStore => {
              let optLatestEthPrice =
                inMemoryStore.latestETHPrice->IO.InMemoryStore.LatestETHPrice.get(
                  stateStore.latestEthPrice,
                )
              switch optLatestEthPrice {
              | Some(latestEthPrice) => latestEthPrice
              | None =>
                Logging.warn(`StateStore latestEthPrice data not found. Loading associated latestETHPrice from database.
Please consider loading the latestETHPrice in the UpdateStateStore entity loader to greatly improve sync speed of your application.
`)

                raise(
                  LinkedEntityNotAvailableInSyncHandler(
                    "The required linked entity of StateStore is undefined.",
                  ),
                )
              }
            },
          },
          token: {
            set: entity => {
              inMemoryStore.token->IO.InMemoryStore.Token.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(`[unimplemented delete] can't delete entity(token) with ID ${id}.`),
            rewardToken: rewardToken_Token,
            get: (id: Types.id) => {
              if optSetOfIds_token->Set.has(id) {
                inMemoryStore.token->IO.InMemoryStore.Token.get(id)
              } else {
                Logging.warn(
                  `The loader for a "Token" of entity with id "${id}" was not used please add it to your default loader function (ie. place 'context.token.load("${id}")' inside your loader) to avoid unexpected behaviour. This is a runtime validation check.`,
                )

                // NOTE: this will still retern the value if it exists in the in-memory store (despite the loader not being run).
                inMemoryStore.token->IO.InMemoryStore.Token.get(id)

                // TODO: add a further step to syncronously try fetch this from the DB if it isn't in the in-memory store - similar to this PR: https://github.com/Float-Capital/indexer/pull/759
              }
            },
          },
          tokenDailySnapshot: {
            set: entity => {
              inMemoryStore.tokenDailySnapshot->IO.InMemoryStore.TokenDailySnapshot.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(tokenDailySnapshot) with ID ${id}.`,
              ),
          },
          tokenHourlySnapshot: {
            set: entity => {
              inMemoryStore.tokenHourlySnapshot->IO.InMemoryStore.TokenHourlySnapshot.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(tokenHourlySnapshot) with ID ${id}.`,
              ),
          },
          tokenWeeklySnapshot: {
            set: entity => {
              inMemoryStore.tokenWeeklySnapshot->IO.InMemoryStore.TokenWeeklySnapshot.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(tokenWeeklySnapshot) with ID ${id}.`,
              ),
          },
          user: {
            set: entity => {
              inMemoryStore.user->IO.InMemoryStore.User.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(`[unimplemented delete] can't delete entity(user) with ID ${id}.`),
          },
        }
      }

      let getHandlerContextAsync = (): handlerContextAsync => {
        let rewardToken_Token = switch optIdOf_rewardToken.contents {
        | Some(id) => inMemoryStore.token->IO.InMemoryStore.Token.get(id)
        | None =>
          Logging.warn(`The loader for "rewardToken" of entity type "Token"" was not used please add it to your loader function or remove it from your config.yaml file to avoid unexpected behaviour. This is a runtime validation check.`)
          None
        }
        {
          log: contextLogger,
          gauge: {
            set: entity => {
              inMemoryStore.gauge->IO.InMemoryStore.Gauge.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(`[unimplemented delete] can't delete entity(gauge) with ID ${id}.`),
            get: async (id: Types.id) => {
              if optSetOfIds_gauge->Set.has(id) {
                inMemoryStore.gauge->IO.InMemoryStore.Gauge.get(id)
              } else {
                // NOTE: this will still retern the value if it exists in the in-memory store (despite the loader not being run).
                switch inMemoryStore.gauge->IO.InMemoryStore.Gauge.get(id) {
                | Some(entity) => Some(entity)
                | None =>
                  let entities = await asyncGetters.getGauge(id)

                  switch entities->Belt.Array.get(0) {
                  | Some(entity) =>
                    // TODO: make this work with the test framework too.
                    IO.InMemoryStore.Gauge.set(
                      inMemoryStore.gauge,
                      ~key=entity.id,
                      ~dbOp=Types.Read,
                      ~entity,
                    )
                    Some(entity)
                  | None => None
                  }
                }
              }
            },
            getPool: async gauge => {
              let pool_field = gauge.pool
              let optPool =
                inMemoryStore.liquidityPool->IO.InMemoryStore.LiquidityPool.get(pool_field)
              switch optPool {
              | Some(pool) => pool
              | None =>
                let entities = await asyncGetters.getLiquidityPool(pool_field)

                switch entities->Belt.Array.get(0) {
                | Some(entity) =>
                  // TODO: make this work with the test framework too.
                  IO.InMemoryStore.LiquidityPool.set(
                    inMemoryStore.liquidityPool,
                    ~key=entity.id,
                    ~dbOp=Types.Read,
                    ~entity,
                  )
                  entity
                | None =>
                  Logging.error(`Gauge pool data not found. Loading associated liquidityPool from database.
This is likely due to a database corruption. Please reach out to the team on discord.
`)

                  raise(
                    UnableToLoadNonNullableLinkedEntity(
                      "The required linked entity pool of Gauge is undefined.",
                    ),
                  )
                }
              }
            },
          },
          latestETHPrice: {
            set: entity => {
              inMemoryStore.latestETHPrice->IO.InMemoryStore.LatestETHPrice.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(latestETHPrice) with ID ${id}.`,
              ),
          },
          liquidityPool: {
            set: entity => {
              inMemoryStore.liquidityPool->IO.InMemoryStore.LiquidityPool.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(liquidityPool) with ID ${id}.`,
              ),
            getToken0: async liquidityPool => {
              let token0_field = liquidityPool.token0
              let optToken0 = inMemoryStore.token->IO.InMemoryStore.Token.get(token0_field)
              switch optToken0 {
              | Some(token0) => token0
              | None =>
                let entities = await asyncGetters.getToken(token0_field)

                switch entities->Belt.Array.get(0) {
                | Some(entity) =>
                  // TODO: make this work with the test framework too.
                  IO.InMemoryStore.Token.set(
                    inMemoryStore.token,
                    ~key=entity.id,
                    ~dbOp=Types.Read,
                    ~entity,
                  )
                  entity
                | None =>
                  Logging.error(`LiquidityPool token0 data not found. Loading associated token from database.
This is likely due to a database corruption. Please reach out to the team on discord.
`)

                  raise(
                    UnableToLoadNonNullableLinkedEntity(
                      "The required linked entity token0 of LiquidityPool is undefined.",
                    ),
                  )
                }
              }
            },
            getToken1: async liquidityPool => {
              let token1_field = liquidityPool.token1
              let optToken1 = inMemoryStore.token->IO.InMemoryStore.Token.get(token1_field)
              switch optToken1 {
              | Some(token1) => token1
              | None =>
                let entities = await asyncGetters.getToken(token1_field)

                switch entities->Belt.Array.get(0) {
                | Some(entity) =>
                  // TODO: make this work with the test framework too.
                  IO.InMemoryStore.Token.set(
                    inMemoryStore.token,
                    ~key=entity.id,
                    ~dbOp=Types.Read,
                    ~entity,
                  )
                  entity
                | None =>
                  Logging.error(`LiquidityPool token1 data not found. Loading associated token from database.
This is likely due to a database corruption. Please reach out to the team on discord.
`)

                  raise(
                    UnableToLoadNonNullableLinkedEntity(
                      "The required linked entity token1 of LiquidityPool is undefined.",
                    ),
                  )
                }
              }
            },
          },
          liquidityPoolDailySnapshot: {
            set: entity => {
              inMemoryStore.liquidityPoolDailySnapshot->IO.InMemoryStore.LiquidityPoolDailySnapshot.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(liquidityPoolDailySnapshot) with ID ${id}.`,
              ),
          },
          liquidityPoolHourlySnapshot: {
            set: entity => {
              inMemoryStore.liquidityPoolHourlySnapshot->IO.InMemoryStore.LiquidityPoolHourlySnapshot.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(liquidityPoolHourlySnapshot) with ID ${id}.`,
              ),
          },
          liquidityPoolUserMapping: {
            set: entity => {
              inMemoryStore.liquidityPoolUserMapping->IO.InMemoryStore.LiquidityPoolUserMapping.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(liquidityPoolUserMapping) with ID ${id}.`,
              ),
            getLiquidityPool: async liquidityPoolUserMapping => {
              let liquidityPool_field = liquidityPoolUserMapping.liquidityPool
              let optLiquidityPool =
                inMemoryStore.liquidityPool->IO.InMemoryStore.LiquidityPool.get(liquidityPool_field)
              switch optLiquidityPool {
              | Some(liquidityPool) => liquidityPool
              | None =>
                let entities = await asyncGetters.getLiquidityPool(liquidityPool_field)

                switch entities->Belt.Array.get(0) {
                | Some(entity) =>
                  // TODO: make this work with the test framework too.
                  IO.InMemoryStore.LiquidityPool.set(
                    inMemoryStore.liquidityPool,
                    ~key=entity.id,
                    ~dbOp=Types.Read,
                    ~entity,
                  )
                  entity
                | None =>
                  Logging.error(`LiquidityPoolUserMapping liquidityPool data not found. Loading associated liquidityPool from database.
This is likely due to a database corruption. Please reach out to the team on discord.
`)

                  raise(
                    UnableToLoadNonNullableLinkedEntity(
                      "The required linked entity liquidityPool of LiquidityPoolUserMapping is undefined.",
                    ),
                  )
                }
              }
            },
            getUser: async liquidityPoolUserMapping => {
              let user_field = liquidityPoolUserMapping.user
              let optUser = inMemoryStore.user->IO.InMemoryStore.User.get(user_field)
              switch optUser {
              | Some(user) => user
              | None =>
                let entities = await asyncGetters.getUser(user_field)

                switch entities->Belt.Array.get(0) {
                | Some(entity) =>
                  // TODO: make this work with the test framework too.
                  IO.InMemoryStore.User.set(
                    inMemoryStore.user,
                    ~key=entity.id,
                    ~dbOp=Types.Read,
                    ~entity,
                  )
                  entity
                | None =>
                  Logging.error(`LiquidityPoolUserMapping user data not found. Loading associated user from database.
This is likely due to a database corruption. Please reach out to the team on discord.
`)

                  raise(
                    UnableToLoadNonNullableLinkedEntity(
                      "The required linked entity user of LiquidityPoolUserMapping is undefined.",
                    ),
                  )
                }
              }
            },
          },
          liquidityPoolWeeklySnapshot: {
            set: entity => {
              inMemoryStore.liquidityPoolWeeklySnapshot->IO.InMemoryStore.LiquidityPoolWeeklySnapshot.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(liquidityPoolWeeklySnapshot) with ID ${id}.`,
              ),
          },
          stateStore: {
            set: entity => {
              inMemoryStore.stateStore->IO.InMemoryStore.StateStore.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(`[unimplemented delete] can't delete entity(stateStore) with ID ${id}.`),
            getLatestEthPrice: async stateStore => {
              let latestEthPrice_field = stateStore.latestEthPrice
              let optLatestEthPrice =
                inMemoryStore.latestETHPrice->IO.InMemoryStore.LatestETHPrice.get(
                  latestEthPrice_field,
                )
              switch optLatestEthPrice {
              | Some(latestEthPrice) => latestEthPrice
              | None =>
                let entities = await asyncGetters.getLatestETHPrice(latestEthPrice_field)

                switch entities->Belt.Array.get(0) {
                | Some(entity) =>
                  // TODO: make this work with the test framework too.
                  IO.InMemoryStore.LatestETHPrice.set(
                    inMemoryStore.latestETHPrice,
                    ~key=entity.id,
                    ~dbOp=Types.Read,
                    ~entity,
                  )
                  entity
                | None =>
                  Logging.error(`StateStore latestEthPrice data not found. Loading associated latestETHPrice from database.
This is likely due to a database corruption. Please reach out to the team on discord.
`)

                  raise(
                    UnableToLoadNonNullableLinkedEntity(
                      "The required linked entity latestEthPrice of StateStore is undefined.",
                    ),
                  )
                }
              }
            },
          },
          token: {
            set: entity => {
              inMemoryStore.token->IO.InMemoryStore.Token.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(`[unimplemented delete] can't delete entity(token) with ID ${id}.`),
            rewardToken: rewardToken_Token,
            get: async (id: Types.id) => {
              if optSetOfIds_token->Set.has(id) {
                inMemoryStore.token->IO.InMemoryStore.Token.get(id)
              } else {
                // NOTE: this will still retern the value if it exists in the in-memory store (despite the loader not being run).
                switch inMemoryStore.token->IO.InMemoryStore.Token.get(id) {
                | Some(entity) => Some(entity)
                | None =>
                  let entities = await asyncGetters.getToken(id)

                  switch entities->Belt.Array.get(0) {
                  | Some(entity) =>
                    // TODO: make this work with the test framework too.
                    IO.InMemoryStore.Token.set(
                      inMemoryStore.token,
                      ~key=entity.id,
                      ~dbOp=Types.Read,
                      ~entity,
                    )
                    Some(entity)
                  | None => None
                  }
                }
              }
            },
          },
          tokenDailySnapshot: {
            set: entity => {
              inMemoryStore.tokenDailySnapshot->IO.InMemoryStore.TokenDailySnapshot.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(tokenDailySnapshot) with ID ${id}.`,
              ),
          },
          tokenHourlySnapshot: {
            set: entity => {
              inMemoryStore.tokenHourlySnapshot->IO.InMemoryStore.TokenHourlySnapshot.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(tokenHourlySnapshot) with ID ${id}.`,
              ),
          },
          tokenWeeklySnapshot: {
            set: entity => {
              inMemoryStore.tokenWeeklySnapshot->IO.InMemoryStore.TokenWeeklySnapshot.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(tokenWeeklySnapshot) with ID ${id}.`,
              ),
          },
          user: {
            set: entity => {
              inMemoryStore.user->IO.InMemoryStore.User.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(`[unimplemented delete] can't delete entity(user) with ID ${id}.`),
          },
        }
      }

      {
        log: contextLogger,
        getEntitiesToLoad: () => entitiesToLoad,
        getAddedDynamicContractRegistrations: () => addedDynamicContractRegistrations,
        getLoaderContext: () => loaderContext,
        getHandlerContextSync,
        getHandlerContextAsync,
      }
    }
  }

  module GaugeCreatedEvent = {
    type loaderContext = Types.VoterContract.GaugeCreatedEvent.loaderContext
    type handlerContext = Types.VoterContract.GaugeCreatedEvent.handlerContext
    type handlerContextAsync = Types.VoterContract.GaugeCreatedEvent.handlerContextAsync
    type context = genericContextCreatorFunctions<
      loaderContext,
      handlerContext,
      handlerContextAsync,
    >

    let contextCreator: contextCreator<
      Types.VoterContract.GaugeCreatedEvent.eventArgs,
      loaderContext,
      handlerContext,
      handlerContextAsync,
    > = (~inMemoryStore, ~chainId, ~event, ~logger, ~asyncGetters) => {
      // NOTE: we could optimise this code to onle create a logger if there was a log called.
      let logger = logger->Logging.createChildFrom(
        ~logger=_,
        ~params={
          "context": "Voter.GaugeCreated",
          "chainId": chainId,
          "block": event.blockNumber,
          "logIndex": event.logIndex,
          "txHash": event.transactionHash,
        },
      )

      let contextLogger: Logs.userLogger = {
        info: (message: string) => logger->Logging.uinfo(message),
        debug: (message: string) => logger->Logging.udebug(message),
        warn: (message: string) => logger->Logging.uwarn(message),
        error: (message: string) => logger->Logging.uerror(message),
        errorWithExn: (exn: option<Js.Exn.t>, message: string) =>
          logger->Logging.uerrorWithExn(exn, message),
      }

      let optSetOfIds_liquidityPool: Set.t<Types.id> = Set.make()

      let entitiesToLoad: array<Types.entityRead> = []

      let addedDynamicContractRegistrations: array<Types.dynamicContractRegistryEntity> = []

      //Loader context can be defined as a value and the getter can return that value

      @warning("-16")
      let loaderContext: loaderContext = {
        log: contextLogger,
        contractRegistration: {
          //TODO only add contracts we've registered for the event in the config
          addPool: (contractAddress: Ethers.ethAddress) => {
            let eventId = EventUtils.packEventIndex(
              ~blockNumber=event.blockNumber,
              ~logIndex=event.logIndex,
            )
            let dynamicContractRegistration: Types.dynamicContractRegistryEntity = {
              chainId,
              eventId,
              contractAddress,
              contractType: "Pool",
            }

            addedDynamicContractRegistrations->Js.Array2.push(dynamicContractRegistration)->ignore

            inMemoryStore.dynamicContractRegistry->IO.InMemoryStore.DynamicContractRegistry.set(
              ~key={chainId, contractAddress},
              ~entity=dynamicContractRegistration,
              ~dbOp=Set,
            )
          },
          //TODO only add contracts we've registered for the event in the config
          addPoolFactory: (contractAddress: Ethers.ethAddress) => {
            let eventId = EventUtils.packEventIndex(
              ~blockNumber=event.blockNumber,
              ~logIndex=event.logIndex,
            )
            let dynamicContractRegistration: Types.dynamicContractRegistryEntity = {
              chainId,
              eventId,
              contractAddress,
              contractType: "PoolFactory",
            }

            addedDynamicContractRegistrations->Js.Array2.push(dynamicContractRegistration)->ignore

            inMemoryStore.dynamicContractRegistry->IO.InMemoryStore.DynamicContractRegistry.set(
              ~key={chainId, contractAddress},
              ~entity=dynamicContractRegistration,
              ~dbOp=Set,
            )
          },
          //TODO only add contracts we've registered for the event in the config
          addVoter: (contractAddress: Ethers.ethAddress) => {
            let eventId = EventUtils.packEventIndex(
              ~blockNumber=event.blockNumber,
              ~logIndex=event.logIndex,
            )
            let dynamicContractRegistration: Types.dynamicContractRegistryEntity = {
              chainId,
              eventId,
              contractAddress,
              contractType: "Voter",
            }

            addedDynamicContractRegistrations->Js.Array2.push(dynamicContractRegistration)->ignore

            inMemoryStore.dynamicContractRegistry->IO.InMemoryStore.DynamicContractRegistry.set(
              ~key={chainId, contractAddress},
              ~entity=dynamicContractRegistration,
              ~dbOp=Set,
            )
          },
        },
        liquidityPool: {
          load: (id: Types.id, ~loaders={}) => {
            let _ = optSetOfIds_liquidityPool->Set.add(id)
            let _ = Js.Array2.push(entitiesToLoad, Types.LiquidityPoolRead(id, loaders))
          },
        },
      }

      //handler context must be defined as a getter functoin so that it can construct the context
      //without stale values whenever it is used
      let getHandlerContextSync: unit => handlerContext = () => {
        {
          log: contextLogger,
          gauge: {
            set: entity => {
              inMemoryStore.gauge->IO.InMemoryStore.Gauge.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(`[unimplemented delete] can't delete entity(gauge) with ID ${id}.`),
            getPool: gauge => {
              let optPool =
                inMemoryStore.liquidityPool->IO.InMemoryStore.LiquidityPool.get(gauge.pool)
              switch optPool {
              | Some(pool) => pool
              | None =>
                Logging.warn(`Gauge pool data not found. Loading associated liquidityPool from database.
Please consider loading the liquidityPool in the UpdateGauge entity loader to greatly improve sync speed of your application.
`)

                raise(
                  LinkedEntityNotAvailableInSyncHandler(
                    "The required linked entity of Gauge is undefined.",
                  ),
                )
              }
            },
          },
          latestETHPrice: {
            set: entity => {
              inMemoryStore.latestETHPrice->IO.InMemoryStore.LatestETHPrice.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(latestETHPrice) with ID ${id}.`,
              ),
          },
          liquidityPool: {
            set: entity => {
              inMemoryStore.liquidityPool->IO.InMemoryStore.LiquidityPool.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(liquidityPool) with ID ${id}.`,
              ),
            get: (id: Types.id) => {
              if optSetOfIds_liquidityPool->Set.has(id) {
                inMemoryStore.liquidityPool->IO.InMemoryStore.LiquidityPool.get(id)
              } else {
                Logging.warn(
                  `The loader for a "LiquidityPool" of entity with id "${id}" was not used please add it to your default loader function (ie. place 'context.liquidityPool.load("${id}")' inside your loader) to avoid unexpected behaviour. This is a runtime validation check.`,
                )

                // NOTE: this will still retern the value if it exists in the in-memory store (despite the loader not being run).
                inMemoryStore.liquidityPool->IO.InMemoryStore.LiquidityPool.get(id)

                // TODO: add a further step to syncronously try fetch this from the DB if it isn't in the in-memory store - similar to this PR: https://github.com/Float-Capital/indexer/pull/759
              }
            },
            getToken0: liquidityPool => {
              let optToken0 = inMemoryStore.token->IO.InMemoryStore.Token.get(liquidityPool.token0)
              switch optToken0 {
              | Some(token0) => token0
              | None =>
                Logging.warn(`LiquidityPool token0 data not found. Loading associated token from database.
Please consider loading the token in the UpdateLiquidityPool entity loader to greatly improve sync speed of your application.
`)

                raise(
                  LinkedEntityNotAvailableInSyncHandler(
                    "The required linked entity of LiquidityPool is undefined.",
                  ),
                )
              }
            },
            getToken1: liquidityPool => {
              let optToken1 = inMemoryStore.token->IO.InMemoryStore.Token.get(liquidityPool.token1)
              switch optToken1 {
              | Some(token1) => token1
              | None =>
                Logging.warn(`LiquidityPool token1 data not found. Loading associated token from database.
Please consider loading the token in the UpdateLiquidityPool entity loader to greatly improve sync speed of your application.
`)

                raise(
                  LinkedEntityNotAvailableInSyncHandler(
                    "The required linked entity of LiquidityPool is undefined.",
                  ),
                )
              }
            },
          },
          liquidityPoolDailySnapshot: {
            set: entity => {
              inMemoryStore.liquidityPoolDailySnapshot->IO.InMemoryStore.LiquidityPoolDailySnapshot.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(liquidityPoolDailySnapshot) with ID ${id}.`,
              ),
          },
          liquidityPoolHourlySnapshot: {
            set: entity => {
              inMemoryStore.liquidityPoolHourlySnapshot->IO.InMemoryStore.LiquidityPoolHourlySnapshot.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(liquidityPoolHourlySnapshot) with ID ${id}.`,
              ),
          },
          liquidityPoolUserMapping: {
            set: entity => {
              inMemoryStore.liquidityPoolUserMapping->IO.InMemoryStore.LiquidityPoolUserMapping.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(liquidityPoolUserMapping) with ID ${id}.`,
              ),
            getLiquidityPool: liquidityPoolUserMapping => {
              let optLiquidityPool =
                inMemoryStore.liquidityPool->IO.InMemoryStore.LiquidityPool.get(
                  liquidityPoolUserMapping.liquidityPool,
                )
              switch optLiquidityPool {
              | Some(liquidityPool) => liquidityPool
              | None =>
                Logging.warn(`LiquidityPoolUserMapping liquidityPool data not found. Loading associated liquidityPool from database.
Please consider loading the liquidityPool in the UpdateLiquidityPoolUserMapping entity loader to greatly improve sync speed of your application.
`)

                raise(
                  LinkedEntityNotAvailableInSyncHandler(
                    "The required linked entity of LiquidityPoolUserMapping is undefined.",
                  ),
                )
              }
            },
            getUser: liquidityPoolUserMapping => {
              let optUser =
                inMemoryStore.user->IO.InMemoryStore.User.get(liquidityPoolUserMapping.user)
              switch optUser {
              | Some(user) => user
              | None =>
                Logging.warn(`LiquidityPoolUserMapping user data not found. Loading associated user from database.
Please consider loading the user in the UpdateLiquidityPoolUserMapping entity loader to greatly improve sync speed of your application.
`)

                raise(
                  LinkedEntityNotAvailableInSyncHandler(
                    "The required linked entity of LiquidityPoolUserMapping is undefined.",
                  ),
                )
              }
            },
          },
          liquidityPoolWeeklySnapshot: {
            set: entity => {
              inMemoryStore.liquidityPoolWeeklySnapshot->IO.InMemoryStore.LiquidityPoolWeeklySnapshot.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(liquidityPoolWeeklySnapshot) with ID ${id}.`,
              ),
          },
          stateStore: {
            set: entity => {
              inMemoryStore.stateStore->IO.InMemoryStore.StateStore.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(`[unimplemented delete] can't delete entity(stateStore) with ID ${id}.`),
            getLatestEthPrice: stateStore => {
              let optLatestEthPrice =
                inMemoryStore.latestETHPrice->IO.InMemoryStore.LatestETHPrice.get(
                  stateStore.latestEthPrice,
                )
              switch optLatestEthPrice {
              | Some(latestEthPrice) => latestEthPrice
              | None =>
                Logging.warn(`StateStore latestEthPrice data not found. Loading associated latestETHPrice from database.
Please consider loading the latestETHPrice in the UpdateStateStore entity loader to greatly improve sync speed of your application.
`)

                raise(
                  LinkedEntityNotAvailableInSyncHandler(
                    "The required linked entity of StateStore is undefined.",
                  ),
                )
              }
            },
          },
          token: {
            set: entity => {
              inMemoryStore.token->IO.InMemoryStore.Token.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(`[unimplemented delete] can't delete entity(token) with ID ${id}.`),
          },
          tokenDailySnapshot: {
            set: entity => {
              inMemoryStore.tokenDailySnapshot->IO.InMemoryStore.TokenDailySnapshot.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(tokenDailySnapshot) with ID ${id}.`,
              ),
          },
          tokenHourlySnapshot: {
            set: entity => {
              inMemoryStore.tokenHourlySnapshot->IO.InMemoryStore.TokenHourlySnapshot.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(tokenHourlySnapshot) with ID ${id}.`,
              ),
          },
          tokenWeeklySnapshot: {
            set: entity => {
              inMemoryStore.tokenWeeklySnapshot->IO.InMemoryStore.TokenWeeklySnapshot.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(tokenWeeklySnapshot) with ID ${id}.`,
              ),
          },
          user: {
            set: entity => {
              inMemoryStore.user->IO.InMemoryStore.User.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(`[unimplemented delete] can't delete entity(user) with ID ${id}.`),
          },
        }
      }

      let getHandlerContextAsync = (): handlerContextAsync => {
        {
          log: contextLogger,
          gauge: {
            set: entity => {
              inMemoryStore.gauge->IO.InMemoryStore.Gauge.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(`[unimplemented delete] can't delete entity(gauge) with ID ${id}.`),
            getPool: async gauge => {
              let pool_field = gauge.pool
              let optPool =
                inMemoryStore.liquidityPool->IO.InMemoryStore.LiquidityPool.get(pool_field)
              switch optPool {
              | Some(pool) => pool
              | None =>
                let entities = await asyncGetters.getLiquidityPool(pool_field)

                switch entities->Belt.Array.get(0) {
                | Some(entity) =>
                  // TODO: make this work with the test framework too.
                  IO.InMemoryStore.LiquidityPool.set(
                    inMemoryStore.liquidityPool,
                    ~key=entity.id,
                    ~dbOp=Types.Read,
                    ~entity,
                  )
                  entity
                | None =>
                  Logging.error(`Gauge pool data not found. Loading associated liquidityPool from database.
This is likely due to a database corruption. Please reach out to the team on discord.
`)

                  raise(
                    UnableToLoadNonNullableLinkedEntity(
                      "The required linked entity pool of Gauge is undefined.",
                    ),
                  )
                }
              }
            },
          },
          latestETHPrice: {
            set: entity => {
              inMemoryStore.latestETHPrice->IO.InMemoryStore.LatestETHPrice.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(latestETHPrice) with ID ${id}.`,
              ),
          },
          liquidityPool: {
            set: entity => {
              inMemoryStore.liquidityPool->IO.InMemoryStore.LiquidityPool.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(liquidityPool) with ID ${id}.`,
              ),
            get: async (id: Types.id) => {
              if optSetOfIds_liquidityPool->Set.has(id) {
                inMemoryStore.liquidityPool->IO.InMemoryStore.LiquidityPool.get(id)
              } else {
                // NOTE: this will still retern the value if it exists in the in-memory store (despite the loader not being run).
                switch inMemoryStore.liquidityPool->IO.InMemoryStore.LiquidityPool.get(id) {
                | Some(entity) => Some(entity)
                | None =>
                  let entities = await asyncGetters.getLiquidityPool(id)

                  switch entities->Belt.Array.get(0) {
                  | Some(entity) =>
                    // TODO: make this work with the test framework too.
                    IO.InMemoryStore.LiquidityPool.set(
                      inMemoryStore.liquidityPool,
                      ~key=entity.id,
                      ~dbOp=Types.Read,
                      ~entity,
                    )
                    Some(entity)
                  | None => None
                  }
                }
              }
            },
            getToken0: async liquidityPool => {
              let token0_field = liquidityPool.token0
              let optToken0 = inMemoryStore.token->IO.InMemoryStore.Token.get(token0_field)
              switch optToken0 {
              | Some(token0) => token0
              | None =>
                let entities = await asyncGetters.getToken(token0_field)

                switch entities->Belt.Array.get(0) {
                | Some(entity) =>
                  // TODO: make this work with the test framework too.
                  IO.InMemoryStore.Token.set(
                    inMemoryStore.token,
                    ~key=entity.id,
                    ~dbOp=Types.Read,
                    ~entity,
                  )
                  entity
                | None =>
                  Logging.error(`LiquidityPool token0 data not found. Loading associated token from database.
This is likely due to a database corruption. Please reach out to the team on discord.
`)

                  raise(
                    UnableToLoadNonNullableLinkedEntity(
                      "The required linked entity token0 of LiquidityPool is undefined.",
                    ),
                  )
                }
              }
            },
            getToken1: async liquidityPool => {
              let token1_field = liquidityPool.token1
              let optToken1 = inMemoryStore.token->IO.InMemoryStore.Token.get(token1_field)
              switch optToken1 {
              | Some(token1) => token1
              | None =>
                let entities = await asyncGetters.getToken(token1_field)

                switch entities->Belt.Array.get(0) {
                | Some(entity) =>
                  // TODO: make this work with the test framework too.
                  IO.InMemoryStore.Token.set(
                    inMemoryStore.token,
                    ~key=entity.id,
                    ~dbOp=Types.Read,
                    ~entity,
                  )
                  entity
                | None =>
                  Logging.error(`LiquidityPool token1 data not found. Loading associated token from database.
This is likely due to a database corruption. Please reach out to the team on discord.
`)

                  raise(
                    UnableToLoadNonNullableLinkedEntity(
                      "The required linked entity token1 of LiquidityPool is undefined.",
                    ),
                  )
                }
              }
            },
          },
          liquidityPoolDailySnapshot: {
            set: entity => {
              inMemoryStore.liquidityPoolDailySnapshot->IO.InMemoryStore.LiquidityPoolDailySnapshot.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(liquidityPoolDailySnapshot) with ID ${id}.`,
              ),
          },
          liquidityPoolHourlySnapshot: {
            set: entity => {
              inMemoryStore.liquidityPoolHourlySnapshot->IO.InMemoryStore.LiquidityPoolHourlySnapshot.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(liquidityPoolHourlySnapshot) with ID ${id}.`,
              ),
          },
          liquidityPoolUserMapping: {
            set: entity => {
              inMemoryStore.liquidityPoolUserMapping->IO.InMemoryStore.LiquidityPoolUserMapping.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(liquidityPoolUserMapping) with ID ${id}.`,
              ),
            getLiquidityPool: async liquidityPoolUserMapping => {
              let liquidityPool_field = liquidityPoolUserMapping.liquidityPool
              let optLiquidityPool =
                inMemoryStore.liquidityPool->IO.InMemoryStore.LiquidityPool.get(liquidityPool_field)
              switch optLiquidityPool {
              | Some(liquidityPool) => liquidityPool
              | None =>
                let entities = await asyncGetters.getLiquidityPool(liquidityPool_field)

                switch entities->Belt.Array.get(0) {
                | Some(entity) =>
                  // TODO: make this work with the test framework too.
                  IO.InMemoryStore.LiquidityPool.set(
                    inMemoryStore.liquidityPool,
                    ~key=entity.id,
                    ~dbOp=Types.Read,
                    ~entity,
                  )
                  entity
                | None =>
                  Logging.error(`LiquidityPoolUserMapping liquidityPool data not found. Loading associated liquidityPool from database.
This is likely due to a database corruption. Please reach out to the team on discord.
`)

                  raise(
                    UnableToLoadNonNullableLinkedEntity(
                      "The required linked entity liquidityPool of LiquidityPoolUserMapping is undefined.",
                    ),
                  )
                }
              }
            },
            getUser: async liquidityPoolUserMapping => {
              let user_field = liquidityPoolUserMapping.user
              let optUser = inMemoryStore.user->IO.InMemoryStore.User.get(user_field)
              switch optUser {
              | Some(user) => user
              | None =>
                let entities = await asyncGetters.getUser(user_field)

                switch entities->Belt.Array.get(0) {
                | Some(entity) =>
                  // TODO: make this work with the test framework too.
                  IO.InMemoryStore.User.set(
                    inMemoryStore.user,
                    ~key=entity.id,
                    ~dbOp=Types.Read,
                    ~entity,
                  )
                  entity
                | None =>
                  Logging.error(`LiquidityPoolUserMapping user data not found. Loading associated user from database.
This is likely due to a database corruption. Please reach out to the team on discord.
`)

                  raise(
                    UnableToLoadNonNullableLinkedEntity(
                      "The required linked entity user of LiquidityPoolUserMapping is undefined.",
                    ),
                  )
                }
              }
            },
          },
          liquidityPoolWeeklySnapshot: {
            set: entity => {
              inMemoryStore.liquidityPoolWeeklySnapshot->IO.InMemoryStore.LiquidityPoolWeeklySnapshot.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(liquidityPoolWeeklySnapshot) with ID ${id}.`,
              ),
          },
          stateStore: {
            set: entity => {
              inMemoryStore.stateStore->IO.InMemoryStore.StateStore.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(`[unimplemented delete] can't delete entity(stateStore) with ID ${id}.`),
            getLatestEthPrice: async stateStore => {
              let latestEthPrice_field = stateStore.latestEthPrice
              let optLatestEthPrice =
                inMemoryStore.latestETHPrice->IO.InMemoryStore.LatestETHPrice.get(
                  latestEthPrice_field,
                )
              switch optLatestEthPrice {
              | Some(latestEthPrice) => latestEthPrice
              | None =>
                let entities = await asyncGetters.getLatestETHPrice(latestEthPrice_field)

                switch entities->Belt.Array.get(0) {
                | Some(entity) =>
                  // TODO: make this work with the test framework too.
                  IO.InMemoryStore.LatestETHPrice.set(
                    inMemoryStore.latestETHPrice,
                    ~key=entity.id,
                    ~dbOp=Types.Read,
                    ~entity,
                  )
                  entity
                | None =>
                  Logging.error(`StateStore latestEthPrice data not found. Loading associated latestETHPrice from database.
This is likely due to a database corruption. Please reach out to the team on discord.
`)

                  raise(
                    UnableToLoadNonNullableLinkedEntity(
                      "The required linked entity latestEthPrice of StateStore is undefined.",
                    ),
                  )
                }
              }
            },
          },
          token: {
            set: entity => {
              inMemoryStore.token->IO.InMemoryStore.Token.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(`[unimplemented delete] can't delete entity(token) with ID ${id}.`),
          },
          tokenDailySnapshot: {
            set: entity => {
              inMemoryStore.tokenDailySnapshot->IO.InMemoryStore.TokenDailySnapshot.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(tokenDailySnapshot) with ID ${id}.`,
              ),
          },
          tokenHourlySnapshot: {
            set: entity => {
              inMemoryStore.tokenHourlySnapshot->IO.InMemoryStore.TokenHourlySnapshot.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(tokenHourlySnapshot) with ID ${id}.`,
              ),
          },
          tokenWeeklySnapshot: {
            set: entity => {
              inMemoryStore.tokenWeeklySnapshot->IO.InMemoryStore.TokenWeeklySnapshot.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(tokenWeeklySnapshot) with ID ${id}.`,
              ),
          },
          user: {
            set: entity => {
              inMemoryStore.user->IO.InMemoryStore.User.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
              )
            },
            delete: id =>
              Logging.warn(`[unimplemented delete] can't delete entity(user) with ID ${id}.`),
          },
        }
      }

      {
        log: contextLogger,
        getEntitiesToLoad: () => entitiesToLoad,
        getAddedDynamicContractRegistrations: () => addedDynamicContractRegistrations,
        getLoaderContext: () => loaderContext,
        getHandlerContextSync,
        getHandlerContextAsync,
      }
    }
  }
}

@deriving(accessors)
type eventAndContext =
  | PoolContract_FeesWithContext(
      Types.eventLog<Types.PoolContract.FeesEvent.eventArgs>,
      PoolContract.FeesEvent.context,
    )
  | PoolContract_SwapWithContext(
      Types.eventLog<Types.PoolContract.SwapEvent.eventArgs>,
      PoolContract.SwapEvent.context,
    )
  | PoolContract_SyncWithContext(
      Types.eventLog<Types.PoolContract.SyncEvent.eventArgs>,
      PoolContract.SyncEvent.context,
    )
  | PoolFactoryContract_PoolCreatedWithContext(
      Types.eventLog<Types.PoolFactoryContract.PoolCreatedEvent.eventArgs>,
      PoolFactoryContract.PoolCreatedEvent.context,
    )
  | VoterContract_DistributeRewardWithContext(
      Types.eventLog<Types.VoterContract.DistributeRewardEvent.eventArgs>,
      VoterContract.DistributeRewardEvent.context,
    )
  | VoterContract_GaugeCreatedWithContext(
      Types.eventLog<Types.VoterContract.GaugeCreatedEvent.eventArgs>,
      VoterContract.GaugeCreatedEvent.context,
    )

type eventRouterEventAndContext = {
  chainId: int,
  event: eventAndContext,
}
