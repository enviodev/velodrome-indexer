type entityGetters = {
  getLiquidityPoolDailySnapshot: Types.id => promise<array<Types.liquidityPoolDailySnapshotEntity>>,
  getLiquidityPoolHourlySnapshot: Types.id => promise<
    array<Types.liquidityPoolHourlySnapshotEntity>,
  >,
  getLiquidityPoolNew: Types.id => promise<array<Types.liquidityPoolNewEntity>>,
  getLiquidityPoolWeeklySnapshot: Types.id => promise<
    array<Types.liquidityPoolWeeklySnapshotEntity>,
  >,
  getToken: Types.id => promise<array<Types.tokenEntity>>,
  getTokenDailySnapshot: Types.id => promise<array<Types.tokenDailySnapshotEntity>>,
  getTokenHourlySnapshot: Types.id => promise<array<Types.tokenHourlySnapshotEntity>>,
  getTokenWeeklySnapshot: Types.id => promise<array<Types.tokenWeeklySnapshotEntity>>,
  getUser: Types.id => promise<array<Types.userEntity>>,
}

@genType
type genericContextCreatorFunctions<'loaderContext, 'handlerContextSync, 'handlerContextAsync> = {
  logger: Pino.t,
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

      let optSetOfIds_liquidityPoolNew: Set.t<Types.id> = Set.make()

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
              ~entity=Set(dynamicContractRegistration, ""->Obj.magic),
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
              ~entity=Set(dynamicContractRegistration, ""->Obj.magic),
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
              ~entity=Set(dynamicContractRegistration, ""->Obj.magic),
            )
          },
          //TODO only add contracts we've registered for the event in the config
          addVotingReward: (contractAddress: Ethers.ethAddress) => {
            let eventId = EventUtils.packEventIndex(
              ~blockNumber=event.blockNumber,
              ~logIndex=event.logIndex,
            )
            let dynamicContractRegistration: Types.dynamicContractRegistryEntity = {
              chainId,
              eventId,
              contractAddress,
              contractType: "VotingReward",
            }

            addedDynamicContractRegistrations->Js.Array2.push(dynamicContractRegistration)->ignore

            inMemoryStore.dynamicContractRegistry->IO.InMemoryStore.DynamicContractRegistry.set(
              ~key={chainId, contractAddress},
              ~entity=Set(dynamicContractRegistration, ""->Obj.magic),
            )
          },
        },
        liquidityPoolNew: {
          load: (id: Types.id, ~loaders={}) => {
            let _ = optSetOfIds_liquidityPoolNew->Set.add(id)
            let _ = Js.Array2.push(entitiesToLoad, Types.LiquidityPoolNewRead(id, loaders))
          },
        },
      }

      //handler context must be defined as a getter functoin so that it can construct the context
      //without stale values whenever it is used
      let getHandlerContextSync: unit => handlerContext = () => {
        {
          log: contextLogger,
          liquidityPoolDailySnapshot: {
            set: entity => {
              inMemoryStore.liquidityPoolDailySnapshot->IO.InMemoryStore.LiquidityPoolDailySnapshot.set(
                ~key=entity.id,
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
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
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(liquidityPoolHourlySnapshot) with ID ${id}.`,
              ),
          },
          liquidityPoolNew: {
            set: entity => {
              inMemoryStore.liquidityPoolNew->IO.InMemoryStore.LiquidityPoolNew.set(
                ~key=entity.id,
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(liquidityPoolNew) with ID ${id}.`,
              ),
            get: (id: Types.id) => {
              if optSetOfIds_liquidityPoolNew->Set.has(id) {
                inMemoryStore.liquidityPoolNew->IO.InMemoryStore.LiquidityPoolNew.get(id)
              } else {
                Logging.warn(
                  `The loader for a "LiquidityPoolNew" of entity with id "${id}" was not used please add it to your default loader function (ie. place 'context.liquidityPoolNew.load("${id}")' inside your loader) to avoid unexpected behaviour. This is a runtime validation check.`,
                )

                // NOTE: this will still return the value if it exists in the in-memory store (despite the loader not being run).
                inMemoryStore.liquidityPoolNew->IO.InMemoryStore.LiquidityPoolNew.get(id)

                // TODO: add a further step to synchronously try fetch this from the DB if it isn't in the in-memory store - similar to this PR: https://github.com/Float-Capital/indexer/pull/759
              }
            },
            getToken0: liquidityPoolNew => {
              let optToken0 =
                inMemoryStore.token->IO.InMemoryStore.Token.get(liquidityPoolNew.token0_id)
              switch optToken0 {
              | Some(token0) => token0
              | None =>
                Logging.warn(`LiquidityPoolNew token0 data not found. Loading associated token from database.
Please consider loading the token in the UpdateLiquidityPoolNew entity loader to greatly improve sync speed of your application.
`)

                raise(
                  LinkedEntityNotAvailableInSyncHandler(
                    "The required linked entity of LiquidityPoolNew is undefined.",
                  ),
                )
              }
            },
            getToken1: liquidityPoolNew => {
              let optToken1 =
                inMemoryStore.token->IO.InMemoryStore.Token.get(liquidityPoolNew.token1_id)
              switch optToken1 {
              | Some(token1) => token1
              | None =>
                Logging.warn(`LiquidityPoolNew token1 data not found. Loading associated token from database.
Please consider loading the token in the UpdateLiquidityPoolNew entity loader to greatly improve sync speed of your application.
`)

                raise(
                  LinkedEntityNotAvailableInSyncHandler(
                    "The required linked entity of LiquidityPoolNew is undefined.",
                  ),
                )
              }
            },
          },
          liquidityPoolWeeklySnapshot: {
            set: entity => {
              inMemoryStore.liquidityPoolWeeklySnapshot->IO.InMemoryStore.LiquidityPoolWeeklySnapshot.set(
                ~key=entity.id,
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(liquidityPoolWeeklySnapshot) with ID ${id}.`,
              ),
          },
          token: {
            set: entity => {
              inMemoryStore.token->IO.InMemoryStore.Token.set(
                ~key=entity.id,
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
              )
            },
            delete: id =>
              Logging.warn(`[unimplemented delete] can't delete entity(token) with ID ${id}.`),
          },
          tokenDailySnapshot: {
            set: entity => {
              inMemoryStore.tokenDailySnapshot->IO.InMemoryStore.TokenDailySnapshot.set(
                ~key=entity.id,
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
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
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
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
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
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
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
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
          liquidityPoolDailySnapshot: {
            set: entity => {
              inMemoryStore.liquidityPoolDailySnapshot->IO.InMemoryStore.LiquidityPoolDailySnapshot.set(
                ~key=entity.id,
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
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
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(liquidityPoolHourlySnapshot) with ID ${id}.`,
              ),
          },
          liquidityPoolNew: {
            set: entity => {
              inMemoryStore.liquidityPoolNew->IO.InMemoryStore.LiquidityPoolNew.set(
                ~key=entity.id,
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(liquidityPoolNew) with ID ${id}.`,
              ),
            get: async (id: Types.id) => {
              if optSetOfIds_liquidityPoolNew->Set.has(id) {
                inMemoryStore.liquidityPoolNew->IO.InMemoryStore.LiquidityPoolNew.get(id)
              } else {
                // NOTE: this will still return the value if it exists in the in-memory store (despite the loader not being run).
                switch inMemoryStore.liquidityPoolNew->IO.InMemoryStore.LiquidityPoolNew.get(id) {
                | Some(entity) => Some(entity)
                | None =>
                  let entities = await asyncGetters.getLiquidityPoolNew(id)

                  switch entities->Belt.Array.get(0) {
                  | Some(entity) =>
                    // TODO: make this work with the test framework too.
                    IO.InMemoryStore.LiquidityPoolNew.set(
                      inMemoryStore.liquidityPoolNew,
                      ~key=entity.id,
                      ~entity=Set(
                        entity,
                        {
                          chainId,
                          blockNumber: event.blockNumber,
                          logIndex: event.logIndex,
                        },
                      ),
                    )
                    Some(entity)
                  | None => None
                  }
                }
              }
            },
            getToken0: async liquidityPoolNew => {
              let token0_field = liquidityPoolNew.token0_id
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
                    ~entity=Read(entity),
                  )
                  entity
                | None =>
                  Logging.error(`LiquidityPoolNew token0 data not found. Loading associated token from database.
This is likely due to a database corruption. Please reach out to the team on discord.
`)

                  raise(
                    UnableToLoadNonNullableLinkedEntity(
                      "The required linked entity token0 of LiquidityPoolNew is undefined.",
                    ),
                  )
                }
              }
            },
            getToken1: async liquidityPoolNew => {
              let token1_field = liquidityPoolNew.token1_id
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
                    ~entity=Read(entity),
                  )
                  entity
                | None =>
                  Logging.error(`LiquidityPoolNew token1 data not found. Loading associated token from database.
This is likely due to a database corruption. Please reach out to the team on discord.
`)

                  raise(
                    UnableToLoadNonNullableLinkedEntity(
                      "The required linked entity token1 of LiquidityPoolNew is undefined.",
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
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(liquidityPoolWeeklySnapshot) with ID ${id}.`,
              ),
          },
          token: {
            set: entity => {
              inMemoryStore.token->IO.InMemoryStore.Token.set(
                ~key=entity.id,
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
              )
            },
            delete: id =>
              Logging.warn(`[unimplemented delete] can't delete entity(token) with ID ${id}.`),
          },
          tokenDailySnapshot: {
            set: entity => {
              inMemoryStore.tokenDailySnapshot->IO.InMemoryStore.TokenDailySnapshot.set(
                ~key=entity.id,
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
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
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
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
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
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
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
              )
            },
            delete: id =>
              Logging.warn(`[unimplemented delete] can't delete entity(user) with ID ${id}.`),
          },
        }
      }

      {
        logger,
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

      let optSetOfIds_liquidityPoolNew: Set.t<Types.id> = Set.make()
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
              ~entity=Set(dynamicContractRegistration, ""->Obj.magic),
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
              ~entity=Set(dynamicContractRegistration, ""->Obj.magic),
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
              ~entity=Set(dynamicContractRegistration, ""->Obj.magic),
            )
          },
          //TODO only add contracts we've registered for the event in the config
          addVotingReward: (contractAddress: Ethers.ethAddress) => {
            let eventId = EventUtils.packEventIndex(
              ~blockNumber=event.blockNumber,
              ~logIndex=event.logIndex,
            )
            let dynamicContractRegistration: Types.dynamicContractRegistryEntity = {
              chainId,
              eventId,
              contractAddress,
              contractType: "VotingReward",
            }

            addedDynamicContractRegistrations->Js.Array2.push(dynamicContractRegistration)->ignore

            inMemoryStore.dynamicContractRegistry->IO.InMemoryStore.DynamicContractRegistry.set(
              ~key={chainId, contractAddress},
              ~entity=Set(dynamicContractRegistration, ""->Obj.magic),
            )
          },
        },
        liquidityPoolNew: {
          load: (id: Types.id, ~loaders={}) => {
            let _ = optSetOfIds_liquidityPoolNew->Set.add(id)
            let _ = Js.Array2.push(entitiesToLoad, Types.LiquidityPoolNewRead(id, loaders))
          },
        },
        user: {
          load: (id: Types.id) => {
            let _ = optSetOfIds_user->Set.add(id)
            let _ = Js.Array2.push(entitiesToLoad, Types.UserRead(id))
          },
        },
      }

      //handler context must be defined as a getter functoin so that it can construct the context
      //without stale values whenever it is used
      let getHandlerContextSync: unit => handlerContext = () => {
        {
          log: contextLogger,
          liquidityPoolDailySnapshot: {
            set: entity => {
              inMemoryStore.liquidityPoolDailySnapshot->IO.InMemoryStore.LiquidityPoolDailySnapshot.set(
                ~key=entity.id,
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
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
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(liquidityPoolHourlySnapshot) with ID ${id}.`,
              ),
          },
          liquidityPoolNew: {
            set: entity => {
              inMemoryStore.liquidityPoolNew->IO.InMemoryStore.LiquidityPoolNew.set(
                ~key=entity.id,
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(liquidityPoolNew) with ID ${id}.`,
              ),
            get: (id: Types.id) => {
              if optSetOfIds_liquidityPoolNew->Set.has(id) {
                inMemoryStore.liquidityPoolNew->IO.InMemoryStore.LiquidityPoolNew.get(id)
              } else {
                Logging.warn(
                  `The loader for a "LiquidityPoolNew" of entity with id "${id}" was not used please add it to your default loader function (ie. place 'context.liquidityPoolNew.load("${id}")' inside your loader) to avoid unexpected behaviour. This is a runtime validation check.`,
                )

                // NOTE: this will still return the value if it exists in the in-memory store (despite the loader not being run).
                inMemoryStore.liquidityPoolNew->IO.InMemoryStore.LiquidityPoolNew.get(id)

                // TODO: add a further step to synchronously try fetch this from the DB if it isn't in the in-memory store - similar to this PR: https://github.com/Float-Capital/indexer/pull/759
              }
            },
            getToken0: liquidityPoolNew => {
              let optToken0 =
                inMemoryStore.token->IO.InMemoryStore.Token.get(liquidityPoolNew.token0_id)
              switch optToken0 {
              | Some(token0) => token0
              | None =>
                Logging.warn(`LiquidityPoolNew token0 data not found. Loading associated token from database.
Please consider loading the token in the UpdateLiquidityPoolNew entity loader to greatly improve sync speed of your application.
`)

                raise(
                  LinkedEntityNotAvailableInSyncHandler(
                    "The required linked entity of LiquidityPoolNew is undefined.",
                  ),
                )
              }
            },
            getToken1: liquidityPoolNew => {
              let optToken1 =
                inMemoryStore.token->IO.InMemoryStore.Token.get(liquidityPoolNew.token1_id)
              switch optToken1 {
              | Some(token1) => token1
              | None =>
                Logging.warn(`LiquidityPoolNew token1 data not found. Loading associated token from database.
Please consider loading the token in the UpdateLiquidityPoolNew entity loader to greatly improve sync speed of your application.
`)

                raise(
                  LinkedEntityNotAvailableInSyncHandler(
                    "The required linked entity of LiquidityPoolNew is undefined.",
                  ),
                )
              }
            },
          },
          liquidityPoolWeeklySnapshot: {
            set: entity => {
              inMemoryStore.liquidityPoolWeeklySnapshot->IO.InMemoryStore.LiquidityPoolWeeklySnapshot.set(
                ~key=entity.id,
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(liquidityPoolWeeklySnapshot) with ID ${id}.`,
              ),
          },
          token: {
            set: entity => {
              inMemoryStore.token->IO.InMemoryStore.Token.set(
                ~key=entity.id,
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
              )
            },
            delete: id =>
              Logging.warn(`[unimplemented delete] can't delete entity(token) with ID ${id}.`),
          },
          tokenDailySnapshot: {
            set: entity => {
              inMemoryStore.tokenDailySnapshot->IO.InMemoryStore.TokenDailySnapshot.set(
                ~key=entity.id,
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
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
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
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
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
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
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
              )
            },
            delete: id =>
              Logging.warn(`[unimplemented delete] can't delete entity(user) with ID ${id}.`),
            get: (id: Types.id) => {
              if optSetOfIds_user->Set.has(id) {
                inMemoryStore.user->IO.InMemoryStore.User.get(id)
              } else {
                Logging.warn(
                  `The loader for a "User" of entity with id "${id}" was not used please add it to your default loader function (ie. place 'context.user.load("${id}")' inside your loader) to avoid unexpected behaviour. This is a runtime validation check.`,
                )

                // NOTE: this will still return the value if it exists in the in-memory store (despite the loader not being run).
                inMemoryStore.user->IO.InMemoryStore.User.get(id)

                // TODO: add a further step to synchronously try fetch this from the DB if it isn't in the in-memory store - similar to this PR: https://github.com/Float-Capital/indexer/pull/759
              }
            },
          },
        }
      }

      let getHandlerContextAsync = (): handlerContextAsync => {
        {
          log: contextLogger,
          liquidityPoolDailySnapshot: {
            set: entity => {
              inMemoryStore.liquidityPoolDailySnapshot->IO.InMemoryStore.LiquidityPoolDailySnapshot.set(
                ~key=entity.id,
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
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
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(liquidityPoolHourlySnapshot) with ID ${id}.`,
              ),
          },
          liquidityPoolNew: {
            set: entity => {
              inMemoryStore.liquidityPoolNew->IO.InMemoryStore.LiquidityPoolNew.set(
                ~key=entity.id,
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(liquidityPoolNew) with ID ${id}.`,
              ),
            get: async (id: Types.id) => {
              if optSetOfIds_liquidityPoolNew->Set.has(id) {
                inMemoryStore.liquidityPoolNew->IO.InMemoryStore.LiquidityPoolNew.get(id)
              } else {
                // NOTE: this will still return the value if it exists in the in-memory store (despite the loader not being run).
                switch inMemoryStore.liquidityPoolNew->IO.InMemoryStore.LiquidityPoolNew.get(id) {
                | Some(entity) => Some(entity)
                | None =>
                  let entities = await asyncGetters.getLiquidityPoolNew(id)

                  switch entities->Belt.Array.get(0) {
                  | Some(entity) =>
                    // TODO: make this work with the test framework too.
                    IO.InMemoryStore.LiquidityPoolNew.set(
                      inMemoryStore.liquidityPoolNew,
                      ~key=entity.id,
                      ~entity=Set(
                        entity,
                        {
                          chainId,
                          blockNumber: event.blockNumber,
                          logIndex: event.logIndex,
                        },
                      ),
                    )
                    Some(entity)
                  | None => None
                  }
                }
              }
            },
            getToken0: async liquidityPoolNew => {
              let token0_field = liquidityPoolNew.token0_id
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
                    ~entity=Read(entity),
                  )
                  entity
                | None =>
                  Logging.error(`LiquidityPoolNew token0 data not found. Loading associated token from database.
This is likely due to a database corruption. Please reach out to the team on discord.
`)

                  raise(
                    UnableToLoadNonNullableLinkedEntity(
                      "The required linked entity token0 of LiquidityPoolNew is undefined.",
                    ),
                  )
                }
              }
            },
            getToken1: async liquidityPoolNew => {
              let token1_field = liquidityPoolNew.token1_id
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
                    ~entity=Read(entity),
                  )
                  entity
                | None =>
                  Logging.error(`LiquidityPoolNew token1 data not found. Loading associated token from database.
This is likely due to a database corruption. Please reach out to the team on discord.
`)

                  raise(
                    UnableToLoadNonNullableLinkedEntity(
                      "The required linked entity token1 of LiquidityPoolNew is undefined.",
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
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(liquidityPoolWeeklySnapshot) with ID ${id}.`,
              ),
          },
          token: {
            set: entity => {
              inMemoryStore.token->IO.InMemoryStore.Token.set(
                ~key=entity.id,
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
              )
            },
            delete: id =>
              Logging.warn(`[unimplemented delete] can't delete entity(token) with ID ${id}.`),
          },
          tokenDailySnapshot: {
            set: entity => {
              inMemoryStore.tokenDailySnapshot->IO.InMemoryStore.TokenDailySnapshot.set(
                ~key=entity.id,
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
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
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
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
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
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
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
              )
            },
            delete: id =>
              Logging.warn(`[unimplemented delete] can't delete entity(user) with ID ${id}.`),
            get: async (id: Types.id) => {
              if optSetOfIds_user->Set.has(id) {
                inMemoryStore.user->IO.InMemoryStore.User.get(id)
              } else {
                // NOTE: this will still return the value if it exists in the in-memory store (despite the loader not being run).
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
                      ~entity=Set(
                        entity,
                        {
                          chainId,
                          blockNumber: event.blockNumber,
                          logIndex: event.logIndex,
                        },
                      ),
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
        logger,
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

      let optSetOfIds_liquidityPoolNew: Set.t<Types.id> = Set.make()
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
              ~entity=Set(dynamicContractRegistration, ""->Obj.magic),
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
              ~entity=Set(dynamicContractRegistration, ""->Obj.magic),
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
              ~entity=Set(dynamicContractRegistration, ""->Obj.magic),
            )
          },
          //TODO only add contracts we've registered for the event in the config
          addVotingReward: (contractAddress: Ethers.ethAddress) => {
            let eventId = EventUtils.packEventIndex(
              ~blockNumber=event.blockNumber,
              ~logIndex=event.logIndex,
            )
            let dynamicContractRegistration: Types.dynamicContractRegistryEntity = {
              chainId,
              eventId,
              contractAddress,
              contractType: "VotingReward",
            }

            addedDynamicContractRegistrations->Js.Array2.push(dynamicContractRegistration)->ignore

            inMemoryStore.dynamicContractRegistry->IO.InMemoryStore.DynamicContractRegistry.set(
              ~key={chainId, contractAddress},
              ~entity=Set(dynamicContractRegistration, ""->Obj.magic),
            )
          },
        },
        liquidityPoolNew: {
          load: (id: Types.id, ~loaders={}) => {
            let _ = optSetOfIds_liquidityPoolNew->Set.add(id)
            let _ = Js.Array2.push(entitiesToLoad, Types.LiquidityPoolNewRead(id, loaders))
          },
        },
        token: {
          load: (id: Types.id) => {
            let _ = optSetOfIds_token->Set.add(id)
            let _ = Js.Array2.push(entitiesToLoad, Types.TokenRead(id))
          },
        },
      }

      //handler context must be defined as a getter functoin so that it can construct the context
      //without stale values whenever it is used
      let getHandlerContextSync: unit => handlerContext = () => {
        {
          log: contextLogger,
          liquidityPoolDailySnapshot: {
            set: entity => {
              inMemoryStore.liquidityPoolDailySnapshot->IO.InMemoryStore.LiquidityPoolDailySnapshot.set(
                ~key=entity.id,
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
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
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(liquidityPoolHourlySnapshot) with ID ${id}.`,
              ),
          },
          liquidityPoolNew: {
            set: entity => {
              inMemoryStore.liquidityPoolNew->IO.InMemoryStore.LiquidityPoolNew.set(
                ~key=entity.id,
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(liquidityPoolNew) with ID ${id}.`,
              ),
            get: (id: Types.id) => {
              if optSetOfIds_liquidityPoolNew->Set.has(id) {
                inMemoryStore.liquidityPoolNew->IO.InMemoryStore.LiquidityPoolNew.get(id)
              } else {
                Logging.warn(
                  `The loader for a "LiquidityPoolNew" of entity with id "${id}" was not used please add it to your default loader function (ie. place 'context.liquidityPoolNew.load("${id}")' inside your loader) to avoid unexpected behaviour. This is a runtime validation check.`,
                )

                // NOTE: this will still return the value if it exists in the in-memory store (despite the loader not being run).
                inMemoryStore.liquidityPoolNew->IO.InMemoryStore.LiquidityPoolNew.get(id)

                // TODO: add a further step to synchronously try fetch this from the DB if it isn't in the in-memory store - similar to this PR: https://github.com/Float-Capital/indexer/pull/759
              }
            },
            getToken0: liquidityPoolNew => {
              let optToken0 =
                inMemoryStore.token->IO.InMemoryStore.Token.get(liquidityPoolNew.token0_id)
              switch optToken0 {
              | Some(token0) => token0
              | None =>
                Logging.warn(`LiquidityPoolNew token0 data not found. Loading associated token from database.
Please consider loading the token in the UpdateLiquidityPoolNew entity loader to greatly improve sync speed of your application.
`)

                raise(
                  LinkedEntityNotAvailableInSyncHandler(
                    "The required linked entity of LiquidityPoolNew is undefined.",
                  ),
                )
              }
            },
            getToken1: liquidityPoolNew => {
              let optToken1 =
                inMemoryStore.token->IO.InMemoryStore.Token.get(liquidityPoolNew.token1_id)
              switch optToken1 {
              | Some(token1) => token1
              | None =>
                Logging.warn(`LiquidityPoolNew token1 data not found. Loading associated token from database.
Please consider loading the token in the UpdateLiquidityPoolNew entity loader to greatly improve sync speed of your application.
`)

                raise(
                  LinkedEntityNotAvailableInSyncHandler(
                    "The required linked entity of LiquidityPoolNew is undefined.",
                  ),
                )
              }
            },
          },
          liquidityPoolWeeklySnapshot: {
            set: entity => {
              inMemoryStore.liquidityPoolWeeklySnapshot->IO.InMemoryStore.LiquidityPoolWeeklySnapshot.set(
                ~key=entity.id,
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(liquidityPoolWeeklySnapshot) with ID ${id}.`,
              ),
          },
          token: {
            set: entity => {
              inMemoryStore.token->IO.InMemoryStore.Token.set(
                ~key=entity.id,
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
              )
            },
            delete: id =>
              Logging.warn(`[unimplemented delete] can't delete entity(token) with ID ${id}.`),
            get: (id: Types.id) => {
              if optSetOfIds_token->Set.has(id) {
                inMemoryStore.token->IO.InMemoryStore.Token.get(id)
              } else {
                Logging.warn(
                  `The loader for a "Token" of entity with id "${id}" was not used please add it to your default loader function (ie. place 'context.token.load("${id}")' inside your loader) to avoid unexpected behaviour. This is a runtime validation check.`,
                )

                // NOTE: this will still return the value if it exists in the in-memory store (despite the loader not being run).
                inMemoryStore.token->IO.InMemoryStore.Token.get(id)

                // TODO: add a further step to synchronously try fetch this from the DB if it isn't in the in-memory store - similar to this PR: https://github.com/Float-Capital/indexer/pull/759
              }
            },
          },
          tokenDailySnapshot: {
            set: entity => {
              inMemoryStore.tokenDailySnapshot->IO.InMemoryStore.TokenDailySnapshot.set(
                ~key=entity.id,
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
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
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
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
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
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
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
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
          liquidityPoolDailySnapshot: {
            set: entity => {
              inMemoryStore.liquidityPoolDailySnapshot->IO.InMemoryStore.LiquidityPoolDailySnapshot.set(
                ~key=entity.id,
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
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
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(liquidityPoolHourlySnapshot) with ID ${id}.`,
              ),
          },
          liquidityPoolNew: {
            set: entity => {
              inMemoryStore.liquidityPoolNew->IO.InMemoryStore.LiquidityPoolNew.set(
                ~key=entity.id,
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(liquidityPoolNew) with ID ${id}.`,
              ),
            get: async (id: Types.id) => {
              if optSetOfIds_liquidityPoolNew->Set.has(id) {
                inMemoryStore.liquidityPoolNew->IO.InMemoryStore.LiquidityPoolNew.get(id)
              } else {
                // NOTE: this will still return the value if it exists in the in-memory store (despite the loader not being run).
                switch inMemoryStore.liquidityPoolNew->IO.InMemoryStore.LiquidityPoolNew.get(id) {
                | Some(entity) => Some(entity)
                | None =>
                  let entities = await asyncGetters.getLiquidityPoolNew(id)

                  switch entities->Belt.Array.get(0) {
                  | Some(entity) =>
                    // TODO: make this work with the test framework too.
                    IO.InMemoryStore.LiquidityPoolNew.set(
                      inMemoryStore.liquidityPoolNew,
                      ~key=entity.id,
                      ~entity=Set(
                        entity,
                        {
                          chainId,
                          blockNumber: event.blockNumber,
                          logIndex: event.logIndex,
                        },
                      ),
                    )
                    Some(entity)
                  | None => None
                  }
                }
              }
            },
            getToken0: async liquidityPoolNew => {
              let token0_field = liquidityPoolNew.token0_id
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
                    ~entity=Read(entity),
                  )
                  entity
                | None =>
                  Logging.error(`LiquidityPoolNew token0 data not found. Loading associated token from database.
This is likely due to a database corruption. Please reach out to the team on discord.
`)

                  raise(
                    UnableToLoadNonNullableLinkedEntity(
                      "The required linked entity token0 of LiquidityPoolNew is undefined.",
                    ),
                  )
                }
              }
            },
            getToken1: async liquidityPoolNew => {
              let token1_field = liquidityPoolNew.token1_id
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
                    ~entity=Read(entity),
                  )
                  entity
                | None =>
                  Logging.error(`LiquidityPoolNew token1 data not found. Loading associated token from database.
This is likely due to a database corruption. Please reach out to the team on discord.
`)

                  raise(
                    UnableToLoadNonNullableLinkedEntity(
                      "The required linked entity token1 of LiquidityPoolNew is undefined.",
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
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(liquidityPoolWeeklySnapshot) with ID ${id}.`,
              ),
          },
          token: {
            set: entity => {
              inMemoryStore.token->IO.InMemoryStore.Token.set(
                ~key=entity.id,
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
              )
            },
            delete: id =>
              Logging.warn(`[unimplemented delete] can't delete entity(token) with ID ${id}.`),
            get: async (id: Types.id) => {
              if optSetOfIds_token->Set.has(id) {
                inMemoryStore.token->IO.InMemoryStore.Token.get(id)
              } else {
                // NOTE: this will still return the value if it exists in the in-memory store (despite the loader not being run).
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
                      ~entity=Set(
                        entity,
                        {
                          chainId,
                          blockNumber: event.blockNumber,
                          logIndex: event.logIndex,
                        },
                      ),
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
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
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
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
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
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
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
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
              )
            },
            delete: id =>
              Logging.warn(`[unimplemented delete] can't delete entity(user) with ID ${id}.`),
          },
        }
      }

      {
        logger,
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

      let optIdArrayOf_poolTokens = ref(None)
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
              ~entity=Set(dynamicContractRegistration, ""->Obj.magic),
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
              ~entity=Set(dynamicContractRegistration, ""->Obj.magic),
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
              ~entity=Set(dynamicContractRegistration, ""->Obj.magic),
            )
          },
          //TODO only add contracts we've registered for the event in the config
          addVotingReward: (contractAddress: Ethers.ethAddress) => {
            let eventId = EventUtils.packEventIndex(
              ~blockNumber=event.blockNumber,
              ~logIndex=event.logIndex,
            )
            let dynamicContractRegistration: Types.dynamicContractRegistryEntity = {
              chainId,
              eventId,
              contractAddress,
              contractType: "VotingReward",
            }

            addedDynamicContractRegistrations->Js.Array2.push(dynamicContractRegistration)->ignore

            inMemoryStore.dynamicContractRegistry->IO.InMemoryStore.DynamicContractRegistry.set(
              ~key={chainId, contractAddress},
              ~entity=Set(dynamicContractRegistration, ""->Obj.magic),
            )
          },
        },
        token: {
          poolTokensLoad: (ids: array<Types.id>) => {
            optIdArrayOf_poolTokens := Some(ids)

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
        let poolTokens_Token = switch optIdArrayOf_poolTokens.contents {
        | Some(ids) =>
          ids->Belt.Array.map(id => inMemoryStore.token->IO.InMemoryStore.Token.get(id))
        | None =>
          Logging.warn(`The array loader for "poolTokens" of entity type "Token"" was not used please add it to your loader function or remove it from your config.yaml file to avoid unexpected behaviour. This is a runtime validation check.`)
          []
        }
        {
          log: contextLogger,
          liquidityPoolDailySnapshot: {
            set: entity => {
              inMemoryStore.liquidityPoolDailySnapshot->IO.InMemoryStore.LiquidityPoolDailySnapshot.set(
                ~key=entity.id,
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
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
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(liquidityPoolHourlySnapshot) with ID ${id}.`,
              ),
          },
          liquidityPoolNew: {
            set: entity => {
              inMemoryStore.liquidityPoolNew->IO.InMemoryStore.LiquidityPoolNew.set(
                ~key=entity.id,
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(liquidityPoolNew) with ID ${id}.`,
              ),
            getToken0: liquidityPoolNew => {
              let optToken0 =
                inMemoryStore.token->IO.InMemoryStore.Token.get(liquidityPoolNew.token0_id)
              switch optToken0 {
              | Some(token0) => token0
              | None =>
                Logging.warn(`LiquidityPoolNew token0 data not found. Loading associated token from database.
Please consider loading the token in the UpdateLiquidityPoolNew entity loader to greatly improve sync speed of your application.
`)

                raise(
                  LinkedEntityNotAvailableInSyncHandler(
                    "The required linked entity of LiquidityPoolNew is undefined.",
                  ),
                )
              }
            },
            getToken1: liquidityPoolNew => {
              let optToken1 =
                inMemoryStore.token->IO.InMemoryStore.Token.get(liquidityPoolNew.token1_id)
              switch optToken1 {
              | Some(token1) => token1
              | None =>
                Logging.warn(`LiquidityPoolNew token1 data not found. Loading associated token from database.
Please consider loading the token in the UpdateLiquidityPoolNew entity loader to greatly improve sync speed of your application.
`)

                raise(
                  LinkedEntityNotAvailableInSyncHandler(
                    "The required linked entity of LiquidityPoolNew is undefined.",
                  ),
                )
              }
            },
          },
          liquidityPoolWeeklySnapshot: {
            set: entity => {
              inMemoryStore.liquidityPoolWeeklySnapshot->IO.InMemoryStore.LiquidityPoolWeeklySnapshot.set(
                ~key=entity.id,
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(liquidityPoolWeeklySnapshot) with ID ${id}.`,
              ),
          },
          token: {
            set: entity => {
              inMemoryStore.token->IO.InMemoryStore.Token.set(
                ~key=entity.id,
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
              )
            },
            delete: id =>
              Logging.warn(`[unimplemented delete] can't delete entity(token) with ID ${id}.`),
            poolTokens: poolTokens_Token,
            get: (id: Types.id) => {
              if optSetOfIds_token->Set.has(id) {
                inMemoryStore.token->IO.InMemoryStore.Token.get(id)
              } else {
                Logging.warn(
                  `The loader for a "Token" of entity with id "${id}" was not used please add it to your default loader function (ie. place 'context.token.load("${id}")' inside your loader) to avoid unexpected behaviour. This is a runtime validation check.`,
                )

                // NOTE: this will still return the value if it exists in the in-memory store (despite the loader not being run).
                inMemoryStore.token->IO.InMemoryStore.Token.get(id)

                // TODO: add a further step to synchronously try fetch this from the DB if it isn't in the in-memory store - similar to this PR: https://github.com/Float-Capital/indexer/pull/759
              }
            },
          },
          tokenDailySnapshot: {
            set: entity => {
              inMemoryStore.tokenDailySnapshot->IO.InMemoryStore.TokenDailySnapshot.set(
                ~key=entity.id,
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
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
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
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
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
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
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
              )
            },
            delete: id =>
              Logging.warn(`[unimplemented delete] can't delete entity(user) with ID ${id}.`),
          },
        }
      }

      let getHandlerContextAsync = (): handlerContextAsync => {
        let poolTokens_Token = switch optIdArrayOf_poolTokens.contents {
        | Some(ids) =>
          ids->Belt.Array.map(id => inMemoryStore.token->IO.InMemoryStore.Token.get(id))
        | None =>
          Logging.warn(`The array loader for "poolTokens" of entity type "Token"" was not used please add it to your loader function or remove it from your config.yaml file to avoid unexpected behaviour. This is a runtime validation check.`)
          []
        }
        {
          log: contextLogger,
          liquidityPoolDailySnapshot: {
            set: entity => {
              inMemoryStore.liquidityPoolDailySnapshot->IO.InMemoryStore.LiquidityPoolDailySnapshot.set(
                ~key=entity.id,
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
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
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(liquidityPoolHourlySnapshot) with ID ${id}.`,
              ),
          },
          liquidityPoolNew: {
            set: entity => {
              inMemoryStore.liquidityPoolNew->IO.InMemoryStore.LiquidityPoolNew.set(
                ~key=entity.id,
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(liquidityPoolNew) with ID ${id}.`,
              ),
            getToken0: async liquidityPoolNew => {
              let token0_field = liquidityPoolNew.token0_id
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
                    ~entity=Read(entity),
                  )
                  entity
                | None =>
                  Logging.error(`LiquidityPoolNew token0 data not found. Loading associated token from database.
This is likely due to a database corruption. Please reach out to the team on discord.
`)

                  raise(
                    UnableToLoadNonNullableLinkedEntity(
                      "The required linked entity token0 of LiquidityPoolNew is undefined.",
                    ),
                  )
                }
              }
            },
            getToken1: async liquidityPoolNew => {
              let token1_field = liquidityPoolNew.token1_id
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
                    ~entity=Read(entity),
                  )
                  entity
                | None =>
                  Logging.error(`LiquidityPoolNew token1 data not found. Loading associated token from database.
This is likely due to a database corruption. Please reach out to the team on discord.
`)

                  raise(
                    UnableToLoadNonNullableLinkedEntity(
                      "The required linked entity token1 of LiquidityPoolNew is undefined.",
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
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(liquidityPoolWeeklySnapshot) with ID ${id}.`,
              ),
          },
          token: {
            set: entity => {
              inMemoryStore.token->IO.InMemoryStore.Token.set(
                ~key=entity.id,
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
              )
            },
            delete: id =>
              Logging.warn(`[unimplemented delete] can't delete entity(token) with ID ${id}.`),
            poolTokens: poolTokens_Token,
            get: async (id: Types.id) => {
              if optSetOfIds_token->Set.has(id) {
                inMemoryStore.token->IO.InMemoryStore.Token.get(id)
              } else {
                // NOTE: this will still return the value if it exists in the in-memory store (despite the loader not being run).
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
                      ~entity=Set(
                        entity,
                        {
                          chainId,
                          blockNumber: event.blockNumber,
                          logIndex: event.logIndex,
                        },
                      ),
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
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
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
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
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
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
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
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
              )
            },
            delete: id =>
              Logging.warn(`[unimplemented delete] can't delete entity(user) with ID ${id}.`),
          },
        }
      }

      {
        logger,
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

      let optIdOf_emissionSinglePool = ref(None)
      let optSetOfIds_liquidityPoolNew: Set.t<Types.id> = Set.make()
      let optIdOf_emissionRewardToken = ref(None)
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
              ~entity=Set(dynamicContractRegistration, ""->Obj.magic),
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
              ~entity=Set(dynamicContractRegistration, ""->Obj.magic),
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
              ~entity=Set(dynamicContractRegistration, ""->Obj.magic),
            )
          },
          //TODO only add contracts we've registered for the event in the config
          addVotingReward: (contractAddress: Ethers.ethAddress) => {
            let eventId = EventUtils.packEventIndex(
              ~blockNumber=event.blockNumber,
              ~logIndex=event.logIndex,
            )
            let dynamicContractRegistration: Types.dynamicContractRegistryEntity = {
              chainId,
              eventId,
              contractAddress,
              contractType: "VotingReward",
            }

            addedDynamicContractRegistrations->Js.Array2.push(dynamicContractRegistration)->ignore

            inMemoryStore.dynamicContractRegistry->IO.InMemoryStore.DynamicContractRegistry.set(
              ~key={chainId, contractAddress},
              ~entity=Set(dynamicContractRegistration, ""->Obj.magic),
            )
          },
        },
        liquidityPoolNew: {
          emissionSinglePoolLoad: (id: Types.id, ~loaders={}) => {
            optIdOf_emissionSinglePool := Some(id)

            let _ = Js.Array2.push(entitiesToLoad, Types.LiquidityPoolNewRead(id, loaders))
          },
          load: (id: Types.id, ~loaders={}) => {
            let _ = optSetOfIds_liquidityPoolNew->Set.add(id)
            let _ = Js.Array2.push(entitiesToLoad, Types.LiquidityPoolNewRead(id, loaders))
          },
        },
        token: {
          emissionRewardTokenLoad: (id: Types.id) => {
            optIdOf_emissionRewardToken := Some(id)

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
        let emissionSinglePool_LiquidityPoolNew = switch optIdOf_emissionSinglePool.contents {
        | Some(id) => inMemoryStore.liquidityPoolNew->IO.InMemoryStore.LiquidityPoolNew.get(id)
        | None =>
          Logging.warn(`The loader for "emissionSinglePool" of entity type "LiquidityPoolNew"" was not used please add it to your loader function or remove it from your config.yaml file to avoid unexpected behaviour. This is a runtime validation check.`)
          None
        }
        let emissionRewardToken_Token = switch optIdOf_emissionRewardToken.contents {
        | Some(id) => inMemoryStore.token->IO.InMemoryStore.Token.get(id)
        | None =>
          Logging.warn(`The loader for "emissionRewardToken" of entity type "Token"" was not used please add it to your loader function or remove it from your config.yaml file to avoid unexpected behaviour. This is a runtime validation check.`)
          None
        }
        {
          log: contextLogger,
          liquidityPoolDailySnapshot: {
            set: entity => {
              inMemoryStore.liquidityPoolDailySnapshot->IO.InMemoryStore.LiquidityPoolDailySnapshot.set(
                ~key=entity.id,
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
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
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(liquidityPoolHourlySnapshot) with ID ${id}.`,
              ),
          },
          liquidityPoolNew: {
            set: entity => {
              inMemoryStore.liquidityPoolNew->IO.InMemoryStore.LiquidityPoolNew.set(
                ~key=entity.id,
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(liquidityPoolNew) with ID ${id}.`,
              ),
            emissionSinglePool: emissionSinglePool_LiquidityPoolNew,
            get: (id: Types.id) => {
              if optSetOfIds_liquidityPoolNew->Set.has(id) {
                inMemoryStore.liquidityPoolNew->IO.InMemoryStore.LiquidityPoolNew.get(id)
              } else {
                Logging.warn(
                  `The loader for a "LiquidityPoolNew" of entity with id "${id}" was not used please add it to your default loader function (ie. place 'context.liquidityPoolNew.load("${id}")' inside your loader) to avoid unexpected behaviour. This is a runtime validation check.`,
                )

                // NOTE: this will still return the value if it exists in the in-memory store (despite the loader not being run).
                inMemoryStore.liquidityPoolNew->IO.InMemoryStore.LiquidityPoolNew.get(id)

                // TODO: add a further step to synchronously try fetch this from the DB if it isn't in the in-memory store - similar to this PR: https://github.com/Float-Capital/indexer/pull/759
              }
            },
            getToken0: liquidityPoolNew => {
              let optToken0 =
                inMemoryStore.token->IO.InMemoryStore.Token.get(liquidityPoolNew.token0_id)
              switch optToken0 {
              | Some(token0) => token0
              | None =>
                Logging.warn(`LiquidityPoolNew token0 data not found. Loading associated token from database.
Please consider loading the token in the UpdateLiquidityPoolNew entity loader to greatly improve sync speed of your application.
`)

                raise(
                  LinkedEntityNotAvailableInSyncHandler(
                    "The required linked entity of LiquidityPoolNew is undefined.",
                  ),
                )
              }
            },
            getToken1: liquidityPoolNew => {
              let optToken1 =
                inMemoryStore.token->IO.InMemoryStore.Token.get(liquidityPoolNew.token1_id)
              switch optToken1 {
              | Some(token1) => token1
              | None =>
                Logging.warn(`LiquidityPoolNew token1 data not found. Loading associated token from database.
Please consider loading the token in the UpdateLiquidityPoolNew entity loader to greatly improve sync speed of your application.
`)

                raise(
                  LinkedEntityNotAvailableInSyncHandler(
                    "The required linked entity of LiquidityPoolNew is undefined.",
                  ),
                )
              }
            },
          },
          liquidityPoolWeeklySnapshot: {
            set: entity => {
              inMemoryStore.liquidityPoolWeeklySnapshot->IO.InMemoryStore.LiquidityPoolWeeklySnapshot.set(
                ~key=entity.id,
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(liquidityPoolWeeklySnapshot) with ID ${id}.`,
              ),
          },
          token: {
            set: entity => {
              inMemoryStore.token->IO.InMemoryStore.Token.set(
                ~key=entity.id,
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
              )
            },
            delete: id =>
              Logging.warn(`[unimplemented delete] can't delete entity(token) with ID ${id}.`),
            emissionRewardToken: emissionRewardToken_Token,
            get: (id: Types.id) => {
              if optSetOfIds_token->Set.has(id) {
                inMemoryStore.token->IO.InMemoryStore.Token.get(id)
              } else {
                Logging.warn(
                  `The loader for a "Token" of entity with id "${id}" was not used please add it to your default loader function (ie. place 'context.token.load("${id}")' inside your loader) to avoid unexpected behaviour. This is a runtime validation check.`,
                )

                // NOTE: this will still return the value if it exists in the in-memory store (despite the loader not being run).
                inMemoryStore.token->IO.InMemoryStore.Token.get(id)

                // TODO: add a further step to synchronously try fetch this from the DB if it isn't in the in-memory store - similar to this PR: https://github.com/Float-Capital/indexer/pull/759
              }
            },
          },
          tokenDailySnapshot: {
            set: entity => {
              inMemoryStore.tokenDailySnapshot->IO.InMemoryStore.TokenDailySnapshot.set(
                ~key=entity.id,
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
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
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
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
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
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
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
              )
            },
            delete: id =>
              Logging.warn(`[unimplemented delete] can't delete entity(user) with ID ${id}.`),
          },
        }
      }

      let getHandlerContextAsync = (): handlerContextAsync => {
        let emissionSinglePool_LiquidityPoolNew = switch optIdOf_emissionSinglePool.contents {
        | Some(id) => inMemoryStore.liquidityPoolNew->IO.InMemoryStore.LiquidityPoolNew.get(id)
        | None =>
          Logging.warn(`The loader for "emissionSinglePool" of entity type "LiquidityPoolNew"" was not used please add it to your loader function or remove it from your config.yaml file to avoid unexpected behaviour. This is a runtime validation check.`)
          None
        }
        let emissionRewardToken_Token = switch optIdOf_emissionRewardToken.contents {
        | Some(id) => inMemoryStore.token->IO.InMemoryStore.Token.get(id)
        | None =>
          Logging.warn(`The loader for "emissionRewardToken" of entity type "Token"" was not used please add it to your loader function or remove it from your config.yaml file to avoid unexpected behaviour. This is a runtime validation check.`)
          None
        }
        {
          log: contextLogger,
          liquidityPoolDailySnapshot: {
            set: entity => {
              inMemoryStore.liquidityPoolDailySnapshot->IO.InMemoryStore.LiquidityPoolDailySnapshot.set(
                ~key=entity.id,
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
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
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(liquidityPoolHourlySnapshot) with ID ${id}.`,
              ),
          },
          liquidityPoolNew: {
            set: entity => {
              inMemoryStore.liquidityPoolNew->IO.InMemoryStore.LiquidityPoolNew.set(
                ~key=entity.id,
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(liquidityPoolNew) with ID ${id}.`,
              ),
            emissionSinglePool: emissionSinglePool_LiquidityPoolNew,
            get: async (id: Types.id) => {
              if optSetOfIds_liquidityPoolNew->Set.has(id) {
                inMemoryStore.liquidityPoolNew->IO.InMemoryStore.LiquidityPoolNew.get(id)
              } else {
                // NOTE: this will still return the value if it exists in the in-memory store (despite the loader not being run).
                switch inMemoryStore.liquidityPoolNew->IO.InMemoryStore.LiquidityPoolNew.get(id) {
                | Some(entity) => Some(entity)
                | None =>
                  let entities = await asyncGetters.getLiquidityPoolNew(id)

                  switch entities->Belt.Array.get(0) {
                  | Some(entity) =>
                    // TODO: make this work with the test framework too.
                    IO.InMemoryStore.LiquidityPoolNew.set(
                      inMemoryStore.liquidityPoolNew,
                      ~key=entity.id,
                      ~entity=Set(
                        entity,
                        {
                          chainId,
                          blockNumber: event.blockNumber,
                          logIndex: event.logIndex,
                        },
                      ),
                    )
                    Some(entity)
                  | None => None
                  }
                }
              }
            },
            getToken0: async liquidityPoolNew => {
              let token0_field = liquidityPoolNew.token0_id
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
                    ~entity=Read(entity),
                  )
                  entity
                | None =>
                  Logging.error(`LiquidityPoolNew token0 data not found. Loading associated token from database.
This is likely due to a database corruption. Please reach out to the team on discord.
`)

                  raise(
                    UnableToLoadNonNullableLinkedEntity(
                      "The required linked entity token0 of LiquidityPoolNew is undefined.",
                    ),
                  )
                }
              }
            },
            getToken1: async liquidityPoolNew => {
              let token1_field = liquidityPoolNew.token1_id
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
                    ~entity=Read(entity),
                  )
                  entity
                | None =>
                  Logging.error(`LiquidityPoolNew token1 data not found. Loading associated token from database.
This is likely due to a database corruption. Please reach out to the team on discord.
`)

                  raise(
                    UnableToLoadNonNullableLinkedEntity(
                      "The required linked entity token1 of LiquidityPoolNew is undefined.",
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
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(liquidityPoolWeeklySnapshot) with ID ${id}.`,
              ),
          },
          token: {
            set: entity => {
              inMemoryStore.token->IO.InMemoryStore.Token.set(
                ~key=entity.id,
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
              )
            },
            delete: id =>
              Logging.warn(`[unimplemented delete] can't delete entity(token) with ID ${id}.`),
            emissionRewardToken: emissionRewardToken_Token,
            get: async (id: Types.id) => {
              if optSetOfIds_token->Set.has(id) {
                inMemoryStore.token->IO.InMemoryStore.Token.get(id)
              } else {
                // NOTE: this will still return the value if it exists in the in-memory store (despite the loader not being run).
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
                      ~entity=Set(
                        entity,
                        {
                          chainId,
                          blockNumber: event.blockNumber,
                          logIndex: event.logIndex,
                        },
                      ),
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
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
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
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
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
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
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
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
              )
            },
            delete: id =>
              Logging.warn(`[unimplemented delete] can't delete entity(user) with ID ${id}.`),
          },
        }
      }

      {
        logger,
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

      let optSetOfIds_tokenDailySnapshot: Set.t<Types.id> = Set.make()
      let optSetOfIds_liquidityPoolDailySnapshot: Set.t<Types.id> = Set.make()
      let optSetOfIds_user: Set.t<Types.id> = Set.make()
      let optSetOfIds_tokenWeeklySnapshot: Set.t<Types.id> = Set.make()
      let optSetOfIds_liquidityPoolWeeklySnapshot: Set.t<Types.id> = Set.make()
      let optSetOfIds_liquidityPoolNew: Set.t<Types.id> = Set.make()
      let optSetOfIds_tokenHourlySnapshot: Set.t<Types.id> = Set.make()
      let optSetOfIds_liquidityPoolHourlySnapshot: Set.t<Types.id> = Set.make()
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
              ~entity=Set(dynamicContractRegistration, ""->Obj.magic),
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
              ~entity=Set(dynamicContractRegistration, ""->Obj.magic),
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
              ~entity=Set(dynamicContractRegistration, ""->Obj.magic),
            )
          },
          //TODO only add contracts we've registered for the event in the config
          addVotingReward: (contractAddress: Ethers.ethAddress) => {
            let eventId = EventUtils.packEventIndex(
              ~blockNumber=event.blockNumber,
              ~logIndex=event.logIndex,
            )
            let dynamicContractRegistration: Types.dynamicContractRegistryEntity = {
              chainId,
              eventId,
              contractAddress,
              contractType: "VotingReward",
            }

            addedDynamicContractRegistrations->Js.Array2.push(dynamicContractRegistration)->ignore

            inMemoryStore.dynamicContractRegistry->IO.InMemoryStore.DynamicContractRegistry.set(
              ~key={chainId, contractAddress},
              ~entity=Set(dynamicContractRegistration, ""->Obj.magic),
            )
          },
        },
        tokenDailySnapshot: {
          load: (id: Types.id) => {
            let _ = optSetOfIds_tokenDailySnapshot->Set.add(id)
            let _ = Js.Array2.push(entitiesToLoad, Types.TokenDailySnapshotRead(id))
          },
        },
        liquidityPoolDailySnapshot: {
          load: (id: Types.id) => {
            let _ = optSetOfIds_liquidityPoolDailySnapshot->Set.add(id)
            let _ = Js.Array2.push(entitiesToLoad, Types.LiquidityPoolDailySnapshotRead(id))
          },
        },
        user: {
          load: (id: Types.id) => {
            let _ = optSetOfIds_user->Set.add(id)
            let _ = Js.Array2.push(entitiesToLoad, Types.UserRead(id))
          },
        },
        tokenWeeklySnapshot: {
          load: (id: Types.id) => {
            let _ = optSetOfIds_tokenWeeklySnapshot->Set.add(id)
            let _ = Js.Array2.push(entitiesToLoad, Types.TokenWeeklySnapshotRead(id))
          },
        },
        liquidityPoolWeeklySnapshot: {
          load: (id: Types.id) => {
            let _ = optSetOfIds_liquidityPoolWeeklySnapshot->Set.add(id)
            let _ = Js.Array2.push(entitiesToLoad, Types.LiquidityPoolWeeklySnapshotRead(id))
          },
        },
        liquidityPoolNew: {
          load: (id: Types.id, ~loaders={}) => {
            let _ = optSetOfIds_liquidityPoolNew->Set.add(id)
            let _ = Js.Array2.push(entitiesToLoad, Types.LiquidityPoolNewRead(id, loaders))
          },
        },
        tokenHourlySnapshot: {
          load: (id: Types.id) => {
            let _ = optSetOfIds_tokenHourlySnapshot->Set.add(id)
            let _ = Js.Array2.push(entitiesToLoad, Types.TokenHourlySnapshotRead(id))
          },
        },
        liquidityPoolHourlySnapshot: {
          load: (id: Types.id) => {
            let _ = optSetOfIds_liquidityPoolHourlySnapshot->Set.add(id)
            let _ = Js.Array2.push(entitiesToLoad, Types.LiquidityPoolHourlySnapshotRead(id))
          },
        },
        token: {
          load: (id: Types.id) => {
            let _ = optSetOfIds_token->Set.add(id)
            let _ = Js.Array2.push(entitiesToLoad, Types.TokenRead(id))
          },
        },
      }

      //handler context must be defined as a getter functoin so that it can construct the context
      //without stale values whenever it is used
      let getHandlerContextSync: unit => handlerContext = () => {
        {
          log: contextLogger,
          liquidityPoolDailySnapshot: {
            set: entity => {
              inMemoryStore.liquidityPoolDailySnapshot->IO.InMemoryStore.LiquidityPoolDailySnapshot.set(
                ~key=entity.id,
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(liquidityPoolDailySnapshot) with ID ${id}.`,
              ),
            get: (id: Types.id) => {
              if optSetOfIds_liquidityPoolDailySnapshot->Set.has(id) {
                inMemoryStore.liquidityPoolDailySnapshot->IO.InMemoryStore.LiquidityPoolDailySnapshot.get(
                  id,
                )
              } else {
                Logging.warn(
                  `The loader for a "LiquidityPoolDailySnapshot" of entity with id "${id}" was not used please add it to your default loader function (ie. place 'context.liquidityPoolDailySnapshot.load("${id}")' inside your loader) to avoid unexpected behaviour. This is a runtime validation check.`,
                )

                // NOTE: this will still return the value if it exists in the in-memory store (despite the loader not being run).
                inMemoryStore.liquidityPoolDailySnapshot->IO.InMemoryStore.LiquidityPoolDailySnapshot.get(
                  id,
                )

                // TODO: add a further step to synchronously try fetch this from the DB if it isn't in the in-memory store - similar to this PR: https://github.com/Float-Capital/indexer/pull/759
              }
            },
          },
          liquidityPoolHourlySnapshot: {
            set: entity => {
              inMemoryStore.liquidityPoolHourlySnapshot->IO.InMemoryStore.LiquidityPoolHourlySnapshot.set(
                ~key=entity.id,
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(liquidityPoolHourlySnapshot) with ID ${id}.`,
              ),
            get: (id: Types.id) => {
              if optSetOfIds_liquidityPoolHourlySnapshot->Set.has(id) {
                inMemoryStore.liquidityPoolHourlySnapshot->IO.InMemoryStore.LiquidityPoolHourlySnapshot.get(
                  id,
                )
              } else {
                Logging.warn(
                  `The loader for a "LiquidityPoolHourlySnapshot" of entity with id "${id}" was not used please add it to your default loader function (ie. place 'context.liquidityPoolHourlySnapshot.load("${id}")' inside your loader) to avoid unexpected behaviour. This is a runtime validation check.`,
                )

                // NOTE: this will still return the value if it exists in the in-memory store (despite the loader not being run).
                inMemoryStore.liquidityPoolHourlySnapshot->IO.InMemoryStore.LiquidityPoolHourlySnapshot.get(
                  id,
                )

                // TODO: add a further step to synchronously try fetch this from the DB if it isn't in the in-memory store - similar to this PR: https://github.com/Float-Capital/indexer/pull/759
              }
            },
          },
          liquidityPoolNew: {
            set: entity => {
              inMemoryStore.liquidityPoolNew->IO.InMemoryStore.LiquidityPoolNew.set(
                ~key=entity.id,
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(liquidityPoolNew) with ID ${id}.`,
              ),
            get: (id: Types.id) => {
              if optSetOfIds_liquidityPoolNew->Set.has(id) {
                inMemoryStore.liquidityPoolNew->IO.InMemoryStore.LiquidityPoolNew.get(id)
              } else {
                Logging.warn(
                  `The loader for a "LiquidityPoolNew" of entity with id "${id}" was not used please add it to your default loader function (ie. place 'context.liquidityPoolNew.load("${id}")' inside your loader) to avoid unexpected behaviour. This is a runtime validation check.`,
                )

                // NOTE: this will still return the value if it exists in the in-memory store (despite the loader not being run).
                inMemoryStore.liquidityPoolNew->IO.InMemoryStore.LiquidityPoolNew.get(id)

                // TODO: add a further step to synchronously try fetch this from the DB if it isn't in the in-memory store - similar to this PR: https://github.com/Float-Capital/indexer/pull/759
              }
            },
            getToken0: liquidityPoolNew => {
              let optToken0 =
                inMemoryStore.token->IO.InMemoryStore.Token.get(liquidityPoolNew.token0_id)
              switch optToken0 {
              | Some(token0) => token0
              | None =>
                Logging.warn(`LiquidityPoolNew token0 data not found. Loading associated token from database.
Please consider loading the token in the UpdateLiquidityPoolNew entity loader to greatly improve sync speed of your application.
`)

                raise(
                  LinkedEntityNotAvailableInSyncHandler(
                    "The required linked entity of LiquidityPoolNew is undefined.",
                  ),
                )
              }
            },
            getToken1: liquidityPoolNew => {
              let optToken1 =
                inMemoryStore.token->IO.InMemoryStore.Token.get(liquidityPoolNew.token1_id)
              switch optToken1 {
              | Some(token1) => token1
              | None =>
                Logging.warn(`LiquidityPoolNew token1 data not found. Loading associated token from database.
Please consider loading the token in the UpdateLiquidityPoolNew entity loader to greatly improve sync speed of your application.
`)

                raise(
                  LinkedEntityNotAvailableInSyncHandler(
                    "The required linked entity of LiquidityPoolNew is undefined.",
                  ),
                )
              }
            },
          },
          liquidityPoolWeeklySnapshot: {
            set: entity => {
              inMemoryStore.liquidityPoolWeeklySnapshot->IO.InMemoryStore.LiquidityPoolWeeklySnapshot.set(
                ~key=entity.id,
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(liquidityPoolWeeklySnapshot) with ID ${id}.`,
              ),
            get: (id: Types.id) => {
              if optSetOfIds_liquidityPoolWeeklySnapshot->Set.has(id) {
                inMemoryStore.liquidityPoolWeeklySnapshot->IO.InMemoryStore.LiquidityPoolWeeklySnapshot.get(
                  id,
                )
              } else {
                Logging.warn(
                  `The loader for a "LiquidityPoolWeeklySnapshot" of entity with id "${id}" was not used please add it to your default loader function (ie. place 'context.liquidityPoolWeeklySnapshot.load("${id}")' inside your loader) to avoid unexpected behaviour. This is a runtime validation check.`,
                )

                // NOTE: this will still return the value if it exists in the in-memory store (despite the loader not being run).
                inMemoryStore.liquidityPoolWeeklySnapshot->IO.InMemoryStore.LiquidityPoolWeeklySnapshot.get(
                  id,
                )

                // TODO: add a further step to synchronously try fetch this from the DB if it isn't in the in-memory store - similar to this PR: https://github.com/Float-Capital/indexer/pull/759
              }
            },
          },
          token: {
            set: entity => {
              inMemoryStore.token->IO.InMemoryStore.Token.set(
                ~key=entity.id,
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
              )
            },
            delete: id =>
              Logging.warn(`[unimplemented delete] can't delete entity(token) with ID ${id}.`),
            get: (id: Types.id) => {
              if optSetOfIds_token->Set.has(id) {
                inMemoryStore.token->IO.InMemoryStore.Token.get(id)
              } else {
                Logging.warn(
                  `The loader for a "Token" of entity with id "${id}" was not used please add it to your default loader function (ie. place 'context.token.load("${id}")' inside your loader) to avoid unexpected behaviour. This is a runtime validation check.`,
                )

                // NOTE: this will still return the value if it exists in the in-memory store (despite the loader not being run).
                inMemoryStore.token->IO.InMemoryStore.Token.get(id)

                // TODO: add a further step to synchronously try fetch this from the DB if it isn't in the in-memory store - similar to this PR: https://github.com/Float-Capital/indexer/pull/759
              }
            },
          },
          tokenDailySnapshot: {
            set: entity => {
              inMemoryStore.tokenDailySnapshot->IO.InMemoryStore.TokenDailySnapshot.set(
                ~key=entity.id,
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(tokenDailySnapshot) with ID ${id}.`,
              ),
            get: (id: Types.id) => {
              if optSetOfIds_tokenDailySnapshot->Set.has(id) {
                inMemoryStore.tokenDailySnapshot->IO.InMemoryStore.TokenDailySnapshot.get(id)
              } else {
                Logging.warn(
                  `The loader for a "TokenDailySnapshot" of entity with id "${id}" was not used please add it to your default loader function (ie. place 'context.tokenDailySnapshot.load("${id}")' inside your loader) to avoid unexpected behaviour. This is a runtime validation check.`,
                )

                // NOTE: this will still return the value if it exists in the in-memory store (despite the loader not being run).
                inMemoryStore.tokenDailySnapshot->IO.InMemoryStore.TokenDailySnapshot.get(id)

                // TODO: add a further step to synchronously try fetch this from the DB if it isn't in the in-memory store - similar to this PR: https://github.com/Float-Capital/indexer/pull/759
              }
            },
          },
          tokenHourlySnapshot: {
            set: entity => {
              inMemoryStore.tokenHourlySnapshot->IO.InMemoryStore.TokenHourlySnapshot.set(
                ~key=entity.id,
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(tokenHourlySnapshot) with ID ${id}.`,
              ),
            get: (id: Types.id) => {
              if optSetOfIds_tokenHourlySnapshot->Set.has(id) {
                inMemoryStore.tokenHourlySnapshot->IO.InMemoryStore.TokenHourlySnapshot.get(id)
              } else {
                Logging.warn(
                  `The loader for a "TokenHourlySnapshot" of entity with id "${id}" was not used please add it to your default loader function (ie. place 'context.tokenHourlySnapshot.load("${id}")' inside your loader) to avoid unexpected behaviour. This is a runtime validation check.`,
                )

                // NOTE: this will still return the value if it exists in the in-memory store (despite the loader not being run).
                inMemoryStore.tokenHourlySnapshot->IO.InMemoryStore.TokenHourlySnapshot.get(id)

                // TODO: add a further step to synchronously try fetch this from the DB if it isn't in the in-memory store - similar to this PR: https://github.com/Float-Capital/indexer/pull/759
              }
            },
          },
          tokenWeeklySnapshot: {
            set: entity => {
              inMemoryStore.tokenWeeklySnapshot->IO.InMemoryStore.TokenWeeklySnapshot.set(
                ~key=entity.id,
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(tokenWeeklySnapshot) with ID ${id}.`,
              ),
            get: (id: Types.id) => {
              if optSetOfIds_tokenWeeklySnapshot->Set.has(id) {
                inMemoryStore.tokenWeeklySnapshot->IO.InMemoryStore.TokenWeeklySnapshot.get(id)
              } else {
                Logging.warn(
                  `The loader for a "TokenWeeklySnapshot" of entity with id "${id}" was not used please add it to your default loader function (ie. place 'context.tokenWeeklySnapshot.load("${id}")' inside your loader) to avoid unexpected behaviour. This is a runtime validation check.`,
                )

                // NOTE: this will still return the value if it exists in the in-memory store (despite the loader not being run).
                inMemoryStore.tokenWeeklySnapshot->IO.InMemoryStore.TokenWeeklySnapshot.get(id)

                // TODO: add a further step to synchronously try fetch this from the DB if it isn't in the in-memory store - similar to this PR: https://github.com/Float-Capital/indexer/pull/759
              }
            },
          },
          user: {
            set: entity => {
              inMemoryStore.user->IO.InMemoryStore.User.set(
                ~key=entity.id,
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
              )
            },
            delete: id =>
              Logging.warn(`[unimplemented delete] can't delete entity(user) with ID ${id}.`),
            get: (id: Types.id) => {
              if optSetOfIds_user->Set.has(id) {
                inMemoryStore.user->IO.InMemoryStore.User.get(id)
              } else {
                Logging.warn(
                  `The loader for a "User" of entity with id "${id}" was not used please add it to your default loader function (ie. place 'context.user.load("${id}")' inside your loader) to avoid unexpected behaviour. This is a runtime validation check.`,
                )

                // NOTE: this will still return the value if it exists in the in-memory store (despite the loader not being run).
                inMemoryStore.user->IO.InMemoryStore.User.get(id)

                // TODO: add a further step to synchronously try fetch this from the DB if it isn't in the in-memory store - similar to this PR: https://github.com/Float-Capital/indexer/pull/759
              }
            },
          },
        }
      }

      let getHandlerContextAsync = (): handlerContextAsync => {
        {
          log: contextLogger,
          liquidityPoolDailySnapshot: {
            set: entity => {
              inMemoryStore.liquidityPoolDailySnapshot->IO.InMemoryStore.LiquidityPoolDailySnapshot.set(
                ~key=entity.id,
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(liquidityPoolDailySnapshot) with ID ${id}.`,
              ),
            get: async (id: Types.id) => {
              if optSetOfIds_liquidityPoolDailySnapshot->Set.has(id) {
                inMemoryStore.liquidityPoolDailySnapshot->IO.InMemoryStore.LiquidityPoolDailySnapshot.get(
                  id,
                )
              } else {
                // NOTE: this will still return the value if it exists in the in-memory store (despite the loader not being run).
                switch inMemoryStore.liquidityPoolDailySnapshot->IO.InMemoryStore.LiquidityPoolDailySnapshot.get(
                  id,
                ) {
                | Some(entity) => Some(entity)
                | None =>
                  let entities = await asyncGetters.getLiquidityPoolDailySnapshot(id)

                  switch entities->Belt.Array.get(0) {
                  | Some(entity) =>
                    // TODO: make this work with the test framework too.
                    IO.InMemoryStore.LiquidityPoolDailySnapshot.set(
                      inMemoryStore.liquidityPoolDailySnapshot,
                      ~key=entity.id,
                      ~entity=Set(
                        entity,
                        {
                          chainId,
                          blockNumber: event.blockNumber,
                          logIndex: event.logIndex,
                        },
                      ),
                    )
                    Some(entity)
                  | None => None
                  }
                }
              }
            },
          },
          liquidityPoolHourlySnapshot: {
            set: entity => {
              inMemoryStore.liquidityPoolHourlySnapshot->IO.InMemoryStore.LiquidityPoolHourlySnapshot.set(
                ~key=entity.id,
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(liquidityPoolHourlySnapshot) with ID ${id}.`,
              ),
            get: async (id: Types.id) => {
              if optSetOfIds_liquidityPoolHourlySnapshot->Set.has(id) {
                inMemoryStore.liquidityPoolHourlySnapshot->IO.InMemoryStore.LiquidityPoolHourlySnapshot.get(
                  id,
                )
              } else {
                // NOTE: this will still return the value if it exists in the in-memory store (despite the loader not being run).
                switch inMemoryStore.liquidityPoolHourlySnapshot->IO.InMemoryStore.LiquidityPoolHourlySnapshot.get(
                  id,
                ) {
                | Some(entity) => Some(entity)
                | None =>
                  let entities = await asyncGetters.getLiquidityPoolHourlySnapshot(id)

                  switch entities->Belt.Array.get(0) {
                  | Some(entity) =>
                    // TODO: make this work with the test framework too.
                    IO.InMemoryStore.LiquidityPoolHourlySnapshot.set(
                      inMemoryStore.liquidityPoolHourlySnapshot,
                      ~key=entity.id,
                      ~entity=Set(
                        entity,
                        {
                          chainId,
                          blockNumber: event.blockNumber,
                          logIndex: event.logIndex,
                        },
                      ),
                    )
                    Some(entity)
                  | None => None
                  }
                }
              }
            },
          },
          liquidityPoolNew: {
            set: entity => {
              inMemoryStore.liquidityPoolNew->IO.InMemoryStore.LiquidityPoolNew.set(
                ~key=entity.id,
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(liquidityPoolNew) with ID ${id}.`,
              ),
            get: async (id: Types.id) => {
              if optSetOfIds_liquidityPoolNew->Set.has(id) {
                inMemoryStore.liquidityPoolNew->IO.InMemoryStore.LiquidityPoolNew.get(id)
              } else {
                // NOTE: this will still return the value if it exists in the in-memory store (despite the loader not being run).
                switch inMemoryStore.liquidityPoolNew->IO.InMemoryStore.LiquidityPoolNew.get(id) {
                | Some(entity) => Some(entity)
                | None =>
                  let entities = await asyncGetters.getLiquidityPoolNew(id)

                  switch entities->Belt.Array.get(0) {
                  | Some(entity) =>
                    // TODO: make this work with the test framework too.
                    IO.InMemoryStore.LiquidityPoolNew.set(
                      inMemoryStore.liquidityPoolNew,
                      ~key=entity.id,
                      ~entity=Set(
                        entity,
                        {
                          chainId,
                          blockNumber: event.blockNumber,
                          logIndex: event.logIndex,
                        },
                      ),
                    )
                    Some(entity)
                  | None => None
                  }
                }
              }
            },
            getToken0: async liquidityPoolNew => {
              let token0_field = liquidityPoolNew.token0_id
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
                    ~entity=Read(entity),
                  )
                  entity
                | None =>
                  Logging.error(`LiquidityPoolNew token0 data not found. Loading associated token from database.
This is likely due to a database corruption. Please reach out to the team on discord.
`)

                  raise(
                    UnableToLoadNonNullableLinkedEntity(
                      "The required linked entity token0 of LiquidityPoolNew is undefined.",
                    ),
                  )
                }
              }
            },
            getToken1: async liquidityPoolNew => {
              let token1_field = liquidityPoolNew.token1_id
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
                    ~entity=Read(entity),
                  )
                  entity
                | None =>
                  Logging.error(`LiquidityPoolNew token1 data not found. Loading associated token from database.
This is likely due to a database corruption. Please reach out to the team on discord.
`)

                  raise(
                    UnableToLoadNonNullableLinkedEntity(
                      "The required linked entity token1 of LiquidityPoolNew is undefined.",
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
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(liquidityPoolWeeklySnapshot) with ID ${id}.`,
              ),
            get: async (id: Types.id) => {
              if optSetOfIds_liquidityPoolWeeklySnapshot->Set.has(id) {
                inMemoryStore.liquidityPoolWeeklySnapshot->IO.InMemoryStore.LiquidityPoolWeeklySnapshot.get(
                  id,
                )
              } else {
                // NOTE: this will still return the value if it exists in the in-memory store (despite the loader not being run).
                switch inMemoryStore.liquidityPoolWeeklySnapshot->IO.InMemoryStore.LiquidityPoolWeeklySnapshot.get(
                  id,
                ) {
                | Some(entity) => Some(entity)
                | None =>
                  let entities = await asyncGetters.getLiquidityPoolWeeklySnapshot(id)

                  switch entities->Belt.Array.get(0) {
                  | Some(entity) =>
                    // TODO: make this work with the test framework too.
                    IO.InMemoryStore.LiquidityPoolWeeklySnapshot.set(
                      inMemoryStore.liquidityPoolWeeklySnapshot,
                      ~key=entity.id,
                      ~entity=Set(
                        entity,
                        {
                          chainId,
                          blockNumber: event.blockNumber,
                          logIndex: event.logIndex,
                        },
                      ),
                    )
                    Some(entity)
                  | None => None
                  }
                }
              }
            },
          },
          token: {
            set: entity => {
              inMemoryStore.token->IO.InMemoryStore.Token.set(
                ~key=entity.id,
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
              )
            },
            delete: id =>
              Logging.warn(`[unimplemented delete] can't delete entity(token) with ID ${id}.`),
            get: async (id: Types.id) => {
              if optSetOfIds_token->Set.has(id) {
                inMemoryStore.token->IO.InMemoryStore.Token.get(id)
              } else {
                // NOTE: this will still return the value if it exists in the in-memory store (despite the loader not being run).
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
                      ~entity=Set(
                        entity,
                        {
                          chainId,
                          blockNumber: event.blockNumber,
                          logIndex: event.logIndex,
                        },
                      ),
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
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(tokenDailySnapshot) with ID ${id}.`,
              ),
            get: async (id: Types.id) => {
              if optSetOfIds_tokenDailySnapshot->Set.has(id) {
                inMemoryStore.tokenDailySnapshot->IO.InMemoryStore.TokenDailySnapshot.get(id)
              } else {
                // NOTE: this will still return the value if it exists in the in-memory store (despite the loader not being run).
                switch inMemoryStore.tokenDailySnapshot->IO.InMemoryStore.TokenDailySnapshot.get(
                  id,
                ) {
                | Some(entity) => Some(entity)
                | None =>
                  let entities = await asyncGetters.getTokenDailySnapshot(id)

                  switch entities->Belt.Array.get(0) {
                  | Some(entity) =>
                    // TODO: make this work with the test framework too.
                    IO.InMemoryStore.TokenDailySnapshot.set(
                      inMemoryStore.tokenDailySnapshot,
                      ~key=entity.id,
                      ~entity=Set(
                        entity,
                        {
                          chainId,
                          blockNumber: event.blockNumber,
                          logIndex: event.logIndex,
                        },
                      ),
                    )
                    Some(entity)
                  | None => None
                  }
                }
              }
            },
          },
          tokenHourlySnapshot: {
            set: entity => {
              inMemoryStore.tokenHourlySnapshot->IO.InMemoryStore.TokenHourlySnapshot.set(
                ~key=entity.id,
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(tokenHourlySnapshot) with ID ${id}.`,
              ),
            get: async (id: Types.id) => {
              if optSetOfIds_tokenHourlySnapshot->Set.has(id) {
                inMemoryStore.tokenHourlySnapshot->IO.InMemoryStore.TokenHourlySnapshot.get(id)
              } else {
                // NOTE: this will still return the value if it exists in the in-memory store (despite the loader not being run).
                switch inMemoryStore.tokenHourlySnapshot->IO.InMemoryStore.TokenHourlySnapshot.get(
                  id,
                ) {
                | Some(entity) => Some(entity)
                | None =>
                  let entities = await asyncGetters.getTokenHourlySnapshot(id)

                  switch entities->Belt.Array.get(0) {
                  | Some(entity) =>
                    // TODO: make this work with the test framework too.
                    IO.InMemoryStore.TokenHourlySnapshot.set(
                      inMemoryStore.tokenHourlySnapshot,
                      ~key=entity.id,
                      ~entity=Set(
                        entity,
                        {
                          chainId,
                          blockNumber: event.blockNumber,
                          logIndex: event.logIndex,
                        },
                      ),
                    )
                    Some(entity)
                  | None => None
                  }
                }
              }
            },
          },
          tokenWeeklySnapshot: {
            set: entity => {
              inMemoryStore.tokenWeeklySnapshot->IO.InMemoryStore.TokenWeeklySnapshot.set(
                ~key=entity.id,
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(tokenWeeklySnapshot) with ID ${id}.`,
              ),
            get: async (id: Types.id) => {
              if optSetOfIds_tokenWeeklySnapshot->Set.has(id) {
                inMemoryStore.tokenWeeklySnapshot->IO.InMemoryStore.TokenWeeklySnapshot.get(id)
              } else {
                // NOTE: this will still return the value if it exists in the in-memory store (despite the loader not being run).
                switch inMemoryStore.tokenWeeklySnapshot->IO.InMemoryStore.TokenWeeklySnapshot.get(
                  id,
                ) {
                | Some(entity) => Some(entity)
                | None =>
                  let entities = await asyncGetters.getTokenWeeklySnapshot(id)

                  switch entities->Belt.Array.get(0) {
                  | Some(entity) =>
                    // TODO: make this work with the test framework too.
                    IO.InMemoryStore.TokenWeeklySnapshot.set(
                      inMemoryStore.tokenWeeklySnapshot,
                      ~key=entity.id,
                      ~entity=Set(
                        entity,
                        {
                          chainId,
                          blockNumber: event.blockNumber,
                          logIndex: event.logIndex,
                        },
                      ),
                    )
                    Some(entity)
                  | None => None
                  }
                }
              }
            },
          },
          user: {
            set: entity => {
              inMemoryStore.user->IO.InMemoryStore.User.set(
                ~key=entity.id,
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
              )
            },
            delete: id =>
              Logging.warn(`[unimplemented delete] can't delete entity(user) with ID ${id}.`),
            get: async (id: Types.id) => {
              if optSetOfIds_user->Set.has(id) {
                inMemoryStore.user->IO.InMemoryStore.User.get(id)
              } else {
                // NOTE: this will still return the value if it exists in the in-memory store (despite the loader not being run).
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
                      ~entity=Set(
                        entity,
                        {
                          chainId,
                          blockNumber: event.blockNumber,
                          logIndex: event.logIndex,
                        },
                      ),
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
        logger,
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

module VotingRewardContract = {
  module NotifyRewardEvent = {
    type loaderContext = Types.VotingRewardContract.NotifyRewardEvent.loaderContext
    type handlerContext = Types.VotingRewardContract.NotifyRewardEvent.handlerContext
    type handlerContextAsync = Types.VotingRewardContract.NotifyRewardEvent.handlerContextAsync
    type context = genericContextCreatorFunctions<
      loaderContext,
      handlerContext,
      handlerContextAsync,
    >

    let contextCreator: contextCreator<
      Types.VotingRewardContract.NotifyRewardEvent.eventArgs,
      loaderContext,
      handlerContext,
      handlerContextAsync,
    > = (~inMemoryStore, ~chainId, ~event, ~logger, ~asyncGetters) => {
      // NOTE: we could optimise this code to onle create a logger if there was a log called.
      let logger = logger->Logging.createChildFrom(
        ~logger=_,
        ~params={
          "context": "VotingReward.NotifyReward",
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

      let optIdOf_bribeSinglePool = ref(None)
      let optSetOfIds_liquidityPoolNew: Set.t<Types.id> = Set.make()
      let optIdOf_bribeRewardToken = ref(None)
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
              ~entity=Set(dynamicContractRegistration, ""->Obj.magic),
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
              ~entity=Set(dynamicContractRegistration, ""->Obj.magic),
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
              ~entity=Set(dynamicContractRegistration, ""->Obj.magic),
            )
          },
          //TODO only add contracts we've registered for the event in the config
          addVotingReward: (contractAddress: Ethers.ethAddress) => {
            let eventId = EventUtils.packEventIndex(
              ~blockNumber=event.blockNumber,
              ~logIndex=event.logIndex,
            )
            let dynamicContractRegistration: Types.dynamicContractRegistryEntity = {
              chainId,
              eventId,
              contractAddress,
              contractType: "VotingReward",
            }

            addedDynamicContractRegistrations->Js.Array2.push(dynamicContractRegistration)->ignore

            inMemoryStore.dynamicContractRegistry->IO.InMemoryStore.DynamicContractRegistry.set(
              ~key={chainId, contractAddress},
              ~entity=Set(dynamicContractRegistration, ""->Obj.magic),
            )
          },
        },
        liquidityPoolNew: {
          bribeSinglePoolLoad: (id: Types.id, ~loaders={}) => {
            optIdOf_bribeSinglePool := Some(id)

            let _ = Js.Array2.push(entitiesToLoad, Types.LiquidityPoolNewRead(id, loaders))
          },
          load: (id: Types.id, ~loaders={}) => {
            let _ = optSetOfIds_liquidityPoolNew->Set.add(id)
            let _ = Js.Array2.push(entitiesToLoad, Types.LiquidityPoolNewRead(id, loaders))
          },
        },
        token: {
          bribeRewardTokenLoad: (id: Types.id) => {
            optIdOf_bribeRewardToken := Some(id)

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
        let bribeSinglePool_LiquidityPoolNew = switch optIdOf_bribeSinglePool.contents {
        | Some(id) => inMemoryStore.liquidityPoolNew->IO.InMemoryStore.LiquidityPoolNew.get(id)
        | None =>
          Logging.warn(`The loader for "bribeSinglePool" of entity type "LiquidityPoolNew"" was not used please add it to your loader function or remove it from your config.yaml file to avoid unexpected behaviour. This is a runtime validation check.`)
          None
        }
        let bribeRewardToken_Token = switch optIdOf_bribeRewardToken.contents {
        | Some(id) => inMemoryStore.token->IO.InMemoryStore.Token.get(id)
        | None =>
          Logging.warn(`The loader for "bribeRewardToken" of entity type "Token"" was not used please add it to your loader function or remove it from your config.yaml file to avoid unexpected behaviour. This is a runtime validation check.`)
          None
        }
        {
          log: contextLogger,
          liquidityPoolDailySnapshot: {
            set: entity => {
              inMemoryStore.liquidityPoolDailySnapshot->IO.InMemoryStore.LiquidityPoolDailySnapshot.set(
                ~key=entity.id,
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
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
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(liquidityPoolHourlySnapshot) with ID ${id}.`,
              ),
          },
          liquidityPoolNew: {
            set: entity => {
              inMemoryStore.liquidityPoolNew->IO.InMemoryStore.LiquidityPoolNew.set(
                ~key=entity.id,
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(liquidityPoolNew) with ID ${id}.`,
              ),
            bribeSinglePool: bribeSinglePool_LiquidityPoolNew,
            get: (id: Types.id) => {
              if optSetOfIds_liquidityPoolNew->Set.has(id) {
                inMemoryStore.liquidityPoolNew->IO.InMemoryStore.LiquidityPoolNew.get(id)
              } else {
                Logging.warn(
                  `The loader for a "LiquidityPoolNew" of entity with id "${id}" was not used please add it to your default loader function (ie. place 'context.liquidityPoolNew.load("${id}")' inside your loader) to avoid unexpected behaviour. This is a runtime validation check.`,
                )

                // NOTE: this will still return the value if it exists in the in-memory store (despite the loader not being run).
                inMemoryStore.liquidityPoolNew->IO.InMemoryStore.LiquidityPoolNew.get(id)

                // TODO: add a further step to synchronously try fetch this from the DB if it isn't in the in-memory store - similar to this PR: https://github.com/Float-Capital/indexer/pull/759
              }
            },
            getToken0: liquidityPoolNew => {
              let optToken0 =
                inMemoryStore.token->IO.InMemoryStore.Token.get(liquidityPoolNew.token0_id)
              switch optToken0 {
              | Some(token0) => token0
              | None =>
                Logging.warn(`LiquidityPoolNew token0 data not found. Loading associated token from database.
Please consider loading the token in the UpdateLiquidityPoolNew entity loader to greatly improve sync speed of your application.
`)

                raise(
                  LinkedEntityNotAvailableInSyncHandler(
                    "The required linked entity of LiquidityPoolNew is undefined.",
                  ),
                )
              }
            },
            getToken1: liquidityPoolNew => {
              let optToken1 =
                inMemoryStore.token->IO.InMemoryStore.Token.get(liquidityPoolNew.token1_id)
              switch optToken1 {
              | Some(token1) => token1
              | None =>
                Logging.warn(`LiquidityPoolNew token1 data not found. Loading associated token from database.
Please consider loading the token in the UpdateLiquidityPoolNew entity loader to greatly improve sync speed of your application.
`)

                raise(
                  LinkedEntityNotAvailableInSyncHandler(
                    "The required linked entity of LiquidityPoolNew is undefined.",
                  ),
                )
              }
            },
          },
          liquidityPoolWeeklySnapshot: {
            set: entity => {
              inMemoryStore.liquidityPoolWeeklySnapshot->IO.InMemoryStore.LiquidityPoolWeeklySnapshot.set(
                ~key=entity.id,
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(liquidityPoolWeeklySnapshot) with ID ${id}.`,
              ),
          },
          token: {
            set: entity => {
              inMemoryStore.token->IO.InMemoryStore.Token.set(
                ~key=entity.id,
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
              )
            },
            delete: id =>
              Logging.warn(`[unimplemented delete] can't delete entity(token) with ID ${id}.`),
            bribeRewardToken: bribeRewardToken_Token,
            get: (id: Types.id) => {
              if optSetOfIds_token->Set.has(id) {
                inMemoryStore.token->IO.InMemoryStore.Token.get(id)
              } else {
                Logging.warn(
                  `The loader for a "Token" of entity with id "${id}" was not used please add it to your default loader function (ie. place 'context.token.load("${id}")' inside your loader) to avoid unexpected behaviour. This is a runtime validation check.`,
                )

                // NOTE: this will still return the value if it exists in the in-memory store (despite the loader not being run).
                inMemoryStore.token->IO.InMemoryStore.Token.get(id)

                // TODO: add a further step to synchronously try fetch this from the DB if it isn't in the in-memory store - similar to this PR: https://github.com/Float-Capital/indexer/pull/759
              }
            },
          },
          tokenDailySnapshot: {
            set: entity => {
              inMemoryStore.tokenDailySnapshot->IO.InMemoryStore.TokenDailySnapshot.set(
                ~key=entity.id,
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
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
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
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
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
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
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
              )
            },
            delete: id =>
              Logging.warn(`[unimplemented delete] can't delete entity(user) with ID ${id}.`),
          },
        }
      }

      let getHandlerContextAsync = (): handlerContextAsync => {
        let bribeSinglePool_LiquidityPoolNew = switch optIdOf_bribeSinglePool.contents {
        | Some(id) => inMemoryStore.liquidityPoolNew->IO.InMemoryStore.LiquidityPoolNew.get(id)
        | None =>
          Logging.warn(`The loader for "bribeSinglePool" of entity type "LiquidityPoolNew"" was not used please add it to your loader function or remove it from your config.yaml file to avoid unexpected behaviour. This is a runtime validation check.`)
          None
        }
        let bribeRewardToken_Token = switch optIdOf_bribeRewardToken.contents {
        | Some(id) => inMemoryStore.token->IO.InMemoryStore.Token.get(id)
        | None =>
          Logging.warn(`The loader for "bribeRewardToken" of entity type "Token"" was not used please add it to your loader function or remove it from your config.yaml file to avoid unexpected behaviour. This is a runtime validation check.`)
          None
        }
        {
          log: contextLogger,
          liquidityPoolDailySnapshot: {
            set: entity => {
              inMemoryStore.liquidityPoolDailySnapshot->IO.InMemoryStore.LiquidityPoolDailySnapshot.set(
                ~key=entity.id,
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
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
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(liquidityPoolHourlySnapshot) with ID ${id}.`,
              ),
          },
          liquidityPoolNew: {
            set: entity => {
              inMemoryStore.liquidityPoolNew->IO.InMemoryStore.LiquidityPoolNew.set(
                ~key=entity.id,
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(liquidityPoolNew) with ID ${id}.`,
              ),
            bribeSinglePool: bribeSinglePool_LiquidityPoolNew,
            get: async (id: Types.id) => {
              if optSetOfIds_liquidityPoolNew->Set.has(id) {
                inMemoryStore.liquidityPoolNew->IO.InMemoryStore.LiquidityPoolNew.get(id)
              } else {
                // NOTE: this will still return the value if it exists in the in-memory store (despite the loader not being run).
                switch inMemoryStore.liquidityPoolNew->IO.InMemoryStore.LiquidityPoolNew.get(id) {
                | Some(entity) => Some(entity)
                | None =>
                  let entities = await asyncGetters.getLiquidityPoolNew(id)

                  switch entities->Belt.Array.get(0) {
                  | Some(entity) =>
                    // TODO: make this work with the test framework too.
                    IO.InMemoryStore.LiquidityPoolNew.set(
                      inMemoryStore.liquidityPoolNew,
                      ~key=entity.id,
                      ~entity=Set(
                        entity,
                        {
                          chainId,
                          blockNumber: event.blockNumber,
                          logIndex: event.logIndex,
                        },
                      ),
                    )
                    Some(entity)
                  | None => None
                  }
                }
              }
            },
            getToken0: async liquidityPoolNew => {
              let token0_field = liquidityPoolNew.token0_id
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
                    ~entity=Read(entity),
                  )
                  entity
                | None =>
                  Logging.error(`LiquidityPoolNew token0 data not found. Loading associated token from database.
This is likely due to a database corruption. Please reach out to the team on discord.
`)

                  raise(
                    UnableToLoadNonNullableLinkedEntity(
                      "The required linked entity token0 of LiquidityPoolNew is undefined.",
                    ),
                  )
                }
              }
            },
            getToken1: async liquidityPoolNew => {
              let token1_field = liquidityPoolNew.token1_id
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
                    ~entity=Read(entity),
                  )
                  entity
                | None =>
                  Logging.error(`LiquidityPoolNew token1 data not found. Loading associated token from database.
This is likely due to a database corruption. Please reach out to the team on discord.
`)

                  raise(
                    UnableToLoadNonNullableLinkedEntity(
                      "The required linked entity token1 of LiquidityPoolNew is undefined.",
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
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(liquidityPoolWeeklySnapshot) with ID ${id}.`,
              ),
          },
          token: {
            set: entity => {
              inMemoryStore.token->IO.InMemoryStore.Token.set(
                ~key=entity.id,
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
              )
            },
            delete: id =>
              Logging.warn(`[unimplemented delete] can't delete entity(token) with ID ${id}.`),
            bribeRewardToken: bribeRewardToken_Token,
            get: async (id: Types.id) => {
              if optSetOfIds_token->Set.has(id) {
                inMemoryStore.token->IO.InMemoryStore.Token.get(id)
              } else {
                // NOTE: this will still return the value if it exists in the in-memory store (despite the loader not being run).
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
                      ~entity=Set(
                        entity,
                        {
                          chainId,
                          blockNumber: event.blockNumber,
                          logIndex: event.logIndex,
                        },
                      ),
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
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
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
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
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
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
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
                ~entity=Set(
                  entity,
                  {
                    chainId,
                    blockNumber: event.blockNumber,
                    logIndex: event.logIndex,
                  },
                ),
              )
            },
            delete: id =>
              Logging.warn(`[unimplemented delete] can't delete entity(user) with ID ${id}.`),
          },
        }
      }

      {
        logger,
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
  | VotingRewardContract_NotifyRewardWithContext(
      Types.eventLog<Types.VotingRewardContract.NotifyRewardEvent.eventArgs>,
      VotingRewardContract.NotifyRewardEvent.context,
    )

type eventRouterEventAndContext = {
  chainId: int,
  event: eventAndContext,
}
