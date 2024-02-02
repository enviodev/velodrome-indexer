//*************
//***ENTITIES**
//*************

@spice @genType.as("Id")
type id = string

@genType.import(("./bindings/OpaqueTypes", "Nullable"))
type nullable<'a> = option<'a>

let nullable_encode = (encoder: Spice.encoder<'a>, n: nullable<'a>): Js.Json.t =>
  switch n {
  | None => Js.Json.null
  | Some(v) => v->encoder
  }

let nullable_decode = Spice.optionFromJson

@@warning("-30")
@genType
type rec gaugeLoaderConfig = {loadPool?: liquidityPoolLoaderConfig}
and latestETHPriceLoaderConfig = bool
and liquidityPoolLoaderConfig = {loadToken0?: tokenLoaderConfig, loadToken1?: tokenLoaderConfig}
and liquidityPoolDailySnapshotLoaderConfig = bool
and liquidityPoolHourlySnapshotLoaderConfig = bool
and liquidityPoolUserMappingLoaderConfig = {
  loadLiquidityPool?: liquidityPoolLoaderConfig,
  loadUser?: userLoaderConfig,
}
and liquidityPoolWeeklySnapshotLoaderConfig = bool
and stateStoreLoaderConfig = {loadLatestEthPrice?: latestETHPriceLoaderConfig}
and tokenLoaderConfig = bool
and tokenDailySnapshotLoaderConfig = bool
and tokenHourlySnapshotLoaderConfig = bool
and tokenWeeklySnapshotLoaderConfig = bool
and userLoaderConfig = bool

@@warning("+30")
@genType
type entityRead =
  | GaugeRead(id, gaugeLoaderConfig)
  | LatestETHPriceRead(id)
  | LiquidityPoolRead(id, liquidityPoolLoaderConfig)
  | LiquidityPoolDailySnapshotRead(id)
  | LiquidityPoolHourlySnapshotRead(id)
  | LiquidityPoolUserMappingRead(id, liquidityPoolUserMappingLoaderConfig)
  | LiquidityPoolWeeklySnapshotRead(id)
  | StateStoreRead(id, stateStoreLoaderConfig)
  | TokenRead(id)
  | TokenDailySnapshotRead(id)
  | TokenHourlySnapshotRead(id)
  | TokenWeeklySnapshotRead(id)
  | UserRead(id)

@genType
type rawEventsEntity = {
  @as("chain_id") chainId: int,
  @as("event_id") eventId: string,
  @as("block_number") blockNumber: int,
  @as("log_index") logIndex: int,
  @as("transaction_index") transactionIndex: int,
  @as("transaction_hash") transactionHash: string,
  @as("src_address") srcAddress: Ethers.ethAddress,
  @as("block_hash") blockHash: string,
  @as("block_timestamp") blockTimestamp: int,
  @as("event_type") eventType: Js.Json.t,
  params: string,
}

@genType
type dynamicContractRegistryEntity = {
  @as("chain_id") chainId: int,
  @as("event_id") eventId: Ethers.BigInt.t,
  @as("contract_address") contractAddress: Ethers.ethAddress,
  @as("contract_type") contractType: string,
}

@spice @genType.as("GaugeEntity")
type gaugeEntity = {
  id: id,
  chainID: Ethers.BigInt.t,
  pool: id,
  totalEmissions: Ethers.BigInt.t,
  totalEmissionsUSD: Ethers.BigInt.t,
  lastUpdatedTimestamp: Ethers.BigInt.t,
}

@spice @genType.as("LatestETHPriceEntity")
type latestETHPriceEntity = {
  id: id,
  price: Ethers.BigInt.t,
}

@spice @genType.as("LiquidityPoolEntity")
type liquidityPoolEntity = {
  id: id,
  chainID: Ethers.BigInt.t,
  token0: id,
  token1: id,
  isStable: bool,
  reserve0: Ethers.BigInt.t,
  reserve1: Ethers.BigInt.t,
  totalLiquidityETH: Ethers.BigInt.t,
  totalLiquidityUSD: Ethers.BigInt.t,
  totalVolume0: Ethers.BigInt.t,
  totalVolume1: Ethers.BigInt.t,
  totalVolumeUSD: Ethers.BigInt.t,
  totalFees0: Ethers.BigInt.t,
  totalFees1: Ethers.BigInt.t,
  totalFeesUSD: Ethers.BigInt.t,
  numberOfSwaps: Ethers.BigInt.t,
  token0Price: Ethers.BigInt.t,
  token1Price: Ethers.BigInt.t,
  lastUpdatedTimestamp: Ethers.BigInt.t,
}

@spice @genType.as("LiquidityPoolDailySnapshotEntity")
type liquidityPoolDailySnapshotEntity = {
  id: id,
  chainID: Ethers.BigInt.t,
  pool: string,
  reserve0: Ethers.BigInt.t,
  reserve1: Ethers.BigInt.t,
  totalLiquidityETH: Ethers.BigInt.t,
  totalLiquidityUSD: Ethers.BigInt.t,
  totalVolume0: Ethers.BigInt.t,
  totalVolume1: Ethers.BigInt.t,
  totalVolumeUSD: Ethers.BigInt.t,
  totalFees0: Ethers.BigInt.t,
  totalFees1: Ethers.BigInt.t,
  totalFeesUSD: Ethers.BigInt.t,
  numberOfSwaps: Ethers.BigInt.t,
  token0Price: Ethers.BigInt.t,
  token1Price: Ethers.BigInt.t,
  lastUpdatedTimestamp: Ethers.BigInt.t,
}

@spice @genType.as("LiquidityPoolHourlySnapshotEntity")
type liquidityPoolHourlySnapshotEntity = {
  id: id,
  chainID: Ethers.BigInt.t,
  pool: string,
  reserve0: Ethers.BigInt.t,
  reserve1: Ethers.BigInt.t,
  totalLiquidityETH: Ethers.BigInt.t,
  totalLiquidityUSD: Ethers.BigInt.t,
  totalVolume0: Ethers.BigInt.t,
  totalVolume1: Ethers.BigInt.t,
  totalVolumeUSD: Ethers.BigInt.t,
  totalFees0: Ethers.BigInt.t,
  totalFees1: Ethers.BigInt.t,
  totalFeesUSD: Ethers.BigInt.t,
  numberOfSwaps: Ethers.BigInt.t,
  token0Price: Ethers.BigInt.t,
  token1Price: Ethers.BigInt.t,
  lastUpdatedTimestamp: Ethers.BigInt.t,
}

@spice @genType.as("LiquidityPoolUserMappingEntity")
type liquidityPoolUserMappingEntity = {
  id: id,
  liquidityPool: id,
  user: id,
}

@spice @genType.as("LiquidityPoolWeeklySnapshotEntity")
type liquidityPoolWeeklySnapshotEntity = {
  id: id,
  chainID: Ethers.BigInt.t,
  pool: string,
  reserve0: Ethers.BigInt.t,
  reserve1: Ethers.BigInt.t,
  totalLiquidityETH: Ethers.BigInt.t,
  totalLiquidityUSD: Ethers.BigInt.t,
  totalVolume0: Ethers.BigInt.t,
  totalVolume1: Ethers.BigInt.t,
  totalVolumeUSD: Ethers.BigInt.t,
  totalFees0: Ethers.BigInt.t,
  totalFees1: Ethers.BigInt.t,
  totalFeesUSD: Ethers.BigInt.t,
  numberOfSwaps: Ethers.BigInt.t,
  token0Price: Ethers.BigInt.t,
  token1Price: Ethers.BigInt.t,
  lastUpdatedTimestamp: Ethers.BigInt.t,
}

@spice @genType.as("StateStoreEntity")
type stateStoreEntity = {
  id: id,
  latestEthPrice: id,
}

@spice @genType.as("TokenEntity")
type tokenEntity = {
  id: id,
  chainID: Ethers.BigInt.t,
  pricePerETH: Ethers.BigInt.t,
  pricePerUSD: Ethers.BigInt.t,
  lastUpdatedTimestamp: Ethers.BigInt.t,
}

@spice @genType.as("TokenDailySnapshotEntity")
type tokenDailySnapshotEntity = {
  id: id,
  chainID: Ethers.BigInt.t,
  token: string,
  pricePerETH: Ethers.BigInt.t,
  pricePerUSD: Ethers.BigInt.t,
  lastUpdatedTimestamp: Ethers.BigInt.t,
}

@spice @genType.as("TokenHourlySnapshotEntity")
type tokenHourlySnapshotEntity = {
  id: id,
  chainID: Ethers.BigInt.t,
  token: string,
  pricePerETH: Ethers.BigInt.t,
  pricePerUSD: Ethers.BigInt.t,
  lastUpdatedTimestamp: Ethers.BigInt.t,
}

@spice @genType.as("TokenWeeklySnapshotEntity")
type tokenWeeklySnapshotEntity = {
  id: id,
  chainID: Ethers.BigInt.t,
  token: string,
  pricePerETH: Ethers.BigInt.t,
  pricePerUSD: Ethers.BigInt.t,
  lastUpdatedTimestamp: Ethers.BigInt.t,
}

@spice @genType.as("UserEntity")
type userEntity = {
  id: id,
  numberOfSwaps: Ethers.BigInt.t,
  totalSwapVolumeUSD: Ethers.BigInt.t,
  lastUpdatedTimestamp: Ethers.BigInt.t,
}

type entity =
  | GaugeEntity(gaugeEntity)
  | LatestETHPriceEntity(latestETHPriceEntity)
  | LiquidityPoolEntity(liquidityPoolEntity)
  | LiquidityPoolDailySnapshotEntity(liquidityPoolDailySnapshotEntity)
  | LiquidityPoolHourlySnapshotEntity(liquidityPoolHourlySnapshotEntity)
  | LiquidityPoolUserMappingEntity(liquidityPoolUserMappingEntity)
  | LiquidityPoolWeeklySnapshotEntity(liquidityPoolWeeklySnapshotEntity)
  | StateStoreEntity(stateStoreEntity)
  | TokenEntity(tokenEntity)
  | TokenDailySnapshotEntity(tokenDailySnapshotEntity)
  | TokenHourlySnapshotEntity(tokenHourlySnapshotEntity)
  | TokenWeeklySnapshotEntity(tokenWeeklySnapshotEntity)
  | UserEntity(userEntity)

type dbOp = Read | Set | Delete

@genType
type inMemoryStoreRow<'a> = {
  dbOp: dbOp,
  entity: 'a,
}

//*************
//**CONTRACTS**
//*************

@genType.as("EventLog")
type eventLog<'a> = {
  params: 'a,
  chainId: int,
  blockNumber: int,
  blockTimestamp: int,
  blockHash: string,
  srcAddress: Ethers.ethAddress,
  transactionHash: string,
  transactionIndex: int,
  logIndex: int,
}

module PoolContract = {
  module FeesEvent = {
    //Note: each parameter is using a binding of its index to help with binding in ethers
    //This handles both unamed params and also named params that clash with reserved keywords
    //eg. if an event param is called "values" it will clash since eventArgs will have a '.values()' iterator
    type ethersEventArgs = {
      @as("0") sender: Ethers.ethAddress,
      @as("1") amount0: Ethers.BigInt.t,
      @as("2") amount1: Ethers.BigInt.t,
    }

    @spice @genType
    type eventArgs = {
      sender: Ethers.ethAddress,
      amount0: Ethers.BigInt.t,
      amount1: Ethers.BigInt.t,
    }

    @genType.as("PoolContract_Fees_EventLog")
    type log = eventLog<eventArgs>

    // Entity: Gauge
    type gaugeEntityHandlerContext = {
      getPool: gaugeEntity => liquidityPoolEntity,
      set: gaugeEntity => unit,
      delete: id => unit,
    }

    type gaugeEntityHandlerContextAsync = {
      getPool: gaugeEntity => promise<liquidityPoolEntity>,
      set: gaugeEntity => unit,
      delete: id => unit,
    }

    // Entity: LatestETHPrice
    type latestETHPriceEntityHandlerContext = {
      set: latestETHPriceEntity => unit,
      delete: id => unit,
    }

    type latestETHPriceEntityHandlerContextAsync = {
      set: latestETHPriceEntity => unit,
      delete: id => unit,
    }

    // Entity: LiquidityPool
    type liquidityPoolEntityHandlerContext = {
      get: id => option<liquidityPoolEntity>,
      getToken0: liquidityPoolEntity => tokenEntity,
      getToken1: liquidityPoolEntity => tokenEntity,
      set: liquidityPoolEntity => unit,
      delete: id => unit,
    }

    type liquidityPoolEntityHandlerContextAsync = {
      get: id => promise<option<liquidityPoolEntity>>,
      getToken0: liquidityPoolEntity => promise<tokenEntity>,
      getToken1: liquidityPoolEntity => promise<tokenEntity>,
      set: liquidityPoolEntity => unit,
      delete: id => unit,
    }

    // Entity: LiquidityPoolDailySnapshot
    type liquidityPoolDailySnapshotEntityHandlerContext = {
      set: liquidityPoolDailySnapshotEntity => unit,
      delete: id => unit,
    }

    type liquidityPoolDailySnapshotEntityHandlerContextAsync = {
      set: liquidityPoolDailySnapshotEntity => unit,
      delete: id => unit,
    }

    // Entity: LiquidityPoolHourlySnapshot
    type liquidityPoolHourlySnapshotEntityHandlerContext = {
      set: liquidityPoolHourlySnapshotEntity => unit,
      delete: id => unit,
    }

    type liquidityPoolHourlySnapshotEntityHandlerContextAsync = {
      set: liquidityPoolHourlySnapshotEntity => unit,
      delete: id => unit,
    }

    // Entity: LiquidityPoolUserMapping
    type liquidityPoolUserMappingEntityHandlerContext = {
      getLiquidityPool: liquidityPoolUserMappingEntity => liquidityPoolEntity,
      getUser: liquidityPoolUserMappingEntity => userEntity,
      set: liquidityPoolUserMappingEntity => unit,
      delete: id => unit,
    }

    type liquidityPoolUserMappingEntityHandlerContextAsync = {
      getLiquidityPool: liquidityPoolUserMappingEntity => promise<liquidityPoolEntity>,
      getUser: liquidityPoolUserMappingEntity => promise<userEntity>,
      set: liquidityPoolUserMappingEntity => unit,
      delete: id => unit,
    }

    // Entity: LiquidityPoolWeeklySnapshot
    type liquidityPoolWeeklySnapshotEntityHandlerContext = {
      set: liquidityPoolWeeklySnapshotEntity => unit,
      delete: id => unit,
    }

    type liquidityPoolWeeklySnapshotEntityHandlerContextAsync = {
      set: liquidityPoolWeeklySnapshotEntity => unit,
      delete: id => unit,
    }

    // Entity: StateStore
    type stateStoreEntityHandlerContext = {
      getLatestEthPrice: stateStoreEntity => latestETHPriceEntity,
      set: stateStoreEntity => unit,
      delete: id => unit,
    }

    type stateStoreEntityHandlerContextAsync = {
      getLatestEthPrice: stateStoreEntity => promise<latestETHPriceEntity>,
      set: stateStoreEntity => unit,
      delete: id => unit,
    }

    // Entity: Token
    type tokenEntityHandlerContext = {
      set: tokenEntity => unit,
      delete: id => unit,
    }

    type tokenEntityHandlerContextAsync = {
      set: tokenEntity => unit,
      delete: id => unit,
    }

    // Entity: TokenDailySnapshot
    type tokenDailySnapshotEntityHandlerContext = {
      set: tokenDailySnapshotEntity => unit,
      delete: id => unit,
    }

    type tokenDailySnapshotEntityHandlerContextAsync = {
      set: tokenDailySnapshotEntity => unit,
      delete: id => unit,
    }

    // Entity: TokenHourlySnapshot
    type tokenHourlySnapshotEntityHandlerContext = {
      set: tokenHourlySnapshotEntity => unit,
      delete: id => unit,
    }

    type tokenHourlySnapshotEntityHandlerContextAsync = {
      set: tokenHourlySnapshotEntity => unit,
      delete: id => unit,
    }

    // Entity: TokenWeeklySnapshot
    type tokenWeeklySnapshotEntityHandlerContext = {
      set: tokenWeeklySnapshotEntity => unit,
      delete: id => unit,
    }

    type tokenWeeklySnapshotEntityHandlerContextAsync = {
      set: tokenWeeklySnapshotEntity => unit,
      delete: id => unit,
    }

    // Entity: User
    type userEntityHandlerContext = {
      set: userEntity => unit,
      delete: id => unit,
    }

    type userEntityHandlerContextAsync = {
      set: userEntity => unit,
      delete: id => unit,
    }

    @genType
    type handlerContext = {
      log: Logs.userLogger,
      @as("Gauge") gauge: gaugeEntityHandlerContext,
      @as("LatestETHPrice") latestETHPrice: latestETHPriceEntityHandlerContext,
      @as("LiquidityPool") liquidityPool: liquidityPoolEntityHandlerContext,
      @as("LiquidityPoolDailySnapshot")
      liquidityPoolDailySnapshot: liquidityPoolDailySnapshotEntityHandlerContext,
      @as("LiquidityPoolHourlySnapshot")
      liquidityPoolHourlySnapshot: liquidityPoolHourlySnapshotEntityHandlerContext,
      @as("LiquidityPoolUserMapping")
      liquidityPoolUserMapping: liquidityPoolUserMappingEntityHandlerContext,
      @as("LiquidityPoolWeeklySnapshot")
      liquidityPoolWeeklySnapshot: liquidityPoolWeeklySnapshotEntityHandlerContext,
      @as("StateStore") stateStore: stateStoreEntityHandlerContext,
      @as("Token") token: tokenEntityHandlerContext,
      @as("TokenDailySnapshot") tokenDailySnapshot: tokenDailySnapshotEntityHandlerContext,
      @as("TokenHourlySnapshot") tokenHourlySnapshot: tokenHourlySnapshotEntityHandlerContext,
      @as("TokenWeeklySnapshot") tokenWeeklySnapshot: tokenWeeklySnapshotEntityHandlerContext,
      @as("User") user: userEntityHandlerContext,
    }
    @genType
    type handlerContextAsync = {
      log: Logs.userLogger,
      @as("Gauge") gauge: gaugeEntityHandlerContextAsync,
      @as("LatestETHPrice") latestETHPrice: latestETHPriceEntityHandlerContextAsync,
      @as("LiquidityPool") liquidityPool: liquidityPoolEntityHandlerContextAsync,
      @as("LiquidityPoolDailySnapshot")
      liquidityPoolDailySnapshot: liquidityPoolDailySnapshotEntityHandlerContextAsync,
      @as("LiquidityPoolHourlySnapshot")
      liquidityPoolHourlySnapshot: liquidityPoolHourlySnapshotEntityHandlerContextAsync,
      @as("LiquidityPoolUserMapping")
      liquidityPoolUserMapping: liquidityPoolUserMappingEntityHandlerContextAsync,
      @as("LiquidityPoolWeeklySnapshot")
      liquidityPoolWeeklySnapshot: liquidityPoolWeeklySnapshotEntityHandlerContextAsync,
      @as("StateStore") stateStore: stateStoreEntityHandlerContextAsync,
      @as("Token") token: tokenEntityHandlerContextAsync,
      @as("TokenDailySnapshot") tokenDailySnapshot: tokenDailySnapshotEntityHandlerContextAsync,
      @as("TokenHourlySnapshot") tokenHourlySnapshot: tokenHourlySnapshotEntityHandlerContextAsync,
      @as("TokenWeeklySnapshot") tokenWeeklySnapshot: tokenWeeklySnapshotEntityHandlerContextAsync,
      @as("User") user: userEntityHandlerContextAsync,
    }

    @genType
    type liquidityPoolEntityLoaderContext = {
      load: (id, ~loaders: liquidityPoolLoaderConfig=?) => unit,
    }

    @genType
    type contractRegistrations = {
      //TODO only add contracts we've registered for the event in the config
      addPool: Ethers.ethAddress => unit,
      //TODO only add contracts we've registered for the event in the config
      addPoolFactory: Ethers.ethAddress => unit,
      //TODO only add contracts we've registered for the event in the config
      addVoter: Ethers.ethAddress => unit,
    }
    @genType
    type loaderContext = {
      log: Logs.userLogger,
      contractRegistration: contractRegistrations,
      @as("LiquidityPool") liquidityPool: liquidityPoolEntityLoaderContext,
    }
  }
  module SwapEvent = {
    //Note: each parameter is using a binding of its index to help with binding in ethers
    //This handles both unamed params and also named params that clash with reserved keywords
    //eg. if an event param is called "values" it will clash since eventArgs will have a '.values()' iterator
    type ethersEventArgs = {
      @as("0") sender: Ethers.ethAddress,
      @as("1") to: Ethers.ethAddress,
      @as("2") amount0In: Ethers.BigInt.t,
      @as("3") amount1In: Ethers.BigInt.t,
      @as("4") amount0Out: Ethers.BigInt.t,
      @as("5") amount1Out: Ethers.BigInt.t,
    }

    @spice @genType
    type eventArgs = {
      sender: Ethers.ethAddress,
      to: Ethers.ethAddress,
      amount0In: Ethers.BigInt.t,
      amount1In: Ethers.BigInt.t,
      amount0Out: Ethers.BigInt.t,
      amount1Out: Ethers.BigInt.t,
    }

    @genType.as("PoolContract_Swap_EventLog")
    type log = eventLog<eventArgs>

    // Entity: Gauge
    type gaugeEntityHandlerContext = {
      getPool: gaugeEntity => liquidityPoolEntity,
      set: gaugeEntity => unit,
      delete: id => unit,
    }

    type gaugeEntityHandlerContextAsync = {
      getPool: gaugeEntity => promise<liquidityPoolEntity>,
      set: gaugeEntity => unit,
      delete: id => unit,
    }

    // Entity: LatestETHPrice
    type latestETHPriceEntityHandlerContext = {
      set: latestETHPriceEntity => unit,
      delete: id => unit,
    }

    type latestETHPriceEntityHandlerContextAsync = {
      set: latestETHPriceEntity => unit,
      delete: id => unit,
    }

    // Entity: LiquidityPool
    type liquidityPoolEntityHandlerContext = {
      get: id => option<liquidityPoolEntity>,
      getToken0: liquidityPoolEntity => tokenEntity,
      getToken1: liquidityPoolEntity => tokenEntity,
      set: liquidityPoolEntity => unit,
      delete: id => unit,
    }

    type liquidityPoolEntityHandlerContextAsync = {
      get: id => promise<option<liquidityPoolEntity>>,
      getToken0: liquidityPoolEntity => promise<tokenEntity>,
      getToken1: liquidityPoolEntity => promise<tokenEntity>,
      set: liquidityPoolEntity => unit,
      delete: id => unit,
    }

    // Entity: LiquidityPoolDailySnapshot
    type liquidityPoolDailySnapshotEntityHandlerContext = {
      set: liquidityPoolDailySnapshotEntity => unit,
      delete: id => unit,
    }

    type liquidityPoolDailySnapshotEntityHandlerContextAsync = {
      set: liquidityPoolDailySnapshotEntity => unit,
      delete: id => unit,
    }

    // Entity: LiquidityPoolHourlySnapshot
    type liquidityPoolHourlySnapshotEntityHandlerContext = {
      set: liquidityPoolHourlySnapshotEntity => unit,
      delete: id => unit,
    }

    type liquidityPoolHourlySnapshotEntityHandlerContextAsync = {
      set: liquidityPoolHourlySnapshotEntity => unit,
      delete: id => unit,
    }

    // Entity: LiquidityPoolUserMapping
    type liquidityPoolUserMappingEntityHandlerContext = {
      get: id => option<liquidityPoolUserMappingEntity>,
      getLiquidityPool: liquidityPoolUserMappingEntity => liquidityPoolEntity,
      getUser: liquidityPoolUserMappingEntity => userEntity,
      set: liquidityPoolUserMappingEntity => unit,
      delete: id => unit,
    }

    type liquidityPoolUserMappingEntityHandlerContextAsync = {
      get: id => promise<option<liquidityPoolUserMappingEntity>>,
      getLiquidityPool: liquidityPoolUserMappingEntity => promise<liquidityPoolEntity>,
      getUser: liquidityPoolUserMappingEntity => promise<userEntity>,
      set: liquidityPoolUserMappingEntity => unit,
      delete: id => unit,
    }

    // Entity: LiquidityPoolWeeklySnapshot
    type liquidityPoolWeeklySnapshotEntityHandlerContext = {
      set: liquidityPoolWeeklySnapshotEntity => unit,
      delete: id => unit,
    }

    type liquidityPoolWeeklySnapshotEntityHandlerContextAsync = {
      set: liquidityPoolWeeklySnapshotEntity => unit,
      delete: id => unit,
    }

    // Entity: StateStore
    type stateStoreEntityHandlerContext = {
      getLatestEthPrice: stateStoreEntity => latestETHPriceEntity,
      set: stateStoreEntity => unit,
      delete: id => unit,
    }

    type stateStoreEntityHandlerContextAsync = {
      getLatestEthPrice: stateStoreEntity => promise<latestETHPriceEntity>,
      set: stateStoreEntity => unit,
      delete: id => unit,
    }

    // Entity: Token
    type tokenEntityHandlerContext = {
      set: tokenEntity => unit,
      delete: id => unit,
    }

    type tokenEntityHandlerContextAsync = {
      set: tokenEntity => unit,
      delete: id => unit,
    }

    // Entity: TokenDailySnapshot
    type tokenDailySnapshotEntityHandlerContext = {
      set: tokenDailySnapshotEntity => unit,
      delete: id => unit,
    }

    type tokenDailySnapshotEntityHandlerContextAsync = {
      set: tokenDailySnapshotEntity => unit,
      delete: id => unit,
    }

    // Entity: TokenHourlySnapshot
    type tokenHourlySnapshotEntityHandlerContext = {
      set: tokenHourlySnapshotEntity => unit,
      delete: id => unit,
    }

    type tokenHourlySnapshotEntityHandlerContextAsync = {
      set: tokenHourlySnapshotEntity => unit,
      delete: id => unit,
    }

    // Entity: TokenWeeklySnapshot
    type tokenWeeklySnapshotEntityHandlerContext = {
      set: tokenWeeklySnapshotEntity => unit,
      delete: id => unit,
    }

    type tokenWeeklySnapshotEntityHandlerContextAsync = {
      set: tokenWeeklySnapshotEntity => unit,
      delete: id => unit,
    }

    // Entity: User
    type userEntityHandlerContext = {
      user: option<userEntity>,
      get: id => option<userEntity>,
      set: userEntity => unit,
      delete: id => unit,
    }

    type userEntityHandlerContextAsync = {
      user: option<userEntity>,
      get: id => promise<option<userEntity>>,
      set: userEntity => unit,
      delete: id => unit,
    }

    @genType
    type handlerContext = {
      log: Logs.userLogger,
      @as("Gauge") gauge: gaugeEntityHandlerContext,
      @as("LatestETHPrice") latestETHPrice: latestETHPriceEntityHandlerContext,
      @as("LiquidityPool") liquidityPool: liquidityPoolEntityHandlerContext,
      @as("LiquidityPoolDailySnapshot")
      liquidityPoolDailySnapshot: liquidityPoolDailySnapshotEntityHandlerContext,
      @as("LiquidityPoolHourlySnapshot")
      liquidityPoolHourlySnapshot: liquidityPoolHourlySnapshotEntityHandlerContext,
      @as("LiquidityPoolUserMapping")
      liquidityPoolUserMapping: liquidityPoolUserMappingEntityHandlerContext,
      @as("LiquidityPoolWeeklySnapshot")
      liquidityPoolWeeklySnapshot: liquidityPoolWeeklySnapshotEntityHandlerContext,
      @as("StateStore") stateStore: stateStoreEntityHandlerContext,
      @as("Token") token: tokenEntityHandlerContext,
      @as("TokenDailySnapshot") tokenDailySnapshot: tokenDailySnapshotEntityHandlerContext,
      @as("TokenHourlySnapshot") tokenHourlySnapshot: tokenHourlySnapshotEntityHandlerContext,
      @as("TokenWeeklySnapshot") tokenWeeklySnapshot: tokenWeeklySnapshotEntityHandlerContext,
      @as("User") user: userEntityHandlerContext,
    }
    @genType
    type handlerContextAsync = {
      log: Logs.userLogger,
      @as("Gauge") gauge: gaugeEntityHandlerContextAsync,
      @as("LatestETHPrice") latestETHPrice: latestETHPriceEntityHandlerContextAsync,
      @as("LiquidityPool") liquidityPool: liquidityPoolEntityHandlerContextAsync,
      @as("LiquidityPoolDailySnapshot")
      liquidityPoolDailySnapshot: liquidityPoolDailySnapshotEntityHandlerContextAsync,
      @as("LiquidityPoolHourlySnapshot")
      liquidityPoolHourlySnapshot: liquidityPoolHourlySnapshotEntityHandlerContextAsync,
      @as("LiquidityPoolUserMapping")
      liquidityPoolUserMapping: liquidityPoolUserMappingEntityHandlerContextAsync,
      @as("LiquidityPoolWeeklySnapshot")
      liquidityPoolWeeklySnapshot: liquidityPoolWeeklySnapshotEntityHandlerContextAsync,
      @as("StateStore") stateStore: stateStoreEntityHandlerContextAsync,
      @as("Token") token: tokenEntityHandlerContextAsync,
      @as("TokenDailySnapshot") tokenDailySnapshot: tokenDailySnapshotEntityHandlerContextAsync,
      @as("TokenHourlySnapshot") tokenHourlySnapshot: tokenHourlySnapshotEntityHandlerContextAsync,
      @as("TokenWeeklySnapshot") tokenWeeklySnapshot: tokenWeeklySnapshotEntityHandlerContextAsync,
      @as("User") user: userEntityHandlerContextAsync,
    }

    @genType
    type liquidityPoolEntityLoaderContext = {
      load: (id, ~loaders: liquidityPoolLoaderConfig=?) => unit,
    }
    @genType
    type liquidityPoolUserMappingEntityLoaderContext = {
      load: (id, ~loaders: liquidityPoolUserMappingLoaderConfig=?) => unit,
    }
    @genType
    type userEntityLoaderContext = {
      userLoad: id => unit,
      load: id => unit,
    }

    @genType
    type contractRegistrations = {
      //TODO only add contracts we've registered for the event in the config
      addPool: Ethers.ethAddress => unit,
      //TODO only add contracts we've registered for the event in the config
      addPoolFactory: Ethers.ethAddress => unit,
      //TODO only add contracts we've registered for the event in the config
      addVoter: Ethers.ethAddress => unit,
    }
    @genType
    type loaderContext = {
      log: Logs.userLogger,
      contractRegistration: contractRegistrations,
      @as("LiquidityPool") liquidityPool: liquidityPoolEntityLoaderContext,
      @as("LiquidityPoolUserMapping")
      liquidityPoolUserMapping: liquidityPoolUserMappingEntityLoaderContext,
      @as("User") user: userEntityLoaderContext,
    }
  }
  module SyncEvent = {
    //Note: each parameter is using a binding of its index to help with binding in ethers
    //This handles both unamed params and also named params that clash with reserved keywords
    //eg. if an event param is called "values" it will clash since eventArgs will have a '.values()' iterator
    type ethersEventArgs = {
      @as("0") reserve0: Ethers.BigInt.t,
      @as("1") reserve1: Ethers.BigInt.t,
    }

    @spice @genType
    type eventArgs = {
      reserve0: Ethers.BigInt.t,
      reserve1: Ethers.BigInt.t,
    }

    @genType.as("PoolContract_Sync_EventLog")
    type log = eventLog<eventArgs>

    // Entity: Gauge
    type gaugeEntityHandlerContext = {
      getPool: gaugeEntity => liquidityPoolEntity,
      set: gaugeEntity => unit,
      delete: id => unit,
    }

    type gaugeEntityHandlerContextAsync = {
      getPool: gaugeEntity => promise<liquidityPoolEntity>,
      set: gaugeEntity => unit,
      delete: id => unit,
    }

    // Entity: LatestETHPrice
    type latestETHPriceEntityHandlerContext = {
      set: latestETHPriceEntity => unit,
      delete: id => unit,
    }

    type latestETHPriceEntityHandlerContextAsync = {
      set: latestETHPriceEntity => unit,
      delete: id => unit,
    }

    // Entity: LiquidityPool
    type liquidityPoolEntityHandlerContext = {
      singlePool: option<liquidityPoolEntity>,
      stablecoinPools: array<option<liquidityPoolEntity>>,
      whitelistedPools: array<option<liquidityPoolEntity>>,
      get: id => option<liquidityPoolEntity>,
      getToken0: liquidityPoolEntity => tokenEntity,
      getToken1: liquidityPoolEntity => tokenEntity,
      set: liquidityPoolEntity => unit,
      delete: id => unit,
    }

    type liquidityPoolEntityHandlerContextAsync = {
      singlePool: option<liquidityPoolEntity>,
      stablecoinPools: array<option<liquidityPoolEntity>>,
      whitelistedPools: array<option<liquidityPoolEntity>>,
      get: id => promise<option<liquidityPoolEntity>>,
      getToken0: liquidityPoolEntity => promise<tokenEntity>,
      getToken1: liquidityPoolEntity => promise<tokenEntity>,
      set: liquidityPoolEntity => unit,
      delete: id => unit,
    }

    // Entity: LiquidityPoolDailySnapshot
    type liquidityPoolDailySnapshotEntityHandlerContext = {
      set: liquidityPoolDailySnapshotEntity => unit,
      delete: id => unit,
    }

    type liquidityPoolDailySnapshotEntityHandlerContextAsync = {
      set: liquidityPoolDailySnapshotEntity => unit,
      delete: id => unit,
    }

    // Entity: LiquidityPoolHourlySnapshot
    type liquidityPoolHourlySnapshotEntityHandlerContext = {
      set: liquidityPoolHourlySnapshotEntity => unit,
      delete: id => unit,
    }

    type liquidityPoolHourlySnapshotEntityHandlerContextAsync = {
      set: liquidityPoolHourlySnapshotEntity => unit,
      delete: id => unit,
    }

    // Entity: LiquidityPoolUserMapping
    type liquidityPoolUserMappingEntityHandlerContext = {
      getLiquidityPool: liquidityPoolUserMappingEntity => liquidityPoolEntity,
      getUser: liquidityPoolUserMappingEntity => userEntity,
      set: liquidityPoolUserMappingEntity => unit,
      delete: id => unit,
    }

    type liquidityPoolUserMappingEntityHandlerContextAsync = {
      getLiquidityPool: liquidityPoolUserMappingEntity => promise<liquidityPoolEntity>,
      getUser: liquidityPoolUserMappingEntity => promise<userEntity>,
      set: liquidityPoolUserMappingEntity => unit,
      delete: id => unit,
    }

    // Entity: LiquidityPoolWeeklySnapshot
    type liquidityPoolWeeklySnapshotEntityHandlerContext = {
      set: liquidityPoolWeeklySnapshotEntity => unit,
      delete: id => unit,
    }

    type liquidityPoolWeeklySnapshotEntityHandlerContextAsync = {
      set: liquidityPoolWeeklySnapshotEntity => unit,
      delete: id => unit,
    }

    // Entity: StateStore
    type stateStoreEntityHandlerContext = {
      stateStore: option<stateStoreEntity>,
      get: id => option<stateStoreEntity>,
      getLatestEthPrice: stateStoreEntity => latestETHPriceEntity,
      set: stateStoreEntity => unit,
      delete: id => unit,
    }

    type stateStoreEntityHandlerContextAsync = {
      stateStore: option<stateStoreEntity>,
      get: id => promise<option<stateStoreEntity>>,
      getLatestEthPrice: stateStoreEntity => promise<latestETHPriceEntity>,
      set: stateStoreEntity => unit,
      delete: id => unit,
    }

    // Entity: Token
    type tokenEntityHandlerContext = {
      whitelistedTokens: array<option<tokenEntity>>,
      get: id => option<tokenEntity>,
      set: tokenEntity => unit,
      delete: id => unit,
    }

    type tokenEntityHandlerContextAsync = {
      whitelistedTokens: array<option<tokenEntity>>,
      get: id => promise<option<tokenEntity>>,
      set: tokenEntity => unit,
      delete: id => unit,
    }

    // Entity: TokenDailySnapshot
    type tokenDailySnapshotEntityHandlerContext = {
      set: tokenDailySnapshotEntity => unit,
      delete: id => unit,
    }

    type tokenDailySnapshotEntityHandlerContextAsync = {
      set: tokenDailySnapshotEntity => unit,
      delete: id => unit,
    }

    // Entity: TokenHourlySnapshot
    type tokenHourlySnapshotEntityHandlerContext = {
      set: tokenHourlySnapshotEntity => unit,
      delete: id => unit,
    }

    type tokenHourlySnapshotEntityHandlerContextAsync = {
      set: tokenHourlySnapshotEntity => unit,
      delete: id => unit,
    }

    // Entity: TokenWeeklySnapshot
    type tokenWeeklySnapshotEntityHandlerContext = {
      set: tokenWeeklySnapshotEntity => unit,
      delete: id => unit,
    }

    type tokenWeeklySnapshotEntityHandlerContextAsync = {
      set: tokenWeeklySnapshotEntity => unit,
      delete: id => unit,
    }

    // Entity: User
    type userEntityHandlerContext = {
      set: userEntity => unit,
      delete: id => unit,
    }

    type userEntityHandlerContextAsync = {
      set: userEntity => unit,
      delete: id => unit,
    }

    @genType
    type handlerContext = {
      log: Logs.userLogger,
      @as("Gauge") gauge: gaugeEntityHandlerContext,
      @as("LatestETHPrice") latestETHPrice: latestETHPriceEntityHandlerContext,
      @as("LiquidityPool") liquidityPool: liquidityPoolEntityHandlerContext,
      @as("LiquidityPoolDailySnapshot")
      liquidityPoolDailySnapshot: liquidityPoolDailySnapshotEntityHandlerContext,
      @as("LiquidityPoolHourlySnapshot")
      liquidityPoolHourlySnapshot: liquidityPoolHourlySnapshotEntityHandlerContext,
      @as("LiquidityPoolUserMapping")
      liquidityPoolUserMapping: liquidityPoolUserMappingEntityHandlerContext,
      @as("LiquidityPoolWeeklySnapshot")
      liquidityPoolWeeklySnapshot: liquidityPoolWeeklySnapshotEntityHandlerContext,
      @as("StateStore") stateStore: stateStoreEntityHandlerContext,
      @as("Token") token: tokenEntityHandlerContext,
      @as("TokenDailySnapshot") tokenDailySnapshot: tokenDailySnapshotEntityHandlerContext,
      @as("TokenHourlySnapshot") tokenHourlySnapshot: tokenHourlySnapshotEntityHandlerContext,
      @as("TokenWeeklySnapshot") tokenWeeklySnapshot: tokenWeeklySnapshotEntityHandlerContext,
      @as("User") user: userEntityHandlerContext,
    }
    @genType
    type handlerContextAsync = {
      log: Logs.userLogger,
      @as("Gauge") gauge: gaugeEntityHandlerContextAsync,
      @as("LatestETHPrice") latestETHPrice: latestETHPriceEntityHandlerContextAsync,
      @as("LiquidityPool") liquidityPool: liquidityPoolEntityHandlerContextAsync,
      @as("LiquidityPoolDailySnapshot")
      liquidityPoolDailySnapshot: liquidityPoolDailySnapshotEntityHandlerContextAsync,
      @as("LiquidityPoolHourlySnapshot")
      liquidityPoolHourlySnapshot: liquidityPoolHourlySnapshotEntityHandlerContextAsync,
      @as("LiquidityPoolUserMapping")
      liquidityPoolUserMapping: liquidityPoolUserMappingEntityHandlerContextAsync,
      @as("LiquidityPoolWeeklySnapshot")
      liquidityPoolWeeklySnapshot: liquidityPoolWeeklySnapshotEntityHandlerContextAsync,
      @as("StateStore") stateStore: stateStoreEntityHandlerContextAsync,
      @as("Token") token: tokenEntityHandlerContextAsync,
      @as("TokenDailySnapshot") tokenDailySnapshot: tokenDailySnapshotEntityHandlerContextAsync,
      @as("TokenHourlySnapshot") tokenHourlySnapshot: tokenHourlySnapshotEntityHandlerContextAsync,
      @as("TokenWeeklySnapshot") tokenWeeklySnapshot: tokenWeeklySnapshotEntityHandlerContextAsync,
      @as("User") user: userEntityHandlerContextAsync,
    }

    @genType
    type stateStoreEntityLoaderContext = {
      stateStoreLoad: (id, ~loaders: stateStoreLoaderConfig=?) => unit,
      load: (id, ~loaders: stateStoreLoaderConfig=?) => unit,
    }
    @genType
    type liquidityPoolEntityLoaderContext = {
      singlePoolLoad: (id, ~loaders: liquidityPoolLoaderConfig=?) => unit,
      stablecoinPoolsLoad: (array<id>, ~loaders: liquidityPoolLoaderConfig=?) => unit,
      whitelistedPoolsLoad: (array<id>, ~loaders: liquidityPoolLoaderConfig=?) => unit,
      load: (id, ~loaders: liquidityPoolLoaderConfig=?) => unit,
    }
    @genType
    type tokenEntityLoaderContext = {
      whitelistedTokensLoad: array<id> => unit,
      load: id => unit,
    }

    @genType
    type contractRegistrations = {
      //TODO only add contracts we've registered for the event in the config
      addPool: Ethers.ethAddress => unit,
      //TODO only add contracts we've registered for the event in the config
      addPoolFactory: Ethers.ethAddress => unit,
      //TODO only add contracts we've registered for the event in the config
      addVoter: Ethers.ethAddress => unit,
    }
    @genType
    type loaderContext = {
      log: Logs.userLogger,
      contractRegistration: contractRegistrations,
      @as("StateStore") stateStore: stateStoreEntityLoaderContext,
      @as("LiquidityPool") liquidityPool: liquidityPoolEntityLoaderContext,
      @as("Token") token: tokenEntityLoaderContext,
    }
  }
}
module PoolFactoryContract = {
  module PoolCreatedEvent = {
    //Note: each parameter is using a binding of its index to help with binding in ethers
    //This handles both unamed params and also named params that clash with reserved keywords
    //eg. if an event param is called "values" it will clash since eventArgs will have a '.values()' iterator
    type ethersEventArgs = {
      @as("0") token0: Ethers.ethAddress,
      @as("1") token1: Ethers.ethAddress,
      @as("2") stable: bool,
      @as("3") pool: Ethers.ethAddress,
      @as("4") unnamed: Ethers.BigInt.t,
    }

    @spice @genType
    type eventArgs = {
      token0: Ethers.ethAddress,
      token1: Ethers.ethAddress,
      stable: bool,
      pool: Ethers.ethAddress,
      unnamed: Ethers.BigInt.t,
    }

    @genType.as("PoolFactoryContract_PoolCreated_EventLog")
    type log = eventLog<eventArgs>

    // Entity: Gauge
    type gaugeEntityHandlerContext = {
      getPool: gaugeEntity => liquidityPoolEntity,
      set: gaugeEntity => unit,
      delete: id => unit,
    }

    type gaugeEntityHandlerContextAsync = {
      getPool: gaugeEntity => promise<liquidityPoolEntity>,
      set: gaugeEntity => unit,
      delete: id => unit,
    }

    // Entity: LatestETHPrice
    type latestETHPriceEntityHandlerContext = {
      set: latestETHPriceEntity => unit,
      delete: id => unit,
    }

    type latestETHPriceEntityHandlerContextAsync = {
      set: latestETHPriceEntity => unit,
      delete: id => unit,
    }

    // Entity: LiquidityPool
    type liquidityPoolEntityHandlerContext = {
      getToken0: liquidityPoolEntity => tokenEntity,
      getToken1: liquidityPoolEntity => tokenEntity,
      set: liquidityPoolEntity => unit,
      delete: id => unit,
    }

    type liquidityPoolEntityHandlerContextAsync = {
      getToken0: liquidityPoolEntity => promise<tokenEntity>,
      getToken1: liquidityPoolEntity => promise<tokenEntity>,
      set: liquidityPoolEntity => unit,
      delete: id => unit,
    }

    // Entity: LiquidityPoolDailySnapshot
    type liquidityPoolDailySnapshotEntityHandlerContext = {
      set: liquidityPoolDailySnapshotEntity => unit,
      delete: id => unit,
    }

    type liquidityPoolDailySnapshotEntityHandlerContextAsync = {
      set: liquidityPoolDailySnapshotEntity => unit,
      delete: id => unit,
    }

    // Entity: LiquidityPoolHourlySnapshot
    type liquidityPoolHourlySnapshotEntityHandlerContext = {
      set: liquidityPoolHourlySnapshotEntity => unit,
      delete: id => unit,
    }

    type liquidityPoolHourlySnapshotEntityHandlerContextAsync = {
      set: liquidityPoolHourlySnapshotEntity => unit,
      delete: id => unit,
    }

    // Entity: LiquidityPoolUserMapping
    type liquidityPoolUserMappingEntityHandlerContext = {
      getLiquidityPool: liquidityPoolUserMappingEntity => liquidityPoolEntity,
      getUser: liquidityPoolUserMappingEntity => userEntity,
      set: liquidityPoolUserMappingEntity => unit,
      delete: id => unit,
    }

    type liquidityPoolUserMappingEntityHandlerContextAsync = {
      getLiquidityPool: liquidityPoolUserMappingEntity => promise<liquidityPoolEntity>,
      getUser: liquidityPoolUserMappingEntity => promise<userEntity>,
      set: liquidityPoolUserMappingEntity => unit,
      delete: id => unit,
    }

    // Entity: LiquidityPoolWeeklySnapshot
    type liquidityPoolWeeklySnapshotEntityHandlerContext = {
      set: liquidityPoolWeeklySnapshotEntity => unit,
      delete: id => unit,
    }

    type liquidityPoolWeeklySnapshotEntityHandlerContextAsync = {
      set: liquidityPoolWeeklySnapshotEntity => unit,
      delete: id => unit,
    }

    // Entity: StateStore
    type stateStoreEntityHandlerContext = {
      stateStore: option<stateStoreEntity>,
      get: id => option<stateStoreEntity>,
      getLatestEthPrice: stateStoreEntity => latestETHPriceEntity,
      set: stateStoreEntity => unit,
      delete: id => unit,
    }

    type stateStoreEntityHandlerContextAsync = {
      stateStore: option<stateStoreEntity>,
      get: id => promise<option<stateStoreEntity>>,
      getLatestEthPrice: stateStoreEntity => promise<latestETHPriceEntity>,
      set: stateStoreEntity => unit,
      delete: id => unit,
    }

    // Entity: Token
    type tokenEntityHandlerContext = {
      set: tokenEntity => unit,
      delete: id => unit,
    }

    type tokenEntityHandlerContextAsync = {
      set: tokenEntity => unit,
      delete: id => unit,
    }

    // Entity: TokenDailySnapshot
    type tokenDailySnapshotEntityHandlerContext = {
      set: tokenDailySnapshotEntity => unit,
      delete: id => unit,
    }

    type tokenDailySnapshotEntityHandlerContextAsync = {
      set: tokenDailySnapshotEntity => unit,
      delete: id => unit,
    }

    // Entity: TokenHourlySnapshot
    type tokenHourlySnapshotEntityHandlerContext = {
      set: tokenHourlySnapshotEntity => unit,
      delete: id => unit,
    }

    type tokenHourlySnapshotEntityHandlerContextAsync = {
      set: tokenHourlySnapshotEntity => unit,
      delete: id => unit,
    }

    // Entity: TokenWeeklySnapshot
    type tokenWeeklySnapshotEntityHandlerContext = {
      set: tokenWeeklySnapshotEntity => unit,
      delete: id => unit,
    }

    type tokenWeeklySnapshotEntityHandlerContextAsync = {
      set: tokenWeeklySnapshotEntity => unit,
      delete: id => unit,
    }

    // Entity: User
    type userEntityHandlerContext = {
      set: userEntity => unit,
      delete: id => unit,
    }

    type userEntityHandlerContextAsync = {
      set: userEntity => unit,
      delete: id => unit,
    }

    @genType
    type handlerContext = {
      log: Logs.userLogger,
      @as("Gauge") gauge: gaugeEntityHandlerContext,
      @as("LatestETHPrice") latestETHPrice: latestETHPriceEntityHandlerContext,
      @as("LiquidityPool") liquidityPool: liquidityPoolEntityHandlerContext,
      @as("LiquidityPoolDailySnapshot")
      liquidityPoolDailySnapshot: liquidityPoolDailySnapshotEntityHandlerContext,
      @as("LiquidityPoolHourlySnapshot")
      liquidityPoolHourlySnapshot: liquidityPoolHourlySnapshotEntityHandlerContext,
      @as("LiquidityPoolUserMapping")
      liquidityPoolUserMapping: liquidityPoolUserMappingEntityHandlerContext,
      @as("LiquidityPoolWeeklySnapshot")
      liquidityPoolWeeklySnapshot: liquidityPoolWeeklySnapshotEntityHandlerContext,
      @as("StateStore") stateStore: stateStoreEntityHandlerContext,
      @as("Token") token: tokenEntityHandlerContext,
      @as("TokenDailySnapshot") tokenDailySnapshot: tokenDailySnapshotEntityHandlerContext,
      @as("TokenHourlySnapshot") tokenHourlySnapshot: tokenHourlySnapshotEntityHandlerContext,
      @as("TokenWeeklySnapshot") tokenWeeklySnapshot: tokenWeeklySnapshotEntityHandlerContext,
      @as("User") user: userEntityHandlerContext,
    }
    @genType
    type handlerContextAsync = {
      log: Logs.userLogger,
      @as("Gauge") gauge: gaugeEntityHandlerContextAsync,
      @as("LatestETHPrice") latestETHPrice: latestETHPriceEntityHandlerContextAsync,
      @as("LiquidityPool") liquidityPool: liquidityPoolEntityHandlerContextAsync,
      @as("LiquidityPoolDailySnapshot")
      liquidityPoolDailySnapshot: liquidityPoolDailySnapshotEntityHandlerContextAsync,
      @as("LiquidityPoolHourlySnapshot")
      liquidityPoolHourlySnapshot: liquidityPoolHourlySnapshotEntityHandlerContextAsync,
      @as("LiquidityPoolUserMapping")
      liquidityPoolUserMapping: liquidityPoolUserMappingEntityHandlerContextAsync,
      @as("LiquidityPoolWeeklySnapshot")
      liquidityPoolWeeklySnapshot: liquidityPoolWeeklySnapshotEntityHandlerContextAsync,
      @as("StateStore") stateStore: stateStoreEntityHandlerContextAsync,
      @as("Token") token: tokenEntityHandlerContextAsync,
      @as("TokenDailySnapshot") tokenDailySnapshot: tokenDailySnapshotEntityHandlerContextAsync,
      @as("TokenHourlySnapshot") tokenHourlySnapshot: tokenHourlySnapshotEntityHandlerContextAsync,
      @as("TokenWeeklySnapshot") tokenWeeklySnapshot: tokenWeeklySnapshotEntityHandlerContextAsync,
      @as("User") user: userEntityHandlerContextAsync,
    }

    @genType
    type stateStoreEntityLoaderContext = {
      stateStoreLoad: (id, ~loaders: stateStoreLoaderConfig=?) => unit,
      load: (id, ~loaders: stateStoreLoaderConfig=?) => unit,
    }

    @genType
    type contractRegistrations = {
      //TODO only add contracts we've registered for the event in the config
      addPool: Ethers.ethAddress => unit,
      //TODO only add contracts we've registered for the event in the config
      addPoolFactory: Ethers.ethAddress => unit,
      //TODO only add contracts we've registered for the event in the config
      addVoter: Ethers.ethAddress => unit,
    }
    @genType
    type loaderContext = {
      log: Logs.userLogger,
      contractRegistration: contractRegistrations,
      @as("StateStore") stateStore: stateStoreEntityLoaderContext,
    }
  }
}
module VoterContract = {
  module DistributeRewardEvent = {
    //Note: each parameter is using a binding of its index to help with binding in ethers
    //This handles both unamed params and also named params that clash with reserved keywords
    //eg. if an event param is called "values" it will clash since eventArgs will have a '.values()' iterator
    type ethersEventArgs = {
      @as("0") sender: Ethers.ethAddress,
      @as("1") gauge: Ethers.ethAddress,
      @as("2") amount: Ethers.BigInt.t,
    }

    @spice @genType
    type eventArgs = {
      sender: Ethers.ethAddress,
      gauge: Ethers.ethAddress,
      amount: Ethers.BigInt.t,
    }

    @genType.as("VoterContract_DistributeReward_EventLog")
    type log = eventLog<eventArgs>

    // Entity: Gauge
    type gaugeEntityHandlerContext = {
      get: id => option<gaugeEntity>,
      getPool: gaugeEntity => liquidityPoolEntity,
      set: gaugeEntity => unit,
      delete: id => unit,
    }

    type gaugeEntityHandlerContextAsync = {
      get: id => promise<option<gaugeEntity>>,
      getPool: gaugeEntity => promise<liquidityPoolEntity>,
      set: gaugeEntity => unit,
      delete: id => unit,
    }

    // Entity: LatestETHPrice
    type latestETHPriceEntityHandlerContext = {
      set: latestETHPriceEntity => unit,
      delete: id => unit,
    }

    type latestETHPriceEntityHandlerContextAsync = {
      set: latestETHPriceEntity => unit,
      delete: id => unit,
    }

    // Entity: LiquidityPool
    type liquidityPoolEntityHandlerContext = {
      getToken0: liquidityPoolEntity => tokenEntity,
      getToken1: liquidityPoolEntity => tokenEntity,
      set: liquidityPoolEntity => unit,
      delete: id => unit,
    }

    type liquidityPoolEntityHandlerContextAsync = {
      getToken0: liquidityPoolEntity => promise<tokenEntity>,
      getToken1: liquidityPoolEntity => promise<tokenEntity>,
      set: liquidityPoolEntity => unit,
      delete: id => unit,
    }

    // Entity: LiquidityPoolDailySnapshot
    type liquidityPoolDailySnapshotEntityHandlerContext = {
      set: liquidityPoolDailySnapshotEntity => unit,
      delete: id => unit,
    }

    type liquidityPoolDailySnapshotEntityHandlerContextAsync = {
      set: liquidityPoolDailySnapshotEntity => unit,
      delete: id => unit,
    }

    // Entity: LiquidityPoolHourlySnapshot
    type liquidityPoolHourlySnapshotEntityHandlerContext = {
      set: liquidityPoolHourlySnapshotEntity => unit,
      delete: id => unit,
    }

    type liquidityPoolHourlySnapshotEntityHandlerContextAsync = {
      set: liquidityPoolHourlySnapshotEntity => unit,
      delete: id => unit,
    }

    // Entity: LiquidityPoolUserMapping
    type liquidityPoolUserMappingEntityHandlerContext = {
      getLiquidityPool: liquidityPoolUserMappingEntity => liquidityPoolEntity,
      getUser: liquidityPoolUserMappingEntity => userEntity,
      set: liquidityPoolUserMappingEntity => unit,
      delete: id => unit,
    }

    type liquidityPoolUserMappingEntityHandlerContextAsync = {
      getLiquidityPool: liquidityPoolUserMappingEntity => promise<liquidityPoolEntity>,
      getUser: liquidityPoolUserMappingEntity => promise<userEntity>,
      set: liquidityPoolUserMappingEntity => unit,
      delete: id => unit,
    }

    // Entity: LiquidityPoolWeeklySnapshot
    type liquidityPoolWeeklySnapshotEntityHandlerContext = {
      set: liquidityPoolWeeklySnapshotEntity => unit,
      delete: id => unit,
    }

    type liquidityPoolWeeklySnapshotEntityHandlerContextAsync = {
      set: liquidityPoolWeeklySnapshotEntity => unit,
      delete: id => unit,
    }

    // Entity: StateStore
    type stateStoreEntityHandlerContext = {
      getLatestEthPrice: stateStoreEntity => latestETHPriceEntity,
      set: stateStoreEntity => unit,
      delete: id => unit,
    }

    type stateStoreEntityHandlerContextAsync = {
      getLatestEthPrice: stateStoreEntity => promise<latestETHPriceEntity>,
      set: stateStoreEntity => unit,
      delete: id => unit,
    }

    // Entity: Token
    type tokenEntityHandlerContext = {
      rewardToken: option<tokenEntity>,
      get: id => option<tokenEntity>,
      set: tokenEntity => unit,
      delete: id => unit,
    }

    type tokenEntityHandlerContextAsync = {
      rewardToken: option<tokenEntity>,
      get: id => promise<option<tokenEntity>>,
      set: tokenEntity => unit,
      delete: id => unit,
    }

    // Entity: TokenDailySnapshot
    type tokenDailySnapshotEntityHandlerContext = {
      set: tokenDailySnapshotEntity => unit,
      delete: id => unit,
    }

    type tokenDailySnapshotEntityHandlerContextAsync = {
      set: tokenDailySnapshotEntity => unit,
      delete: id => unit,
    }

    // Entity: TokenHourlySnapshot
    type tokenHourlySnapshotEntityHandlerContext = {
      set: tokenHourlySnapshotEntity => unit,
      delete: id => unit,
    }

    type tokenHourlySnapshotEntityHandlerContextAsync = {
      set: tokenHourlySnapshotEntity => unit,
      delete: id => unit,
    }

    // Entity: TokenWeeklySnapshot
    type tokenWeeklySnapshotEntityHandlerContext = {
      set: tokenWeeklySnapshotEntity => unit,
      delete: id => unit,
    }

    type tokenWeeklySnapshotEntityHandlerContextAsync = {
      set: tokenWeeklySnapshotEntity => unit,
      delete: id => unit,
    }

    // Entity: User
    type userEntityHandlerContext = {
      set: userEntity => unit,
      delete: id => unit,
    }

    type userEntityHandlerContextAsync = {
      set: userEntity => unit,
      delete: id => unit,
    }

    @genType
    type handlerContext = {
      log: Logs.userLogger,
      @as("Gauge") gauge: gaugeEntityHandlerContext,
      @as("LatestETHPrice") latestETHPrice: latestETHPriceEntityHandlerContext,
      @as("LiquidityPool") liquidityPool: liquidityPoolEntityHandlerContext,
      @as("LiquidityPoolDailySnapshot")
      liquidityPoolDailySnapshot: liquidityPoolDailySnapshotEntityHandlerContext,
      @as("LiquidityPoolHourlySnapshot")
      liquidityPoolHourlySnapshot: liquidityPoolHourlySnapshotEntityHandlerContext,
      @as("LiquidityPoolUserMapping")
      liquidityPoolUserMapping: liquidityPoolUserMappingEntityHandlerContext,
      @as("LiquidityPoolWeeklySnapshot")
      liquidityPoolWeeklySnapshot: liquidityPoolWeeklySnapshotEntityHandlerContext,
      @as("StateStore") stateStore: stateStoreEntityHandlerContext,
      @as("Token") token: tokenEntityHandlerContext,
      @as("TokenDailySnapshot") tokenDailySnapshot: tokenDailySnapshotEntityHandlerContext,
      @as("TokenHourlySnapshot") tokenHourlySnapshot: tokenHourlySnapshotEntityHandlerContext,
      @as("TokenWeeklySnapshot") tokenWeeklySnapshot: tokenWeeklySnapshotEntityHandlerContext,
      @as("User") user: userEntityHandlerContext,
    }
    @genType
    type handlerContextAsync = {
      log: Logs.userLogger,
      @as("Gauge") gauge: gaugeEntityHandlerContextAsync,
      @as("LatestETHPrice") latestETHPrice: latestETHPriceEntityHandlerContextAsync,
      @as("LiquidityPool") liquidityPool: liquidityPoolEntityHandlerContextAsync,
      @as("LiquidityPoolDailySnapshot")
      liquidityPoolDailySnapshot: liquidityPoolDailySnapshotEntityHandlerContextAsync,
      @as("LiquidityPoolHourlySnapshot")
      liquidityPoolHourlySnapshot: liquidityPoolHourlySnapshotEntityHandlerContextAsync,
      @as("LiquidityPoolUserMapping")
      liquidityPoolUserMapping: liquidityPoolUserMappingEntityHandlerContextAsync,
      @as("LiquidityPoolWeeklySnapshot")
      liquidityPoolWeeklySnapshot: liquidityPoolWeeklySnapshotEntityHandlerContextAsync,
      @as("StateStore") stateStore: stateStoreEntityHandlerContextAsync,
      @as("Token") token: tokenEntityHandlerContextAsync,
      @as("TokenDailySnapshot") tokenDailySnapshot: tokenDailySnapshotEntityHandlerContextAsync,
      @as("TokenHourlySnapshot") tokenHourlySnapshot: tokenHourlySnapshotEntityHandlerContextAsync,
      @as("TokenWeeklySnapshot") tokenWeeklySnapshot: tokenWeeklySnapshotEntityHandlerContextAsync,
      @as("User") user: userEntityHandlerContextAsync,
    }

    @genType
    type gaugeEntityLoaderContext = {load: (id, ~loaders: gaugeLoaderConfig=?) => unit}
    @genType
    type tokenEntityLoaderContext = {
      rewardTokenLoad: id => unit,
      load: id => unit,
    }

    @genType
    type contractRegistrations = {
      //TODO only add contracts we've registered for the event in the config
      addPool: Ethers.ethAddress => unit,
      //TODO only add contracts we've registered for the event in the config
      addPoolFactory: Ethers.ethAddress => unit,
      //TODO only add contracts we've registered for the event in the config
      addVoter: Ethers.ethAddress => unit,
    }
    @genType
    type loaderContext = {
      log: Logs.userLogger,
      contractRegistration: contractRegistrations,
      @as("Gauge") gauge: gaugeEntityLoaderContext,
      @as("Token") token: tokenEntityLoaderContext,
    }
  }
  module GaugeCreatedEvent = {
    //Note: each parameter is using a binding of its index to help with binding in ethers
    //This handles both unamed params and also named params that clash with reserved keywords
    //eg. if an event param is called "values" it will clash since eventArgs will have a '.values()' iterator
    type ethersEventArgs = {
      @as("0") poolFactory: Ethers.ethAddress,
      @as("1") votingRewardsFactory: Ethers.ethAddress,
      @as("2") gaugeFactory: Ethers.ethAddress,
      @as("3") pool: Ethers.ethAddress,
      @as("4") bribeVotingReward: Ethers.ethAddress,
      @as("5") feeVotingReward: Ethers.ethAddress,
      @as("6") gauge: Ethers.ethAddress,
      @as("7") creator: Ethers.ethAddress,
    }

    @spice @genType
    type eventArgs = {
      poolFactory: Ethers.ethAddress,
      votingRewardsFactory: Ethers.ethAddress,
      gaugeFactory: Ethers.ethAddress,
      pool: Ethers.ethAddress,
      bribeVotingReward: Ethers.ethAddress,
      feeVotingReward: Ethers.ethAddress,
      gauge: Ethers.ethAddress,
      creator: Ethers.ethAddress,
    }

    @genType.as("VoterContract_GaugeCreated_EventLog")
    type log = eventLog<eventArgs>

    // Entity: Gauge
    type gaugeEntityHandlerContext = {
      getPool: gaugeEntity => liquidityPoolEntity,
      set: gaugeEntity => unit,
      delete: id => unit,
    }

    type gaugeEntityHandlerContextAsync = {
      getPool: gaugeEntity => promise<liquidityPoolEntity>,
      set: gaugeEntity => unit,
      delete: id => unit,
    }

    // Entity: LatestETHPrice
    type latestETHPriceEntityHandlerContext = {
      set: latestETHPriceEntity => unit,
      delete: id => unit,
    }

    type latestETHPriceEntityHandlerContextAsync = {
      set: latestETHPriceEntity => unit,
      delete: id => unit,
    }

    // Entity: LiquidityPool
    type liquidityPoolEntityHandlerContext = {
      get: id => option<liquidityPoolEntity>,
      getToken0: liquidityPoolEntity => tokenEntity,
      getToken1: liquidityPoolEntity => tokenEntity,
      set: liquidityPoolEntity => unit,
      delete: id => unit,
    }

    type liquidityPoolEntityHandlerContextAsync = {
      get: id => promise<option<liquidityPoolEntity>>,
      getToken0: liquidityPoolEntity => promise<tokenEntity>,
      getToken1: liquidityPoolEntity => promise<tokenEntity>,
      set: liquidityPoolEntity => unit,
      delete: id => unit,
    }

    // Entity: LiquidityPoolDailySnapshot
    type liquidityPoolDailySnapshotEntityHandlerContext = {
      set: liquidityPoolDailySnapshotEntity => unit,
      delete: id => unit,
    }

    type liquidityPoolDailySnapshotEntityHandlerContextAsync = {
      set: liquidityPoolDailySnapshotEntity => unit,
      delete: id => unit,
    }

    // Entity: LiquidityPoolHourlySnapshot
    type liquidityPoolHourlySnapshotEntityHandlerContext = {
      set: liquidityPoolHourlySnapshotEntity => unit,
      delete: id => unit,
    }

    type liquidityPoolHourlySnapshotEntityHandlerContextAsync = {
      set: liquidityPoolHourlySnapshotEntity => unit,
      delete: id => unit,
    }

    // Entity: LiquidityPoolUserMapping
    type liquidityPoolUserMappingEntityHandlerContext = {
      getLiquidityPool: liquidityPoolUserMappingEntity => liquidityPoolEntity,
      getUser: liquidityPoolUserMappingEntity => userEntity,
      set: liquidityPoolUserMappingEntity => unit,
      delete: id => unit,
    }

    type liquidityPoolUserMappingEntityHandlerContextAsync = {
      getLiquidityPool: liquidityPoolUserMappingEntity => promise<liquidityPoolEntity>,
      getUser: liquidityPoolUserMappingEntity => promise<userEntity>,
      set: liquidityPoolUserMappingEntity => unit,
      delete: id => unit,
    }

    // Entity: LiquidityPoolWeeklySnapshot
    type liquidityPoolWeeklySnapshotEntityHandlerContext = {
      set: liquidityPoolWeeklySnapshotEntity => unit,
      delete: id => unit,
    }

    type liquidityPoolWeeklySnapshotEntityHandlerContextAsync = {
      set: liquidityPoolWeeklySnapshotEntity => unit,
      delete: id => unit,
    }

    // Entity: StateStore
    type stateStoreEntityHandlerContext = {
      getLatestEthPrice: stateStoreEntity => latestETHPriceEntity,
      set: stateStoreEntity => unit,
      delete: id => unit,
    }

    type stateStoreEntityHandlerContextAsync = {
      getLatestEthPrice: stateStoreEntity => promise<latestETHPriceEntity>,
      set: stateStoreEntity => unit,
      delete: id => unit,
    }

    // Entity: Token
    type tokenEntityHandlerContext = {
      set: tokenEntity => unit,
      delete: id => unit,
    }

    type tokenEntityHandlerContextAsync = {
      set: tokenEntity => unit,
      delete: id => unit,
    }

    // Entity: TokenDailySnapshot
    type tokenDailySnapshotEntityHandlerContext = {
      set: tokenDailySnapshotEntity => unit,
      delete: id => unit,
    }

    type tokenDailySnapshotEntityHandlerContextAsync = {
      set: tokenDailySnapshotEntity => unit,
      delete: id => unit,
    }

    // Entity: TokenHourlySnapshot
    type tokenHourlySnapshotEntityHandlerContext = {
      set: tokenHourlySnapshotEntity => unit,
      delete: id => unit,
    }

    type tokenHourlySnapshotEntityHandlerContextAsync = {
      set: tokenHourlySnapshotEntity => unit,
      delete: id => unit,
    }

    // Entity: TokenWeeklySnapshot
    type tokenWeeklySnapshotEntityHandlerContext = {
      set: tokenWeeklySnapshotEntity => unit,
      delete: id => unit,
    }

    type tokenWeeklySnapshotEntityHandlerContextAsync = {
      set: tokenWeeklySnapshotEntity => unit,
      delete: id => unit,
    }

    // Entity: User
    type userEntityHandlerContext = {
      set: userEntity => unit,
      delete: id => unit,
    }

    type userEntityHandlerContextAsync = {
      set: userEntity => unit,
      delete: id => unit,
    }

    @genType
    type handlerContext = {
      log: Logs.userLogger,
      @as("Gauge") gauge: gaugeEntityHandlerContext,
      @as("LatestETHPrice") latestETHPrice: latestETHPriceEntityHandlerContext,
      @as("LiquidityPool") liquidityPool: liquidityPoolEntityHandlerContext,
      @as("LiquidityPoolDailySnapshot")
      liquidityPoolDailySnapshot: liquidityPoolDailySnapshotEntityHandlerContext,
      @as("LiquidityPoolHourlySnapshot")
      liquidityPoolHourlySnapshot: liquidityPoolHourlySnapshotEntityHandlerContext,
      @as("LiquidityPoolUserMapping")
      liquidityPoolUserMapping: liquidityPoolUserMappingEntityHandlerContext,
      @as("LiquidityPoolWeeklySnapshot")
      liquidityPoolWeeklySnapshot: liquidityPoolWeeklySnapshotEntityHandlerContext,
      @as("StateStore") stateStore: stateStoreEntityHandlerContext,
      @as("Token") token: tokenEntityHandlerContext,
      @as("TokenDailySnapshot") tokenDailySnapshot: tokenDailySnapshotEntityHandlerContext,
      @as("TokenHourlySnapshot") tokenHourlySnapshot: tokenHourlySnapshotEntityHandlerContext,
      @as("TokenWeeklySnapshot") tokenWeeklySnapshot: tokenWeeklySnapshotEntityHandlerContext,
      @as("User") user: userEntityHandlerContext,
    }
    @genType
    type handlerContextAsync = {
      log: Logs.userLogger,
      @as("Gauge") gauge: gaugeEntityHandlerContextAsync,
      @as("LatestETHPrice") latestETHPrice: latestETHPriceEntityHandlerContextAsync,
      @as("LiquidityPool") liquidityPool: liquidityPoolEntityHandlerContextAsync,
      @as("LiquidityPoolDailySnapshot")
      liquidityPoolDailySnapshot: liquidityPoolDailySnapshotEntityHandlerContextAsync,
      @as("LiquidityPoolHourlySnapshot")
      liquidityPoolHourlySnapshot: liquidityPoolHourlySnapshotEntityHandlerContextAsync,
      @as("LiquidityPoolUserMapping")
      liquidityPoolUserMapping: liquidityPoolUserMappingEntityHandlerContextAsync,
      @as("LiquidityPoolWeeklySnapshot")
      liquidityPoolWeeklySnapshot: liquidityPoolWeeklySnapshotEntityHandlerContextAsync,
      @as("StateStore") stateStore: stateStoreEntityHandlerContextAsync,
      @as("Token") token: tokenEntityHandlerContextAsync,
      @as("TokenDailySnapshot") tokenDailySnapshot: tokenDailySnapshotEntityHandlerContextAsync,
      @as("TokenHourlySnapshot") tokenHourlySnapshot: tokenHourlySnapshotEntityHandlerContextAsync,
      @as("TokenWeeklySnapshot") tokenWeeklySnapshot: tokenWeeklySnapshotEntityHandlerContextAsync,
      @as("User") user: userEntityHandlerContextAsync,
    }

    @genType
    type liquidityPoolEntityLoaderContext = {
      load: (id, ~loaders: liquidityPoolLoaderConfig=?) => unit,
    }

    @genType
    type contractRegistrations = {
      //TODO only add contracts we've registered for the event in the config
      addPool: Ethers.ethAddress => unit,
      //TODO only add contracts we've registered for the event in the config
      addPoolFactory: Ethers.ethAddress => unit,
      //TODO only add contracts we've registered for the event in the config
      addVoter: Ethers.ethAddress => unit,
    }
    @genType
    type loaderContext = {
      log: Logs.userLogger,
      contractRegistration: contractRegistrations,
      @as("LiquidityPool") liquidityPool: liquidityPoolEntityLoaderContext,
    }
  }
}

@deriving(accessors)
type event =
  | PoolContract_Fees(eventLog<PoolContract.FeesEvent.eventArgs>)
  | PoolContract_Swap(eventLog<PoolContract.SwapEvent.eventArgs>)
  | PoolContract_Sync(eventLog<PoolContract.SyncEvent.eventArgs>)
  | PoolFactoryContract_PoolCreated(eventLog<PoolFactoryContract.PoolCreatedEvent.eventArgs>)
  | VoterContract_DistributeReward(eventLog<VoterContract.DistributeRewardEvent.eventArgs>)
  | VoterContract_GaugeCreated(eventLog<VoterContract.GaugeCreatedEvent.eventArgs>)

@spice
type eventName =
  | @spice.as("Pool_Fees") Pool_Fees
  | @spice.as("Pool_Swap") Pool_Swap
  | @spice.as("Pool_Sync") Pool_Sync
  | @spice.as("PoolFactory_PoolCreated") PoolFactory_PoolCreated
  | @spice.as("Voter_DistributeReward") Voter_DistributeReward
  | @spice.as("Voter_GaugeCreated") Voter_GaugeCreated

let eventNameToString = (eventName: eventName) =>
  switch eventName {
  | Pool_Fees => "Fees"
  | Pool_Swap => "Swap"
  | Pool_Sync => "Sync"
  | PoolFactory_PoolCreated => "PoolCreated"
  | Voter_DistributeReward => "DistributeReward"
  | Voter_GaugeCreated => "GaugeCreated"
  }

@genType
type chainId = int

type eventBatchQueueItem = {
  timestamp: int,
  chain: ChainMap.Chain.t,
  blockNumber: int,
  logIndex: int,
  event: event,
  //Default to false, if an event needs to
  //be reprocessed after it has loaded dynamic contracts
  //This gets set to true and does not try and reload events
  hasRegisteredDynamicContracts?: bool,
}
