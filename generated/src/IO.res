module InMemoryStore = {
  type stringHasher<'val> = 'val => string
  type storeState<'entity, 'entityKey> = {
    dict: Js.Dict.t<Types.inMemoryStoreRow<'entity>>,
    hasher: stringHasher<'entityKey>,
  }

  module type StoreItem = {
    type t
    type key
    let hasher: stringHasher<key>
  }

  //Binding used for deep cloning stores in tests
  @val external structuredClone: 'a => 'a = "structuredClone"

  module MakeStore = (StoreItem: StoreItem) => {
    @genType
    type value = StoreItem.t
    @genType
    type key = StoreItem.key
    type t = storeState<value, key>

    let make = (): t => {dict: Js.Dict.empty(), hasher: StoreItem.hasher}

    let set = (self: t, ~key: StoreItem.key, ~entity: Types.entityData<StoreItem.t>) => {
      let getOptEventIdentifier = (entity: Types.entityData<StoreItem.t>) => {
        switch entity {
        | Delete(_, eventIdentifier)
        | Set(_, eventIdentifier) =>
          Some(eventIdentifier)
        | Read(_) => None
        }
      }
      if Config.placeholder_is_near_head_of_chain_or_in_dev_mode {
        let mapKey = key->self.hasher
        let entityData: Types.inMemoryStoreRow<StoreItem.t> = switch self.dict->Js.Dict.get(
          mapKey,
        ) {
        | Some(existingEntityUpdate) =>
          switch entity {
          | Delete(_, eventIdentifier)
          | Set(_, eventIdentifier) =>
            // Use -1 as defaults for now
            let oldEntityIdentifier = getOptEventIdentifier(
              existingEntityUpdate.current,
            )->Belt.Option.getWithDefault({
              chainId: -1,
              blockNumber: -1,
              logIndex: -1,
            })
            if (
              eventIdentifier.blockNumber == oldEntityIdentifier.blockNumber &&
                eventIdentifier.logIndex == oldEntityIdentifier.logIndex
            ) {
              // If it is in the same event, override the current event with the new one
              {
                ...existingEntityUpdate,
                current: entity,
              }
            } else {
              // in a different event, add it to the histor.
              {
                current: entity,
                history: existingEntityUpdate.history->Belt.Array.concat([
                  existingEntityUpdate.current,
                ]),
              }
            }
          | Read(_) => {
              current: entity,
              history: existingEntityUpdate.history,
            }
          }
        | None => {
            current: entity,
            history: [],
          }
        }
        self.dict->Js.Dict.set(mapKey, entityData)
      } else {
        //Wont do for hackathon
        ()
      }
    }

    let get = (self: t, key: StoreItem.key) =>
      self.dict
      ->Js.Dict.get(key->self.hasher)
      ->Belt.Option.flatMap(row => {
        switch row.current {
        | Set(entity, _eventIdentifier) => Some(entity)
        | Delete(_key, _eventid) => None
        | Read(entity) => Some(entity)
        }
      })

    let values = (self: t) => self.dict->Js.Dict.values

    let clone = (self: t) => {
      ...self,
      dict: self.dict->structuredClone,
    }
  }

  module EventSyncState = MakeStore({
    type t = DbFunctions.EventSyncState.eventSyncState
    type key = int
    let hasher = Belt.Int.toString
  })

  @genType
  type rawEventsKey = {
    chainId: int,
    eventId: string,
  }

  module RawEvents = MakeStore({
    type t = Types.rawEventsEntity
    type key = rawEventsKey
    let hasher = (key: key) =>
      EventUtils.getEventIdKeyString(~chainId=key.chainId, ~eventId=key.eventId)
  })

  @genType
  type dynamicContractRegistryKey = {
    chainId: int,
    contractAddress: Ethers.ethAddress,
  }

  module DynamicContractRegistry = MakeStore({
    type t = Types.dynamicContractRegistryEntity
    type key = dynamicContractRegistryKey
    let hasher = ({chainId, contractAddress}) =>
      EventUtils.getContractAddressKeyString(~chainId, ~contractAddress)
  })

  module LiquidityPoolDailySnapshot = MakeStore({
    type t = Types.liquidityPoolDailySnapshotEntity
    type key = string
    let hasher = Obj.magic
  })

  module LiquidityPoolHourlySnapshot = MakeStore({
    type t = Types.liquidityPoolHourlySnapshotEntity
    type key = string
    let hasher = Obj.magic
  })

  module LiquidityPoolNew = MakeStore({
    type t = Types.liquidityPoolNewEntity
    type key = string
    let hasher = Obj.magic
  })

  module LiquidityPoolWeeklySnapshot = MakeStore({
    type t = Types.liquidityPoolWeeklySnapshotEntity
    type key = string
    let hasher = Obj.magic
  })

  module Token = MakeStore({
    type t = Types.tokenEntity
    type key = string
    let hasher = Obj.magic
  })

  module TokenDailySnapshot = MakeStore({
    type t = Types.tokenDailySnapshotEntity
    type key = string
    let hasher = Obj.magic
  })

  module TokenHourlySnapshot = MakeStore({
    type t = Types.tokenHourlySnapshotEntity
    type key = string
    let hasher = Obj.magic
  })

  module TokenWeeklySnapshot = MakeStore({
    type t = Types.tokenWeeklySnapshotEntity
    type key = string
    let hasher = Obj.magic
  })

  module User = MakeStore({
    type t = Types.userEntity
    type key = string
    let hasher = Obj.magic
  })

  @genType
  type t = {
    eventSyncState: EventSyncState.t,
    rawEvents: RawEvents.t,
    dynamicContractRegistry: DynamicContractRegistry.t,
    liquidityPoolDailySnapshot: LiquidityPoolDailySnapshot.t,
    liquidityPoolHourlySnapshot: LiquidityPoolHourlySnapshot.t,
    liquidityPoolNew: LiquidityPoolNew.t,
    liquidityPoolWeeklySnapshot: LiquidityPoolWeeklySnapshot.t,
    token: Token.t,
    tokenDailySnapshot: TokenDailySnapshot.t,
    tokenHourlySnapshot: TokenHourlySnapshot.t,
    tokenWeeklySnapshot: TokenWeeklySnapshot.t,
    user: User.t,
  }

  let make = (): t => {
    eventSyncState: EventSyncState.make(),
    rawEvents: RawEvents.make(),
    dynamicContractRegistry: DynamicContractRegistry.make(),
    liquidityPoolDailySnapshot: LiquidityPoolDailySnapshot.make(),
    liquidityPoolHourlySnapshot: LiquidityPoolHourlySnapshot.make(),
    liquidityPoolNew: LiquidityPoolNew.make(),
    liquidityPoolWeeklySnapshot: LiquidityPoolWeeklySnapshot.make(),
    token: Token.make(),
    tokenDailySnapshot: TokenDailySnapshot.make(),
    tokenHourlySnapshot: TokenHourlySnapshot.make(),
    tokenWeeklySnapshot: TokenWeeklySnapshot.make(),
    user: User.make(),
  }

  let clone = (self: t) => {
    eventSyncState: self.eventSyncState->EventSyncState.clone,
    rawEvents: self.rawEvents->RawEvents.clone,
    dynamicContractRegistry: self.dynamicContractRegistry->DynamicContractRegistry.clone,
    liquidityPoolDailySnapshot: self.liquidityPoolDailySnapshot->LiquidityPoolDailySnapshot.clone,
    liquidityPoolHourlySnapshot: self.liquidityPoolHourlySnapshot->LiquidityPoolHourlySnapshot.clone,
    liquidityPoolNew: self.liquidityPoolNew->LiquidityPoolNew.clone,
    liquidityPoolWeeklySnapshot: self.liquidityPoolWeeklySnapshot->LiquidityPoolWeeklySnapshot.clone,
    token: self.token->Token.clone,
    tokenDailySnapshot: self.tokenDailySnapshot->TokenDailySnapshot.clone,
    tokenHourlySnapshot: self.tokenHourlySnapshot->TokenHourlySnapshot.clone,
    tokenWeeklySnapshot: self.tokenWeeklySnapshot->TokenWeeklySnapshot.clone,
    user: self.user->User.clone,
  }
}

module LoadLayer = {
  /**The ids to load for a particular entity*/
  type idsToLoad = Belt.Set.String.t

  /**
  A round of entities to load from the DB. Depending on what entities come back
  and the dataLoaded "actions" that get run after the entities are loaded up. It
  could mean another load layer is created based of values that are returned
  */
  type rec t = {
    //A an array of getters to run after the entities with idsToLoad have been loaded
    dataLoadedActionsGetters: dataLoadedActionsGetters,
    //A unique list of ids that need to be loaded for entity liquidityPoolDailySnapshot
    liquidityPoolDailySnapshotIdsToLoad: idsToLoad,
    //A unique list of ids that need to be loaded for entity liquidityPoolHourlySnapshot
    liquidityPoolHourlySnapshotIdsToLoad: idsToLoad,
    //A unique list of ids that need to be loaded for entity liquidityPoolNew
    liquidityPoolNewIdsToLoad: idsToLoad,
    //A unique list of ids that need to be loaded for entity liquidityPoolWeeklySnapshot
    liquidityPoolWeeklySnapshotIdsToLoad: idsToLoad,
    //A unique list of ids that need to be loaded for entity token
    tokenIdsToLoad: idsToLoad,
    //A unique list of ids that need to be loaded for entity tokenDailySnapshot
    tokenDailySnapshotIdsToLoad: idsToLoad,
    //A unique list of ids that need to be loaded for entity tokenHourlySnapshot
    tokenHourlySnapshotIdsToLoad: idsToLoad,
    //A unique list of ids that need to be loaded for entity tokenWeeklySnapshot
    tokenWeeklySnapshotIdsToLoad: idsToLoad,
    //A unique list of ids that need to be loaded for entity user
    userIdsToLoad: idsToLoad,
  }
  //An action that gets run after the data is loaded in from the db to the in memory store
  //the action will derive values from the loaded data and update the next load layer
  and dataLoadedAction = t => t
  //A getter function that returns an array of actions that need to be run
  //Actions will fetch values from the in memory store and update a load layer
  and dataLoadedActionsGetter = unit => array<dataLoadedAction>
  //An array of getter functions for dataLoadedActions
  and dataLoadedActionsGetters = array<dataLoadedActionsGetter>

  /**Instantiates a load layer*/
  let emptyLoadLayer = () => {
    liquidityPoolDailySnapshotIdsToLoad: Belt.Set.String.empty,
    liquidityPoolHourlySnapshotIdsToLoad: Belt.Set.String.empty,
    liquidityPoolNewIdsToLoad: Belt.Set.String.empty,
    liquidityPoolWeeklySnapshotIdsToLoad: Belt.Set.String.empty,
    tokenIdsToLoad: Belt.Set.String.empty,
    tokenDailySnapshotIdsToLoad: Belt.Set.String.empty,
    tokenHourlySnapshotIdsToLoad: Belt.Set.String.empty,
    tokenWeeklySnapshotIdsToLoad: Belt.Set.String.empty,
    userIdsToLoad: Belt.Set.String.empty,
    dataLoadedActionsGetters: [],
  }

  /* Helper to append an ID to load for a given entity to the loadLayer */
  let extendIdsToLoad = (idsToLoad: idsToLoad, entityId: Types.id): idsToLoad =>
    idsToLoad->Belt.Set.String.add(entityId)

  /* Helper to append a getter for DataLoadedActions to load for a given entity to the loadLayer */
  let extendDataLoadedActionsGetters = (
    dataLoadedActionsGetters: dataLoadedActionsGetters,
    newDataLoadedActionsGetters: dataLoadedActionsGetters,
  ): dataLoadedActionsGetters =>
    dataLoadedActionsGetters->Belt.Array.concat(newDataLoadedActionsGetters)
}

//remove warning 39 for unused "rec" flag in case of no other related loaders
/**
Loader functions for each entity. The loader function extends a load layer with the given id and config.
*/
@warning("-39")
let rec liquidityPoolDailySnapshotLinkedEntityLoader = (
  loadLayer: LoadLayer.t,
  ~entityId: string,
  ~inMemoryStore: InMemoryStore.t,
  ~liquidityPoolDailySnapshotLoaderConfig: Types.liquidityPoolDailySnapshotLoaderConfig,
): LoadLayer.t => {
  //No dataLoaded actions need to happen on the in memory
  //since there are no relational non-derivedfrom params
  let _ = inMemoryStore //ignore inMemoryStore and stop warning

  //In this case the "liquidityPoolDailySnapshotLoaderConfig" type is a boolean.
  if !liquidityPoolDailySnapshotLoaderConfig {
    //If liquidityPoolDailySnapshotLoaderConfig is false, don't load the entity
    //simply return the current load layer
    loadLayer
  } else {
    //If liquidityPoolDailySnapshotLoaderConfig is true,
    //extend the entity ids to load field
    //There can be no dataLoadedActionsGetters to add since this type does not contain
    //any non derived from relational params
    {
      ...loadLayer,
      liquidityPoolDailySnapshotIdsToLoad: loadLayer.liquidityPoolDailySnapshotIdsToLoad->LoadLayer.extendIdsToLoad(
        entityId,
      ),
    }
  }
}
@warning("-27")
and liquidityPoolHourlySnapshotLinkedEntityLoader = (
  loadLayer: LoadLayer.t,
  ~entityId: string,
  ~inMemoryStore: InMemoryStore.t,
  ~liquidityPoolHourlySnapshotLoaderConfig: Types.liquidityPoolHourlySnapshotLoaderConfig,
): LoadLayer.t => {
  //No dataLoaded actions need to happen on the in memory
  //since there are no relational non-derivedfrom params
  let _ = inMemoryStore //ignore inMemoryStore and stop warning

  //In this case the "liquidityPoolHourlySnapshotLoaderConfig" type is a boolean.
  if !liquidityPoolHourlySnapshotLoaderConfig {
    //If liquidityPoolHourlySnapshotLoaderConfig is false, don't load the entity
    //simply return the current load layer
    loadLayer
  } else {
    //If liquidityPoolHourlySnapshotLoaderConfig is true,
    //extend the entity ids to load field
    //There can be no dataLoadedActionsGetters to add since this type does not contain
    //any non derived from relational params
    {
      ...loadLayer,
      liquidityPoolHourlySnapshotIdsToLoad: loadLayer.liquidityPoolHourlySnapshotIdsToLoad->LoadLayer.extendIdsToLoad(
        entityId,
      ),
    }
  }
}
@warning("-27")
and liquidityPoolNewLinkedEntityLoader = (
  loadLayer: LoadLayer.t,
  ~entityId: string,
  ~inMemoryStore: InMemoryStore.t,
  ~liquidityPoolNewLoaderConfig: Types.liquidityPoolNewLoaderConfig,
): LoadLayer.t => {
  //An array of getter functions for dataLoaded actions that will be run
  //after the current load layer is executed

  let dataLoadedActionsGetters = [
    liquidityPoolNewLoaderConfig.loadToken0->Belt.Option.map(tokenLoaderConfig => {
      () =>
        inMemoryStore.liquidityPoolNew
        ->InMemoryStore.LiquidityPoolNew.get(entityId)
        ->Belt.Option.mapWithDefault([], entity => {
          //getLoader can be used to map arrays of ids, optional ids or single ids
          let getLoader = entityId =>
            tokenLinkedEntityLoader(~tokenLoaderConfig, ~entityId, ~inMemoryStore)
          //In this case entity.token0 is a single value. But we
          //still pass back an array of actions in order for cases where the related entity is an array of ids
          [entity.token0_id->getLoader]
        })
    }),
    liquidityPoolNewLoaderConfig.loadToken1->Belt.Option.map(tokenLoaderConfig => {
      () =>
        inMemoryStore.liquidityPoolNew
        ->InMemoryStore.LiquidityPoolNew.get(entityId)
        ->Belt.Option.mapWithDefault([], entity => {
          //getLoader can be used to map arrays of ids, optional ids or single ids
          let getLoader = entityId =>
            tokenLinkedEntityLoader(~tokenLoaderConfig, ~entityId, ~inMemoryStore)
          //In this case entity.token1 is a single value. But we
          //still pass back an array of actions in order for cases where the related entity is an array of ids
          [entity.token1_id->getLoader]
        })
    }),
  ]->Belt.Array.keepMap(v => v)

  {
    ...loadLayer,
    liquidityPoolNewIdsToLoad: loadLayer.liquidityPoolNewIdsToLoad->LoadLayer.extendIdsToLoad(
      entityId,
    ),
    dataLoadedActionsGetters: loadLayer.dataLoadedActionsGetters->LoadLayer.extendDataLoadedActionsGetters(
      dataLoadedActionsGetters,
    ),
  }
}
@warning("-27")
and liquidityPoolWeeklySnapshotLinkedEntityLoader = (
  loadLayer: LoadLayer.t,
  ~entityId: string,
  ~inMemoryStore: InMemoryStore.t,
  ~liquidityPoolWeeklySnapshotLoaderConfig: Types.liquidityPoolWeeklySnapshotLoaderConfig,
): LoadLayer.t => {
  //No dataLoaded actions need to happen on the in memory
  //since there are no relational non-derivedfrom params
  let _ = inMemoryStore //ignore inMemoryStore and stop warning

  //In this case the "liquidityPoolWeeklySnapshotLoaderConfig" type is a boolean.
  if !liquidityPoolWeeklySnapshotLoaderConfig {
    //If liquidityPoolWeeklySnapshotLoaderConfig is false, don't load the entity
    //simply return the current load layer
    loadLayer
  } else {
    //If liquidityPoolWeeklySnapshotLoaderConfig is true,
    //extend the entity ids to load field
    //There can be no dataLoadedActionsGetters to add since this type does not contain
    //any non derived from relational params
    {
      ...loadLayer,
      liquidityPoolWeeklySnapshotIdsToLoad: loadLayer.liquidityPoolWeeklySnapshotIdsToLoad->LoadLayer.extendIdsToLoad(
        entityId,
      ),
    }
  }
}
@warning("-27")
and tokenLinkedEntityLoader = (
  loadLayer: LoadLayer.t,
  ~entityId: string,
  ~inMemoryStore: InMemoryStore.t,
  ~tokenLoaderConfig: Types.tokenLoaderConfig,
): LoadLayer.t => {
  //No dataLoaded actions need to happen on the in memory
  //since there are no relational non-derivedfrom params
  let _ = inMemoryStore //ignore inMemoryStore and stop warning

  //In this case the "tokenLoaderConfig" type is a boolean.
  if !tokenLoaderConfig {
    //If tokenLoaderConfig is false, don't load the entity
    //simply return the current load layer
    loadLayer
  } else {
    //If tokenLoaderConfig is true,
    //extend the entity ids to load field
    //There can be no dataLoadedActionsGetters to add since this type does not contain
    //any non derived from relational params
    {
      ...loadLayer,
      tokenIdsToLoad: loadLayer.tokenIdsToLoad->LoadLayer.extendIdsToLoad(entityId),
    }
  }
}
@warning("-27")
and tokenDailySnapshotLinkedEntityLoader = (
  loadLayer: LoadLayer.t,
  ~entityId: string,
  ~inMemoryStore: InMemoryStore.t,
  ~tokenDailySnapshotLoaderConfig: Types.tokenDailySnapshotLoaderConfig,
): LoadLayer.t => {
  //No dataLoaded actions need to happen on the in memory
  //since there are no relational non-derivedfrom params
  let _ = inMemoryStore //ignore inMemoryStore and stop warning

  //In this case the "tokenDailySnapshotLoaderConfig" type is a boolean.
  if !tokenDailySnapshotLoaderConfig {
    //If tokenDailySnapshotLoaderConfig is false, don't load the entity
    //simply return the current load layer
    loadLayer
  } else {
    //If tokenDailySnapshotLoaderConfig is true,
    //extend the entity ids to load field
    //There can be no dataLoadedActionsGetters to add since this type does not contain
    //any non derived from relational params
    {
      ...loadLayer,
      tokenDailySnapshotIdsToLoad: loadLayer.tokenDailySnapshotIdsToLoad->LoadLayer.extendIdsToLoad(
        entityId,
      ),
    }
  }
}
@warning("-27")
and tokenHourlySnapshotLinkedEntityLoader = (
  loadLayer: LoadLayer.t,
  ~entityId: string,
  ~inMemoryStore: InMemoryStore.t,
  ~tokenHourlySnapshotLoaderConfig: Types.tokenHourlySnapshotLoaderConfig,
): LoadLayer.t => {
  //No dataLoaded actions need to happen on the in memory
  //since there are no relational non-derivedfrom params
  let _ = inMemoryStore //ignore inMemoryStore and stop warning

  //In this case the "tokenHourlySnapshotLoaderConfig" type is a boolean.
  if !tokenHourlySnapshotLoaderConfig {
    //If tokenHourlySnapshotLoaderConfig is false, don't load the entity
    //simply return the current load layer
    loadLayer
  } else {
    //If tokenHourlySnapshotLoaderConfig is true,
    //extend the entity ids to load field
    //There can be no dataLoadedActionsGetters to add since this type does not contain
    //any non derived from relational params
    {
      ...loadLayer,
      tokenHourlySnapshotIdsToLoad: loadLayer.tokenHourlySnapshotIdsToLoad->LoadLayer.extendIdsToLoad(
        entityId,
      ),
    }
  }
}
@warning("-27")
and tokenWeeklySnapshotLinkedEntityLoader = (
  loadLayer: LoadLayer.t,
  ~entityId: string,
  ~inMemoryStore: InMemoryStore.t,
  ~tokenWeeklySnapshotLoaderConfig: Types.tokenWeeklySnapshotLoaderConfig,
): LoadLayer.t => {
  //No dataLoaded actions need to happen on the in memory
  //since there are no relational non-derivedfrom params
  let _ = inMemoryStore //ignore inMemoryStore and stop warning

  //In this case the "tokenWeeklySnapshotLoaderConfig" type is a boolean.
  if !tokenWeeklySnapshotLoaderConfig {
    //If tokenWeeklySnapshotLoaderConfig is false, don't load the entity
    //simply return the current load layer
    loadLayer
  } else {
    //If tokenWeeklySnapshotLoaderConfig is true,
    //extend the entity ids to load field
    //There can be no dataLoadedActionsGetters to add since this type does not contain
    //any non derived from relational params
    {
      ...loadLayer,
      tokenWeeklySnapshotIdsToLoad: loadLayer.tokenWeeklySnapshotIdsToLoad->LoadLayer.extendIdsToLoad(
        entityId,
      ),
    }
  }
}
@warning("-27")
and userLinkedEntityLoader = (
  loadLayer: LoadLayer.t,
  ~entityId: string,
  ~inMemoryStore: InMemoryStore.t,
  ~userLoaderConfig: Types.userLoaderConfig,
): LoadLayer.t => {
  //No dataLoaded actions need to happen on the in memory
  //since there are no relational non-derivedfrom params
  let _ = inMemoryStore //ignore inMemoryStore and stop warning

  //In this case the "userLoaderConfig" type is a boolean.
  if !userLoaderConfig {
    //If userLoaderConfig is false, don't load the entity
    //simply return the current load layer
    loadLayer
  } else {
    //If userLoaderConfig is true,
    //extend the entity ids to load field
    //There can be no dataLoadedActionsGetters to add since this type does not contain
    //any non derived from relational params
    {
      ...loadLayer,
      userIdsToLoad: loadLayer.userIdsToLoad->LoadLayer.extendIdsToLoad(entityId),
    }
  }
}

/**
Creates and populates a load layer with the current in memory store and an array of entityRead variants
*/
let getLoadLayer = (~entityBatch: array<Types.entityRead>, ~inMemoryStore) => {
  entityBatch->Belt.Array.reduce(LoadLayer.emptyLoadLayer(), (loadLayer, readEntity) => {
    switch readEntity {
    | LiquidityPoolDailySnapshotRead(entityId) =>
      loadLayer->liquidityPoolDailySnapshotLinkedEntityLoader(
        ~entityId,
        ~inMemoryStore,
        ~liquidityPoolDailySnapshotLoaderConfig=true,
      )
    | LiquidityPoolHourlySnapshotRead(entityId) =>
      loadLayer->liquidityPoolHourlySnapshotLinkedEntityLoader(
        ~entityId,
        ~inMemoryStore,
        ~liquidityPoolHourlySnapshotLoaderConfig=true,
      )
    | LiquidityPoolNewRead(entityId, liquidityPoolNewLoaderConfig) =>
      loadLayer->liquidityPoolNewLinkedEntityLoader(
        ~entityId,
        ~inMemoryStore,
        ~liquidityPoolNewLoaderConfig,
      )
    | LiquidityPoolWeeklySnapshotRead(entityId) =>
      loadLayer->liquidityPoolWeeklySnapshotLinkedEntityLoader(
        ~entityId,
        ~inMemoryStore,
        ~liquidityPoolWeeklySnapshotLoaderConfig=true,
      )
    | TokenRead(entityId) =>
      loadLayer->tokenLinkedEntityLoader(~entityId, ~inMemoryStore, ~tokenLoaderConfig=true)
    | TokenDailySnapshotRead(entityId) =>
      loadLayer->tokenDailySnapshotLinkedEntityLoader(
        ~entityId,
        ~inMemoryStore,
        ~tokenDailySnapshotLoaderConfig=true,
      )
    | TokenHourlySnapshotRead(entityId) =>
      loadLayer->tokenHourlySnapshotLinkedEntityLoader(
        ~entityId,
        ~inMemoryStore,
        ~tokenHourlySnapshotLoaderConfig=true,
      )
    | TokenWeeklySnapshotRead(entityId) =>
      loadLayer->tokenWeeklySnapshotLinkedEntityLoader(
        ~entityId,
        ~inMemoryStore,
        ~tokenWeeklySnapshotLoaderConfig=true,
      )
    | UserRead(entityId) =>
      loadLayer->userLinkedEntityLoader(~entityId, ~inMemoryStore, ~userLoaderConfig=true)
    }
  })
}

/**
Represents whether a deeper layer needs to be executed or whether the last layer
has been executed
*/
type nextLayer = NextLayer(LoadLayer.t) | LastLayer

let getNextLayer = (~loadLayer: LoadLayer.t) =>
  switch loadLayer.dataLoadedActionsGetters {
  | [] => LastLayer
  | dataLoadedActionsGetters =>
    dataLoadedActionsGetters
    ->Belt.Array.reduce(LoadLayer.emptyLoadLayer(), (loadLayer, getLoadedActions) => {
      //call getLoadedActions returns array of of actions to run against the load layer
      getLoadedActions()->Belt.Array.reduce(loadLayer, (loadLayer, action) => {
        action(loadLayer)
      })
    })
    ->NextLayer
  }

/**
Used for composing a loadlayer executor
*/
type entityExecutor<'executorRes> = {
  idsToLoad: LoadLayer.idsToLoad,
  executor: LoadLayer.idsToLoad => 'executorRes,
}

/**
Compose an execute load layer function. Used to compose an executor
for a postgres db or a mock db in the testing framework.
*/
let executeLoadLayerComposer = (
  ~entityExecutors: array<entityExecutor<'exectuorRes>>,
  ~handleResponses: array<'exectuorRes> => 'nextLoadlayer,
) => {
  entityExecutors
  ->Belt.Array.map(({idsToLoad, executor}) => {
    idsToLoad->executor
  })
  ->handleResponses
}

/**Recursively load layers with execute fn composer. Can be used with async or sync functions*/
let rec executeNestedLoadLayersComposer = (
  ~loadLayer,
  ~inMemoryStore,
  //Could be an execution function that is async or sync
  ~executeLoadLayerFn,
  //A call back function, for async or sync
  ~then,
  //Unit value, either wrapped in a promise or not
  ~unit,
) => {
  executeLoadLayerFn(~loadLayer, ~inMemoryStore)->then(res =>
    switch res {
    | LastLayer => unit
    | NextLayer(loadLayer) =>
      executeNestedLoadLayersComposer(~loadLayer, ~inMemoryStore, ~executeLoadLayerFn, ~then, ~unit)
    }
  )
}

/**Load all entities in the entity batch from the db to the inMemoryStore */
let loadEntitiesToInMemStoreComposer = (
  ~entityBatch,
  ~inMemoryStore,
  ~executeLoadLayerFn,
  ~then,
  ~unit,
) => {
  executeNestedLoadLayersComposer(
    ~inMemoryStore,
    ~loadLayer=getLoadLayer(~inMemoryStore, ~entityBatch),
    ~executeLoadLayerFn,
    ~then,
    ~unit,
  )
}

let makeEntityExecuterComposer = (
  ~idsToLoad,
  ~dbReadFn,
  ~inMemStoreSetFn,
  ~store,
  ~getEntiyId,
  ~unit,
  ~then,
) => {
  idsToLoad,
  executor: idsToLoad => {
    switch idsToLoad->Belt.Set.String.toArray {
    | [] => unit //Check if there are values so we don't create an unnecessary empty query
    | idsToLoad =>
      idsToLoad
      ->dbReadFn
      ->then(entities =>
        entities->Belt.Array.forEach(entity => {
          store->inMemStoreSetFn(~key=entity->getEntiyId, ~entity=Types.Read(entity))
        })
      )
    }
  },
}

/**
Specifically create an sql executor with async functionality
*/
let makeSqlEntityExecuter = (~idsToLoad, ~dbReadFn, ~inMemStoreSetFn, ~store, ~getEntiyId) => {
  makeEntityExecuterComposer(
    ~dbReadFn=DbFunctions.sql->dbReadFn,
    ~idsToLoad,
    ~getEntiyId,
    ~store,
    ~inMemStoreSetFn,
    ~then=Promise.thenResolve,
    ~unit=Promise.resolve(),
  )
}

/**
Executes a single load layer using the async sql functions
*/
let executeSqlLoadLayer = (~loadLayer: LoadLayer.t, ~inMemoryStore: InMemoryStore.t) => {
  let entityExecutors = [
    makeSqlEntityExecuter(
      ~idsToLoad=loadLayer.liquidityPoolDailySnapshotIdsToLoad,
      ~dbReadFn=DbFunctions.LiquidityPoolDailySnapshot.readEntities,
      ~inMemStoreSetFn=InMemoryStore.LiquidityPoolDailySnapshot.set,
      ~store=inMemoryStore.liquidityPoolDailySnapshot,
      ~getEntiyId=entity => entity.id,
    ),
    makeSqlEntityExecuter(
      ~idsToLoad=loadLayer.liquidityPoolHourlySnapshotIdsToLoad,
      ~dbReadFn=DbFunctions.LiquidityPoolHourlySnapshot.readEntities,
      ~inMemStoreSetFn=InMemoryStore.LiquidityPoolHourlySnapshot.set,
      ~store=inMemoryStore.liquidityPoolHourlySnapshot,
      ~getEntiyId=entity => entity.id,
    ),
    makeSqlEntityExecuter(
      ~idsToLoad=loadLayer.liquidityPoolNewIdsToLoad,
      ~dbReadFn=DbFunctions.LiquidityPoolNew.readEntities,
      ~inMemStoreSetFn=InMemoryStore.LiquidityPoolNew.set,
      ~store=inMemoryStore.liquidityPoolNew,
      ~getEntiyId=entity => entity.id,
    ),
    makeSqlEntityExecuter(
      ~idsToLoad=loadLayer.liquidityPoolWeeklySnapshotIdsToLoad,
      ~dbReadFn=DbFunctions.LiquidityPoolWeeklySnapshot.readEntities,
      ~inMemStoreSetFn=InMemoryStore.LiquidityPoolWeeklySnapshot.set,
      ~store=inMemoryStore.liquidityPoolWeeklySnapshot,
      ~getEntiyId=entity => entity.id,
    ),
    makeSqlEntityExecuter(
      ~idsToLoad=loadLayer.tokenIdsToLoad,
      ~dbReadFn=DbFunctions.Token.readEntities,
      ~inMemStoreSetFn=InMemoryStore.Token.set,
      ~store=inMemoryStore.token,
      ~getEntiyId=entity => entity.id,
    ),
    makeSqlEntityExecuter(
      ~idsToLoad=loadLayer.tokenDailySnapshotIdsToLoad,
      ~dbReadFn=DbFunctions.TokenDailySnapshot.readEntities,
      ~inMemStoreSetFn=InMemoryStore.TokenDailySnapshot.set,
      ~store=inMemoryStore.tokenDailySnapshot,
      ~getEntiyId=entity => entity.id,
    ),
    makeSqlEntityExecuter(
      ~idsToLoad=loadLayer.tokenHourlySnapshotIdsToLoad,
      ~dbReadFn=DbFunctions.TokenHourlySnapshot.readEntities,
      ~inMemStoreSetFn=InMemoryStore.TokenHourlySnapshot.set,
      ~store=inMemoryStore.tokenHourlySnapshot,
      ~getEntiyId=entity => entity.id,
    ),
    makeSqlEntityExecuter(
      ~idsToLoad=loadLayer.tokenWeeklySnapshotIdsToLoad,
      ~dbReadFn=DbFunctions.TokenWeeklySnapshot.readEntities,
      ~inMemStoreSetFn=InMemoryStore.TokenWeeklySnapshot.set,
      ~store=inMemoryStore.tokenWeeklySnapshot,
      ~getEntiyId=entity => entity.id,
    ),
    makeSqlEntityExecuter(
      ~idsToLoad=loadLayer.userIdsToLoad,
      ~dbReadFn=DbFunctions.User.readEntities,
      ~inMemStoreSetFn=InMemoryStore.User.set,
      ~store=inMemoryStore.user,
      ~getEntiyId=entity => entity.id,
    ),
  ]
  let handleResponses = responses => {
    responses
    ->Promise.all
    ->Promise.thenResolve(_ => {
      getNextLayer(~loadLayer)
    })
  }

  executeLoadLayerComposer(~entityExecutors, ~handleResponses)
}

/**Execute loading of entities using sql*/
let loadEntitiesToInMemStore = (~entityBatch, ~inMemoryStore) => {
  loadEntitiesToInMemStoreComposer(
    ~inMemoryStore,
    ~entityBatch,
    ~executeLoadLayerFn=executeSqlLoadLayer,
    ~then=Promise.then,
    ~unit=Promise.resolve(),
  )
}

let executeSet = (
  sql: Postgres.sql,
  ~rows: array<Types.inMemoryStoreRow<'a>>,
  ~dbFunction: (Postgres.sql, array<'b>) => promise<unit>,
) => {
  let executeSets = rows->Belt.Array.keepMap(row =>
    switch row.current {
    | Set(entity, _) => Some(entity)
    | _ => None
    }
  )

  if executeSets->Array.length > 0 {
    sql->dbFunction(executeSets)
  } else {
    Promise.resolve()
  }
}

let executeDelete = (
  sql: Postgres.sql,
  ~rows: array<Types.inMemoryStoreRow<'a>>,
  ~dbFunction: (Postgres.sql, array<'b>) => promise<unit>,
) => {
  // TODO: implement me please (after hackathon)
  let _ = rows
  let _ = sql
  let _ = dbFunction
  Promise.resolve()
}

let executeSetSchemaEntity = (
  sql: Postgres.sql,
  ~rows: array<Types.inMemoryStoreRow<'a>>,
  ~dbFunction: (Postgres.sql, array<'b>) => promise<unit>,
  ~entityEncoder,
  ~entityType,
) => {
  let historyArrayWithPrev = ref([])
  let historyArrayWithoutPrev = ref([])

  let executeSets = rows->Belt.Array.keepMap(row =>
    switch row.current {
    | Set(entity, _eventIdentifier) => {
        let _ =
          row.history
          ->Belt.Array.concat([row.current])
          ->Belt.Array.reduce(None, (optPrev: option<(int, int)>, entity) => {
            let processEntity = (
              eventIdentifier: Types.eventIdentifier,
              entity_id,
              params: option<string>,
            ) => {
              switch optPrev {
              | Some((previous_block_number, previous_log_index)) =>
                let historyItem: DbFunctions.entityHistoryItem = {
                  chain_id: eventIdentifier.chainId,
                  block_number: eventIdentifier.blockNumber,
                  previous_block_number: Some(previous_block_number),
                  previous_log_index: Some(previous_log_index),
                  log_index: eventIdentifier.logIndex,
                  transaction_hash: "string",
                  entity_type: entityType,
                  entity_id,
                  params,
                }
                historyArrayWithPrev :=
                  historyArrayWithPrev.contents->Belt.Array.concat([historyItem])
              | None =>
                let historyItem: DbFunctions.entityHistoryItem = {
                  chain_id: eventIdentifier.chainId,
                  block_number: eventIdentifier.blockNumber,
                  previous_block_number: None,
                  previous_log_index: None,
                  log_index: eventIdentifier.logIndex,
                  transaction_hash: "string",
                  entity_type: entityType,
                  entity_id,
                  params,
                }
                historyArrayWithoutPrev :=
                  historyArrayWithoutPrev.contents->Belt.Array.concat([historyItem])
              }

              Some((eventIdentifier.blockNumber, eventIdentifier.logIndex))
            }
            switch entity {
            | Set(entity, eventIdentifier) =>
              processEntity(
                (eventIdentifier: Types.eventIdentifier),
                (entity->Obj.magic)["id"],
                Some(entity->entityEncoder->Js.Json.stringify),
              )
            | Delete(entityId, eventIdentifier) =>
              processEntity((eventIdentifier: Types.eventIdentifier), entityId, None)
            | Read(_) =>
              Js.log("This IS an impossible state")
              None
            }
          })
        Some(entity->entityEncoder)
      }
    | _ => None
    }
  )

  if executeSets->Array.length > 0 {
    [
      sql->dbFunction(executeSets),
      sql->DbFunctions.EntityHistory.batchSet(
        ~withPrev=historyArrayWithPrev.contents,
        ~withoutPrev=historyArrayWithoutPrev.contents,
      ),
    ]
    ->Promise.all
    ->Promise.thenResolve(_ => ())
  } else {
    Promise.resolve()
  }
}

let executeBatch = async (sql, ~inMemoryStore: InMemoryStore.t) => {
  let setEventSyncState = executeSet(
    ~dbFunction=DbFunctions.EventSyncState.batchSet,
    ~rows=inMemoryStore.eventSyncState->InMemoryStore.EventSyncState.values,
  )

  let setRawEvents = executeSet(
    ~dbFunction=DbFunctions.RawEvents.batchSet,
    ~rows=inMemoryStore.rawEvents->InMemoryStore.RawEvents.values,
  )

  let setDynamicContracts = executeSet(
    ~dbFunction=DbFunctions.DynamicContractRegistry.batchSet,
    ~rows=inMemoryStore.dynamicContractRegistry->InMemoryStore.DynamicContractRegistry.values,
  )

  let deleteLiquidityPoolDailySnapshots = executeDelete(
    ~dbFunction=DbFunctions.LiquidityPoolDailySnapshot.batchDelete,
    ~rows=inMemoryStore.liquidityPoolDailySnapshot->InMemoryStore.LiquidityPoolDailySnapshot.values,
  )

  let setLiquidityPoolDailySnapshots = executeSetSchemaEntity(
    ~dbFunction=DbFunctions.LiquidityPoolDailySnapshot.batchSet,
    ~rows=inMemoryStore.liquidityPoolDailySnapshot->InMemoryStore.LiquidityPoolDailySnapshot.values,
    ~entityEncoder=Types.liquidityPoolDailySnapshotEntity_encode,
    ~entityType="LiquidityPoolDailySnapshot",
  )

  let deleteLiquidityPoolHourlySnapshots = executeDelete(
    ~dbFunction=DbFunctions.LiquidityPoolHourlySnapshot.batchDelete,
    ~rows=inMemoryStore.liquidityPoolHourlySnapshot->InMemoryStore.LiquidityPoolHourlySnapshot.values,
  )

  let setLiquidityPoolHourlySnapshots = executeSetSchemaEntity(
    ~dbFunction=DbFunctions.LiquidityPoolHourlySnapshot.batchSet,
    ~rows=inMemoryStore.liquidityPoolHourlySnapshot->InMemoryStore.LiquidityPoolHourlySnapshot.values,
    ~entityEncoder=Types.liquidityPoolHourlySnapshotEntity_encode,
    ~entityType="LiquidityPoolHourlySnapshot",
  )

  let deleteLiquidityPoolNews = executeDelete(
    ~dbFunction=DbFunctions.LiquidityPoolNew.batchDelete,
    ~rows=inMemoryStore.liquidityPoolNew->InMemoryStore.LiquidityPoolNew.values,
  )

  let setLiquidityPoolNews = executeSetSchemaEntity(
    ~dbFunction=DbFunctions.LiquidityPoolNew.batchSet,
    ~rows=inMemoryStore.liquidityPoolNew->InMemoryStore.LiquidityPoolNew.values,
    ~entityEncoder=Types.liquidityPoolNewEntity_encode,
    ~entityType="LiquidityPoolNew",
  )

  let deleteLiquidityPoolWeeklySnapshots = executeDelete(
    ~dbFunction=DbFunctions.LiquidityPoolWeeklySnapshot.batchDelete,
    ~rows=inMemoryStore.liquidityPoolWeeklySnapshot->InMemoryStore.LiquidityPoolWeeklySnapshot.values,
  )

  let setLiquidityPoolWeeklySnapshots = executeSetSchemaEntity(
    ~dbFunction=DbFunctions.LiquidityPoolWeeklySnapshot.batchSet,
    ~rows=inMemoryStore.liquidityPoolWeeklySnapshot->InMemoryStore.LiquidityPoolWeeklySnapshot.values,
    ~entityEncoder=Types.liquidityPoolWeeklySnapshotEntity_encode,
    ~entityType="LiquidityPoolWeeklySnapshot",
  )

  let deleteTokens = executeDelete(
    ~dbFunction=DbFunctions.Token.batchDelete,
    ~rows=inMemoryStore.token->InMemoryStore.Token.values,
  )

  let setTokens = executeSetSchemaEntity(
    ~dbFunction=DbFunctions.Token.batchSet,
    ~rows=inMemoryStore.token->InMemoryStore.Token.values,
    ~entityEncoder=Types.tokenEntity_encode,
    ~entityType="Token",
  )

  let deleteTokenDailySnapshots = executeDelete(
    ~dbFunction=DbFunctions.TokenDailySnapshot.batchDelete,
    ~rows=inMemoryStore.tokenDailySnapshot->InMemoryStore.TokenDailySnapshot.values,
  )

  let setTokenDailySnapshots = executeSetSchemaEntity(
    ~dbFunction=DbFunctions.TokenDailySnapshot.batchSet,
    ~rows=inMemoryStore.tokenDailySnapshot->InMemoryStore.TokenDailySnapshot.values,
    ~entityEncoder=Types.tokenDailySnapshotEntity_encode,
    ~entityType="TokenDailySnapshot",
  )

  let deleteTokenHourlySnapshots = executeDelete(
    ~dbFunction=DbFunctions.TokenHourlySnapshot.batchDelete,
    ~rows=inMemoryStore.tokenHourlySnapshot->InMemoryStore.TokenHourlySnapshot.values,
  )

  let setTokenHourlySnapshots = executeSetSchemaEntity(
    ~dbFunction=DbFunctions.TokenHourlySnapshot.batchSet,
    ~rows=inMemoryStore.tokenHourlySnapshot->InMemoryStore.TokenHourlySnapshot.values,
    ~entityEncoder=Types.tokenHourlySnapshotEntity_encode,
    ~entityType="TokenHourlySnapshot",
  )

  let deleteTokenWeeklySnapshots = executeDelete(
    ~dbFunction=DbFunctions.TokenWeeklySnapshot.batchDelete,
    ~rows=inMemoryStore.tokenWeeklySnapshot->InMemoryStore.TokenWeeklySnapshot.values,
  )

  let setTokenWeeklySnapshots = executeSetSchemaEntity(
    ~dbFunction=DbFunctions.TokenWeeklySnapshot.batchSet,
    ~rows=inMemoryStore.tokenWeeklySnapshot->InMemoryStore.TokenWeeklySnapshot.values,
    ~entityEncoder=Types.tokenWeeklySnapshotEntity_encode,
    ~entityType="TokenWeeklySnapshot",
  )

  let deleteUsers = executeDelete(
    ~dbFunction=DbFunctions.User.batchDelete,
    ~rows=inMemoryStore.user->InMemoryStore.User.values,
  )

  let setUsers = executeSetSchemaEntity(
    ~dbFunction=DbFunctions.User.batchSet,
    ~rows=inMemoryStore.user->InMemoryStore.User.values,
    ~entityEncoder=Types.userEntity_encode,
    ~entityType="User",
  )

  let res = await sql->Postgres.beginSql(sql => {
    [
      setEventSyncState,
      setRawEvents,
      setDynamicContracts,
      deleteLiquidityPoolDailySnapshots,
      setLiquidityPoolDailySnapshots,
      deleteLiquidityPoolHourlySnapshots,
      setLiquidityPoolHourlySnapshots,
      deleteLiquidityPoolNews,
      setLiquidityPoolNews,
      deleteLiquidityPoolWeeklySnapshots,
      setLiquidityPoolWeeklySnapshots,
      deleteTokens,
      setTokens,
      deleteTokenDailySnapshots,
      setTokenDailySnapshots,
      deleteTokenHourlySnapshots,
      setTokenHourlySnapshots,
      deleteTokenWeeklySnapshots,
      setTokenWeeklySnapshots,
      deleteUsers,
      setUsers,
    ]->Belt.Array.map(dbFunc => sql->dbFunc)
  })

  res
}
