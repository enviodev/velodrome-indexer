module InMemoryStore = {
  let entityCurrentCrud = (currentCrud: option<Types.dbOp>, nextCrud: Types.dbOp): Types.dbOp => {
    switch (currentCrud, nextCrud) {
    | (Some(Set), Read)
    | (_, Set) =>
      Set
    | (Some(Read), Read) => Read
    | (Some(Delete), Read)
    | (_, Delete) =>
      Delete
    | (None, _) => nextCrud
    }
  }

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

    let set = (self: t, ~key: StoreItem.key, ~dbOp, ~entity: StoreItem.t) =>
      self.dict->Js.Dict.set(key->self.hasher, {entity, dbOp})

    let get = (self: t, key: StoreItem.key) =>
      self.dict->Js.Dict.get(key->self.hasher)->Belt.Option.map(row => row.entity)

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

  module Gauge = MakeStore({
    type t = Types.gaugeEntity
    type key = string
    let hasher = Obj.magic
  })

  module LatestETHPrice = MakeStore({
    type t = Types.latestETHPriceEntity
    type key = string
    let hasher = Obj.magic
  })

  module LiquidityPool = MakeStore({
    type t = Types.liquidityPoolEntity
    type key = string
    let hasher = Obj.magic
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

  module LiquidityPoolUserMapping = MakeStore({
    type t = Types.liquidityPoolUserMappingEntity
    type key = string
    let hasher = Obj.magic
  })

  module LiquidityPoolWeeklySnapshot = MakeStore({
    type t = Types.liquidityPoolWeeklySnapshotEntity
    type key = string
    let hasher = Obj.magic
  })

  module StateStore = MakeStore({
    type t = Types.stateStoreEntity
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
    gauge: Gauge.t,
    latestETHPrice: LatestETHPrice.t,
    liquidityPool: LiquidityPool.t,
    liquidityPoolDailySnapshot: LiquidityPoolDailySnapshot.t,
    liquidityPoolHourlySnapshot: LiquidityPoolHourlySnapshot.t,
    liquidityPoolUserMapping: LiquidityPoolUserMapping.t,
    liquidityPoolWeeklySnapshot: LiquidityPoolWeeklySnapshot.t,
    stateStore: StateStore.t,
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
    gauge: Gauge.make(),
    latestETHPrice: LatestETHPrice.make(),
    liquidityPool: LiquidityPool.make(),
    liquidityPoolDailySnapshot: LiquidityPoolDailySnapshot.make(),
    liquidityPoolHourlySnapshot: LiquidityPoolHourlySnapshot.make(),
    liquidityPoolUserMapping: LiquidityPoolUserMapping.make(),
    liquidityPoolWeeklySnapshot: LiquidityPoolWeeklySnapshot.make(),
    stateStore: StateStore.make(),
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
    gauge: self.gauge->Gauge.clone,
    latestETHPrice: self.latestETHPrice->LatestETHPrice.clone,
    liquidityPool: self.liquidityPool->LiquidityPool.clone,
    liquidityPoolDailySnapshot: self.liquidityPoolDailySnapshot->LiquidityPoolDailySnapshot.clone,
    liquidityPoolHourlySnapshot: self.liquidityPoolHourlySnapshot->LiquidityPoolHourlySnapshot.clone,
    liquidityPoolUserMapping: self.liquidityPoolUserMapping->LiquidityPoolUserMapping.clone,
    liquidityPoolWeeklySnapshot: self.liquidityPoolWeeklySnapshot->LiquidityPoolWeeklySnapshot.clone,
    stateStore: self.stateStore->StateStore.clone,
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
    //A unique list of ids that need to be loaded for entity gauge
    gaugeIdsToLoad: idsToLoad,
    //A unique list of ids that need to be loaded for entity latestETHPrice
    latestETHPriceIdsToLoad: idsToLoad,
    //A unique list of ids that need to be loaded for entity liquidityPool
    liquidityPoolIdsToLoad: idsToLoad,
    //A unique list of ids that need to be loaded for entity liquidityPoolDailySnapshot
    liquidityPoolDailySnapshotIdsToLoad: idsToLoad,
    //A unique list of ids that need to be loaded for entity liquidityPoolHourlySnapshot
    liquidityPoolHourlySnapshotIdsToLoad: idsToLoad,
    //A unique list of ids that need to be loaded for entity liquidityPoolUserMapping
    liquidityPoolUserMappingIdsToLoad: idsToLoad,
    //A unique list of ids that need to be loaded for entity liquidityPoolWeeklySnapshot
    liquidityPoolWeeklySnapshotIdsToLoad: idsToLoad,
    //A unique list of ids that need to be loaded for entity stateStore
    stateStoreIdsToLoad: idsToLoad,
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
    gaugeIdsToLoad: Belt.Set.String.empty,
    latestETHPriceIdsToLoad: Belt.Set.String.empty,
    liquidityPoolIdsToLoad: Belt.Set.String.empty,
    liquidityPoolDailySnapshotIdsToLoad: Belt.Set.String.empty,
    liquidityPoolHourlySnapshotIdsToLoad: Belt.Set.String.empty,
    liquidityPoolUserMappingIdsToLoad: Belt.Set.String.empty,
    liquidityPoolWeeklySnapshotIdsToLoad: Belt.Set.String.empty,
    stateStoreIdsToLoad: Belt.Set.String.empty,
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
let rec gaugeLinkedEntityLoader = (
  loadLayer: LoadLayer.t,
  ~entityId: string,
  ~inMemoryStore: InMemoryStore.t,
  ~gaugeLoaderConfig: Types.gaugeLoaderConfig,
): LoadLayer.t => {
  //An array of getter functions for dataLoaded actions that will be run
  //after the current load layer is executed
  let dataLoadedActionsGetters = [
    gaugeLoaderConfig.loadPool->Belt.Option.map(liquidityPoolLoaderConfig => {
      () =>
        inMemoryStore.gauge
        ->InMemoryStore.Gauge.get(entityId)
        ->Belt.Option.mapWithDefault([], entity => {
          //getLoader can be used to map arrays of ids, optional ids or single ids
          let getLoader = entityId =>
            liquidityPoolLinkedEntityLoader(~liquidityPoolLoaderConfig, ~entityId, ~inMemoryStore)
          //In this case entity.pool is a single value. But we
          //still pass back an array of actions in order for cases where the related entity is an array of ids
          [entity.pool->getLoader]
        })
    }),
  ]->Belt.Array.keepMap(v => v)

  {
    ...loadLayer,
    gaugeIdsToLoad: loadLayer.gaugeIdsToLoad->LoadLayer.extendIdsToLoad(entityId),
    dataLoadedActionsGetters: loadLayer.dataLoadedActionsGetters->LoadLayer.extendDataLoadedActionsGetters(
      dataLoadedActionsGetters,
    ),
  }
}
@warning("-27")
and latestETHPriceLinkedEntityLoader = (
  loadLayer: LoadLayer.t,
  ~entityId: string,
  ~inMemoryStore: InMemoryStore.t,
  ~latestETHPriceLoaderConfig: Types.latestETHPriceLoaderConfig,
): LoadLayer.t => {
  //No dataLoaded actions need to happen on the in memory
  //since there are no relational non-derivedfrom params
  let _ = inMemoryStore //ignore inMemoryStore and stop warning

  //In this case the "latestETHPriceLoaderConfig" type is a boolean.
  if !latestETHPriceLoaderConfig {
    //If latestETHPriceLoaderConfig is false, don't load the entity
    //simply return the current load layer
    loadLayer
  } else {
    //If latestETHPriceLoaderConfig is true,
    //extend the entity ids to load field
    //There can be no dataLoadedActionsGetters to add since this type does not contain
    //any non derived from relational params
    {
      ...loadLayer,
      latestETHPriceIdsToLoad: loadLayer.latestETHPriceIdsToLoad->LoadLayer.extendIdsToLoad(
        entityId,
      ),
    }
  }
}
@warning("-27")
and liquidityPoolLinkedEntityLoader = (
  loadLayer: LoadLayer.t,
  ~entityId: string,
  ~inMemoryStore: InMemoryStore.t,
  ~liquidityPoolLoaderConfig: Types.liquidityPoolLoaderConfig,
): LoadLayer.t => {
  //An array of getter functions for dataLoaded actions that will be run
  //after the current load layer is executed
  let dataLoadedActionsGetters = [
    liquidityPoolLoaderConfig.loadToken0->Belt.Option.map(tokenLoaderConfig => {
      () =>
        inMemoryStore.liquidityPool
        ->InMemoryStore.LiquidityPool.get(entityId)
        ->Belt.Option.mapWithDefault([], entity => {
          //getLoader can be used to map arrays of ids, optional ids or single ids
          let getLoader = entityId =>
            tokenLinkedEntityLoader(~tokenLoaderConfig, ~entityId, ~inMemoryStore)
          //In this case entity.token0 is a single value. But we
          //still pass back an array of actions in order for cases where the related entity is an array of ids
          [entity.token0->getLoader]
        })
    }),
    liquidityPoolLoaderConfig.loadToken1->Belt.Option.map(tokenLoaderConfig => {
      () =>
        inMemoryStore.liquidityPool
        ->InMemoryStore.LiquidityPool.get(entityId)
        ->Belt.Option.mapWithDefault([], entity => {
          //getLoader can be used to map arrays of ids, optional ids or single ids
          let getLoader = entityId =>
            tokenLinkedEntityLoader(~tokenLoaderConfig, ~entityId, ~inMemoryStore)
          //In this case entity.token1 is a single value. But we
          //still pass back an array of actions in order for cases where the related entity is an array of ids
          [entity.token1->getLoader]
        })
    }),
  ]->Belt.Array.keepMap(v => v)

  {
    ...loadLayer,
    liquidityPoolIdsToLoad: loadLayer.liquidityPoolIdsToLoad->LoadLayer.extendIdsToLoad(entityId),
    dataLoadedActionsGetters: loadLayer.dataLoadedActionsGetters->LoadLayer.extendDataLoadedActionsGetters(
      dataLoadedActionsGetters,
    ),
  }
}
@warning("-27")
and liquidityPoolDailySnapshotLinkedEntityLoader = (
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
and liquidityPoolUserMappingLinkedEntityLoader = (
  loadLayer: LoadLayer.t,
  ~entityId: string,
  ~inMemoryStore: InMemoryStore.t,
  ~liquidityPoolUserMappingLoaderConfig: Types.liquidityPoolUserMappingLoaderConfig,
): LoadLayer.t => {
  //An array of getter functions for dataLoaded actions that will be run
  //after the current load layer is executed
  let dataLoadedActionsGetters = [
    liquidityPoolUserMappingLoaderConfig.loadLiquidityPool->Belt.Option.map(
      liquidityPoolLoaderConfig => {
        () =>
          inMemoryStore.liquidityPoolUserMapping
          ->InMemoryStore.LiquidityPoolUserMapping.get(entityId)
          ->Belt.Option.mapWithDefault([], entity => {
            //getLoader can be used to map arrays of ids, optional ids or single ids
            let getLoader = entityId =>
              liquidityPoolLinkedEntityLoader(~liquidityPoolLoaderConfig, ~entityId, ~inMemoryStore)
            //In this case entity.liquidityPool is a single value. But we
            //still pass back an array of actions in order for cases where the related entity is an array of ids
            [entity.liquidityPool->getLoader]
          })
      },
    ),
    liquidityPoolUserMappingLoaderConfig.loadUser->Belt.Option.map(userLoaderConfig => {
      () =>
        inMemoryStore.liquidityPoolUserMapping
        ->InMemoryStore.LiquidityPoolUserMapping.get(entityId)
        ->Belt.Option.mapWithDefault([], entity => {
          //getLoader can be used to map arrays of ids, optional ids or single ids
          let getLoader = entityId =>
            userLinkedEntityLoader(~userLoaderConfig, ~entityId, ~inMemoryStore)
          //In this case entity.user is a single value. But we
          //still pass back an array of actions in order for cases where the related entity is an array of ids
          [entity.user->getLoader]
        })
    }),
  ]->Belt.Array.keepMap(v => v)

  {
    ...loadLayer,
    liquidityPoolUserMappingIdsToLoad: loadLayer.liquidityPoolUserMappingIdsToLoad->LoadLayer.extendIdsToLoad(
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
and stateStoreLinkedEntityLoader = (
  loadLayer: LoadLayer.t,
  ~entityId: string,
  ~inMemoryStore: InMemoryStore.t,
  ~stateStoreLoaderConfig: Types.stateStoreLoaderConfig,
): LoadLayer.t => {
  //An array of getter functions for dataLoaded actions that will be run
  //after the current load layer is executed
  let dataLoadedActionsGetters = [
    stateStoreLoaderConfig.loadLatestEthPrice->Belt.Option.map(latestETHPriceLoaderConfig => {
      () =>
        inMemoryStore.stateStore
        ->InMemoryStore.StateStore.get(entityId)
        ->Belt.Option.mapWithDefault([], entity => {
          //getLoader can be used to map arrays of ids, optional ids or single ids
          let getLoader = entityId =>
            latestETHPriceLinkedEntityLoader(~latestETHPriceLoaderConfig, ~entityId, ~inMemoryStore)
          //In this case entity.latestEthPrice is a single value. But we
          //still pass back an array of actions in order for cases where the related entity is an array of ids
          [entity.latestEthPrice->getLoader]
        })
    }),
  ]->Belt.Array.keepMap(v => v)

  {
    ...loadLayer,
    stateStoreIdsToLoad: loadLayer.stateStoreIdsToLoad->LoadLayer.extendIdsToLoad(entityId),
    dataLoadedActionsGetters: loadLayer.dataLoadedActionsGetters->LoadLayer.extendDataLoadedActionsGetters(
      dataLoadedActionsGetters,
    ),
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
    | GaugeRead(entityId, gaugeLoaderConfig) =>
      loadLayer->gaugeLinkedEntityLoader(~entityId, ~inMemoryStore, ~gaugeLoaderConfig)
    | LatestETHPriceRead(entityId) =>
      loadLayer->latestETHPriceLinkedEntityLoader(
        ~entityId,
        ~inMemoryStore,
        ~latestETHPriceLoaderConfig=true,
      )
    | LiquidityPoolRead(entityId, liquidityPoolLoaderConfig) =>
      loadLayer->liquidityPoolLinkedEntityLoader(
        ~entityId,
        ~inMemoryStore,
        ~liquidityPoolLoaderConfig,
      )
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
    | LiquidityPoolUserMappingRead(entityId, liquidityPoolUserMappingLoaderConfig) =>
      loadLayer->liquidityPoolUserMappingLinkedEntityLoader(
        ~entityId,
        ~inMemoryStore,
        ~liquidityPoolUserMappingLoaderConfig,
      )
    | LiquidityPoolWeeklySnapshotRead(entityId) =>
      loadLayer->liquidityPoolWeeklySnapshotLinkedEntityLoader(
        ~entityId,
        ~inMemoryStore,
        ~liquidityPoolWeeklySnapshotLoaderConfig=true,
      )
    | StateStoreRead(entityId, stateStoreLoaderConfig) =>
      loadLayer->stateStoreLinkedEntityLoader(~entityId, ~inMemoryStore, ~stateStoreLoaderConfig)
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
          store->inMemStoreSetFn(~key=entity->getEntiyId, ~dbOp=Types.Read, ~entity)
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
      ~idsToLoad=loadLayer.gaugeIdsToLoad,
      ~dbReadFn=DbFunctions.Gauge.readEntities,
      ~inMemStoreSetFn=InMemoryStore.Gauge.set,
      ~store=inMemoryStore.gauge,
      ~getEntiyId=entity => entity.id,
    ),
    makeSqlEntityExecuter(
      ~idsToLoad=loadLayer.latestETHPriceIdsToLoad,
      ~dbReadFn=DbFunctions.LatestETHPrice.readEntities,
      ~inMemStoreSetFn=InMemoryStore.LatestETHPrice.set,
      ~store=inMemoryStore.latestETHPrice,
      ~getEntiyId=entity => entity.id,
    ),
    makeSqlEntityExecuter(
      ~idsToLoad=loadLayer.liquidityPoolIdsToLoad,
      ~dbReadFn=DbFunctions.LiquidityPool.readEntities,
      ~inMemStoreSetFn=InMemoryStore.LiquidityPool.set,
      ~store=inMemoryStore.liquidityPool,
      ~getEntiyId=entity => entity.id,
    ),
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
      ~idsToLoad=loadLayer.liquidityPoolUserMappingIdsToLoad,
      ~dbReadFn=DbFunctions.LiquidityPoolUserMapping.readEntities,
      ~inMemStoreSetFn=InMemoryStore.LiquidityPoolUserMapping.set,
      ~store=inMemoryStore.liquidityPoolUserMapping,
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
      ~idsToLoad=loadLayer.stateStoreIdsToLoad,
      ~dbReadFn=DbFunctions.StateStore.readEntities,
      ~inMemStoreSetFn=InMemoryStore.StateStore.set,
      ~store=inMemoryStore.stateStore,
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

let executeEntityFunction = (
  sql: Postgres.sql,
  ~rows: array<Types.inMemoryStoreRow<'a>>,
  ~dbOp: Types.dbOp,
  ~dbFunction: (Postgres.sql, array<'b>) => promise<unit>,
  ~getInputValFromRow: Types.inMemoryStoreRow<'a> => 'b,
) => {
  let entityIds =
    rows->Belt.Array.keepMap(row => row.dbOp == dbOp ? Some(row->getInputValFromRow) : None)

  if entityIds->Array.length > 0 {
    sql->dbFunction(entityIds)
  } else {
    Promise.resolve()
  }
}

let executeSet = executeEntityFunction(~dbOp=Set)
let executeDelete = executeEntityFunction(~dbOp=Delete)

let executeSetSchemaEntity = (~entityEncoder) =>
  executeSet(~getInputValFromRow=row => {
    row.entity->entityEncoder
  })

let executeBatch = async (sql, ~inMemoryStore: InMemoryStore.t) => {
  let setEventSyncState = executeSet(
    ~dbFunction=DbFunctions.EventSyncState.batchSet,
    ~getInputValFromRow=row => row.entity,
    ~rows=inMemoryStore.eventSyncState->InMemoryStore.EventSyncState.values,
  )

  let setRawEvents = executeSet(
    ~dbFunction=DbFunctions.RawEvents.batchSet,
    ~getInputValFromRow=row => row.entity,
    ~rows=inMemoryStore.rawEvents->InMemoryStore.RawEvents.values,
  )

  let setDynamicContracts = executeSet(
    ~dbFunction=DbFunctions.DynamicContractRegistry.batchSet,
    ~rows=inMemoryStore.dynamicContractRegistry->InMemoryStore.DynamicContractRegistry.values,
    ~getInputValFromRow={row => row.entity},
  )

  let deleteGauges = executeDelete(
    ~dbFunction=DbFunctions.Gauge.batchDelete,
    ~rows=inMemoryStore.gauge->InMemoryStore.Gauge.values,
    ~getInputValFromRow={row => row.entity.id},
  )

  let setGauges = executeSetSchemaEntity(
    ~dbFunction=DbFunctions.Gauge.batchSet,
    ~rows=inMemoryStore.gauge->InMemoryStore.Gauge.values,
    ~entityEncoder=Types.gaugeEntity_encode,
  )

  let deleteLatestETHPrices = executeDelete(
    ~dbFunction=DbFunctions.LatestETHPrice.batchDelete,
    ~rows=inMemoryStore.latestETHPrice->InMemoryStore.LatestETHPrice.values,
    ~getInputValFromRow={row => row.entity.id},
  )

  let setLatestETHPrices = executeSetSchemaEntity(
    ~dbFunction=DbFunctions.LatestETHPrice.batchSet,
    ~rows=inMemoryStore.latestETHPrice->InMemoryStore.LatestETHPrice.values,
    ~entityEncoder=Types.latestETHPriceEntity_encode,
  )

  let deleteLiquidityPools = executeDelete(
    ~dbFunction=DbFunctions.LiquidityPool.batchDelete,
    ~rows=inMemoryStore.liquidityPool->InMemoryStore.LiquidityPool.values,
    ~getInputValFromRow={row => row.entity.id},
  )

  let setLiquidityPools = executeSetSchemaEntity(
    ~dbFunction=DbFunctions.LiquidityPool.batchSet,
    ~rows=inMemoryStore.liquidityPool->InMemoryStore.LiquidityPool.values,
    ~entityEncoder=Types.liquidityPoolEntity_encode,
  )

  let deleteLiquidityPoolDailySnapshots = executeDelete(
    ~dbFunction=DbFunctions.LiquidityPoolDailySnapshot.batchDelete,
    ~rows=inMemoryStore.liquidityPoolDailySnapshot->InMemoryStore.LiquidityPoolDailySnapshot.values,
    ~getInputValFromRow={row => row.entity.id},
  )

  let setLiquidityPoolDailySnapshots = executeSetSchemaEntity(
    ~dbFunction=DbFunctions.LiquidityPoolDailySnapshot.batchSet,
    ~rows=inMemoryStore.liquidityPoolDailySnapshot->InMemoryStore.LiquidityPoolDailySnapshot.values,
    ~entityEncoder=Types.liquidityPoolDailySnapshotEntity_encode,
  )

  let deleteLiquidityPoolHourlySnapshots = executeDelete(
    ~dbFunction=DbFunctions.LiquidityPoolHourlySnapshot.batchDelete,
    ~rows=inMemoryStore.liquidityPoolHourlySnapshot->InMemoryStore.LiquidityPoolHourlySnapshot.values,
    ~getInputValFromRow={row => row.entity.id},
  )

  let setLiquidityPoolHourlySnapshots = executeSetSchemaEntity(
    ~dbFunction=DbFunctions.LiquidityPoolHourlySnapshot.batchSet,
    ~rows=inMemoryStore.liquidityPoolHourlySnapshot->InMemoryStore.LiquidityPoolHourlySnapshot.values,
    ~entityEncoder=Types.liquidityPoolHourlySnapshotEntity_encode,
  )

  let deleteLiquidityPoolUserMappings = executeDelete(
    ~dbFunction=DbFunctions.LiquidityPoolUserMapping.batchDelete,
    ~rows=inMemoryStore.liquidityPoolUserMapping->InMemoryStore.LiquidityPoolUserMapping.values,
    ~getInputValFromRow={row => row.entity.id},
  )

  let setLiquidityPoolUserMappings = executeSetSchemaEntity(
    ~dbFunction=DbFunctions.LiquidityPoolUserMapping.batchSet,
    ~rows=inMemoryStore.liquidityPoolUserMapping->InMemoryStore.LiquidityPoolUserMapping.values,
    ~entityEncoder=Types.liquidityPoolUserMappingEntity_encode,
  )

  let deleteLiquidityPoolWeeklySnapshots = executeDelete(
    ~dbFunction=DbFunctions.LiquidityPoolWeeklySnapshot.batchDelete,
    ~rows=inMemoryStore.liquidityPoolWeeklySnapshot->InMemoryStore.LiquidityPoolWeeklySnapshot.values,
    ~getInputValFromRow={row => row.entity.id},
  )

  let setLiquidityPoolWeeklySnapshots = executeSetSchemaEntity(
    ~dbFunction=DbFunctions.LiquidityPoolWeeklySnapshot.batchSet,
    ~rows=inMemoryStore.liquidityPoolWeeklySnapshot->InMemoryStore.LiquidityPoolWeeklySnapshot.values,
    ~entityEncoder=Types.liquidityPoolWeeklySnapshotEntity_encode,
  )

  let deleteStateStores = executeDelete(
    ~dbFunction=DbFunctions.StateStore.batchDelete,
    ~rows=inMemoryStore.stateStore->InMemoryStore.StateStore.values,
    ~getInputValFromRow={row => row.entity.id},
  )

  let setStateStores = executeSetSchemaEntity(
    ~dbFunction=DbFunctions.StateStore.batchSet,
    ~rows=inMemoryStore.stateStore->InMemoryStore.StateStore.values,
    ~entityEncoder=Types.stateStoreEntity_encode,
  )

  let deleteTokens = executeDelete(
    ~dbFunction=DbFunctions.Token.batchDelete,
    ~rows=inMemoryStore.token->InMemoryStore.Token.values,
    ~getInputValFromRow={row => row.entity.id},
  )

  let setTokens = executeSetSchemaEntity(
    ~dbFunction=DbFunctions.Token.batchSet,
    ~rows=inMemoryStore.token->InMemoryStore.Token.values,
    ~entityEncoder=Types.tokenEntity_encode,
  )

  let deleteTokenDailySnapshots = executeDelete(
    ~dbFunction=DbFunctions.TokenDailySnapshot.batchDelete,
    ~rows=inMemoryStore.tokenDailySnapshot->InMemoryStore.TokenDailySnapshot.values,
    ~getInputValFromRow={row => row.entity.id},
  )

  let setTokenDailySnapshots = executeSetSchemaEntity(
    ~dbFunction=DbFunctions.TokenDailySnapshot.batchSet,
    ~rows=inMemoryStore.tokenDailySnapshot->InMemoryStore.TokenDailySnapshot.values,
    ~entityEncoder=Types.tokenDailySnapshotEntity_encode,
  )

  let deleteTokenHourlySnapshots = executeDelete(
    ~dbFunction=DbFunctions.TokenHourlySnapshot.batchDelete,
    ~rows=inMemoryStore.tokenHourlySnapshot->InMemoryStore.TokenHourlySnapshot.values,
    ~getInputValFromRow={row => row.entity.id},
  )

  let setTokenHourlySnapshots = executeSetSchemaEntity(
    ~dbFunction=DbFunctions.TokenHourlySnapshot.batchSet,
    ~rows=inMemoryStore.tokenHourlySnapshot->InMemoryStore.TokenHourlySnapshot.values,
    ~entityEncoder=Types.tokenHourlySnapshotEntity_encode,
  )

  let deleteTokenWeeklySnapshots = executeDelete(
    ~dbFunction=DbFunctions.TokenWeeklySnapshot.batchDelete,
    ~rows=inMemoryStore.tokenWeeklySnapshot->InMemoryStore.TokenWeeklySnapshot.values,
    ~getInputValFromRow={row => row.entity.id},
  )

  let setTokenWeeklySnapshots = executeSetSchemaEntity(
    ~dbFunction=DbFunctions.TokenWeeklySnapshot.batchSet,
    ~rows=inMemoryStore.tokenWeeklySnapshot->InMemoryStore.TokenWeeklySnapshot.values,
    ~entityEncoder=Types.tokenWeeklySnapshotEntity_encode,
  )

  let deleteUsers = executeDelete(
    ~dbFunction=DbFunctions.User.batchDelete,
    ~rows=inMemoryStore.user->InMemoryStore.User.values,
    ~getInputValFromRow={row => row.entity.id},
  )

  let setUsers = executeSetSchemaEntity(
    ~dbFunction=DbFunctions.User.batchSet,
    ~rows=inMemoryStore.user->InMemoryStore.User.values,
    ~entityEncoder=Types.userEntity_encode,
  )

  let res = await sql->Postgres.beginSql(sql => {
    [
      setEventSyncState,
      setRawEvents,
      setDynamicContracts,
      deleteGauges,
      setGauges,
      deleteLatestETHPrices,
      setLatestETHPrices,
      deleteLiquidityPools,
      setLiquidityPools,
      deleteLiquidityPoolDailySnapshots,
      setLiquidityPoolDailySnapshots,
      deleteLiquidityPoolHourlySnapshots,
      setLiquidityPoolHourlySnapshots,
      deleteLiquidityPoolUserMappings,
      setLiquidityPoolUserMappings,
      deleteLiquidityPoolWeeklySnapshots,
      setLiquidityPoolWeeklySnapshots,
      deleteStateStores,
      setStateStores,
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
