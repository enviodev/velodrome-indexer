//*************
//***ENTITIES**
//*************
@spice @genType.as("Id")
type id = string

@@warning("-30")
@genType
type rec liquidityPoolDailySnapshotLoaderConfig = bool
and liquidityPoolHourlySnapshotLoaderConfig = bool
and liquidityPoolNewLoaderConfig = {loadToken0?: tokenLoaderConfig, loadToken1?: tokenLoaderConfig}
and liquidityPoolWeeklySnapshotLoaderConfig = bool
and tokenLoaderConfig = bool
and tokenDailySnapshotLoaderConfig = bool
and tokenHourlySnapshotLoaderConfig = bool
and tokenWeeklySnapshotLoaderConfig = bool
and userLoaderConfig = bool

@@warning("+30")
@genType
type entityRead =
  | LiquidityPoolDailySnapshotRead(id)
  | LiquidityPoolHourlySnapshotRead(id)
  | LiquidityPoolNewRead(id, liquidityPoolNewLoaderConfig)
  | LiquidityPoolWeeklySnapshotRead(id)
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

@spice @genType.as("LiquidityPoolDailySnapshotEntity")
type liquidityPoolDailySnapshotEntity = {
  chainID: Ethers.BigInt.t,
  totalFees1: Ethers.BigInt.t,
  pool: string,
  totalFeesUSD: Ethers.BigInt.t,
  totalEmissions: Ethers.BigInt.t,
  totalLiquidityUSD: Ethers.BigInt.t,
  reserve1: Ethers.BigInt.t,
  id: id,
  totalVolume0: Ethers.BigInt.t,
  totalVolume1: Ethers.BigInt.t,
  token1Price: Ethers.BigInt.t,
  numberOfSwaps: Ethers.BigInt.t,
  token0Price: Ethers.BigInt.t,
  totalVolumeUSD: Ethers.BigInt.t,
  name: string,
  reserve0: Ethers.BigInt.t,
  totalEmissionsUSD: Ethers.BigInt.t,
  lastUpdatedTimestamp: Ethers.BigInt.t,
  totalFees0: Ethers.BigInt.t,
  totalBribesUSD: Ethers.BigInt.t,
}

@spice @genType.as("LiquidityPoolHourlySnapshotEntity")
type liquidityPoolHourlySnapshotEntity = {
  totalEmissionsUSD: Ethers.BigInt.t,
  totalFees1: Ethers.BigInt.t,
  totalVolume0: Ethers.BigInt.t,
  pool: string,
  reserve1: Ethers.BigInt.t,
  totalEmissions: Ethers.BigInt.t,
  totalVolumeUSD: Ethers.BigInt.t,
  totalBribesUSD: Ethers.BigInt.t,
  lastUpdatedTimestamp: Ethers.BigInt.t,
  totalVolume1: Ethers.BigInt.t,
  totalFeesUSD: Ethers.BigInt.t,
  token1Price: Ethers.BigInt.t,
  totalFees0: Ethers.BigInt.t,
  name: string,
  chainID: Ethers.BigInt.t,
  numberOfSwaps: Ethers.BigInt.t,
  id: id,
  reserve0: Ethers.BigInt.t,
  totalLiquidityUSD: Ethers.BigInt.t,
  token0Price: Ethers.BigInt.t,
}

@spice @genType.as("LiquidityPoolNewEntity")
type liquidityPoolNewEntity = {
  name: string,
  totalFeesUSD: Ethers.BigInt.t,
  token0_id: id,
  token0Price: Ethers.BigInt.t,
  reserve0: Ethers.BigInt.t,
  totalEmissions: Ethers.BigInt.t,
  totalVolumeUSD: Ethers.BigInt.t,
  chainID: Ethers.BigInt.t,
  isStable: bool,
  reserve1: Ethers.BigInt.t,
  totalLiquidityUSD: Ethers.BigInt.t,
  token1_id: id,
  totalVolume1: Ethers.BigInt.t,
  numberOfSwaps: Ethers.BigInt.t,
  totalVolume0: Ethers.BigInt.t,
  totalFees0: Ethers.BigInt.t,
  id: id,
  totalFees1: Ethers.BigInt.t,
  token1Price: Ethers.BigInt.t,
  totalEmissionsUSD: Ethers.BigInt.t,
  totalBribesUSD: Ethers.BigInt.t,
  lastUpdatedTimestamp: Ethers.BigInt.t,
}

@spice @genType.as("LiquidityPoolWeeklySnapshotEntity")
type liquidityPoolWeeklySnapshotEntity = {
  name: string,
  totalVolume1: Ethers.BigInt.t,
  totalLiquidityUSD: Ethers.BigInt.t,
  totalEmissions: Ethers.BigInt.t,
  pool: string,
  reserve0: Ethers.BigInt.t,
  totalVolumeUSD: Ethers.BigInt.t,
  totalFeesUSD: Ethers.BigInt.t,
  numberOfSwaps: Ethers.BigInt.t,
  totalVolume0: Ethers.BigInt.t,
  token1Price: Ethers.BigInt.t,
  totalEmissionsUSD: Ethers.BigInt.t,
  totalBribesUSD: Ethers.BigInt.t,
  lastUpdatedTimestamp: Ethers.BigInt.t,
  totalFees0: Ethers.BigInt.t,
  reserve1: Ethers.BigInt.t,
  token0Price: Ethers.BigInt.t,
  id: id,
  totalFees1: Ethers.BigInt.t,
  chainID: Ethers.BigInt.t,
}

@spice @genType.as("TokenEntity")
type tokenEntity = {
  symbol: string,
  lastUpdatedTimestamp: Ethers.BigInt.t,
  name: string,
  chainID: Ethers.BigInt.t,
  id: id,
  decimals: Ethers.BigInt.t,
  poolUsedForPricing: string,
  pricePerUSDNew: Ethers.BigInt.t,
}

@spice @genType.as("TokenDailySnapshotEntity")
type tokenDailySnapshotEntity = {
  token: string,
  pricePerUSDNew: Ethers.BigInt.t,
  symbol: string,
  lastUpdatedTimestamp: Ethers.BigInt.t,
  name: string,
  id: id,
  poolUsedForPricing: string,
  chainID: Ethers.BigInt.t,
}

@spice @genType.as("TokenHourlySnapshotEntity")
type tokenHourlySnapshotEntity = {
  poolUsedForPricing: string,
  symbol: string,
  token: string,
  pricePerUSDNew: Ethers.BigInt.t,
  chainID: Ethers.BigInt.t,
  lastUpdatedTimestamp: Ethers.BigInt.t,
  id: id,
  name: string,
}

@spice @genType.as("TokenWeeklySnapshotEntity")
type tokenWeeklySnapshotEntity = {
  chainID: Ethers.BigInt.t,
  name: string,
  lastUpdatedTimestamp: Ethers.BigInt.t,
  symbol: string,
  id: id,
  pricePerUSDNew: Ethers.BigInt.t,
  poolUsedForPricing: string,
  token: string,
}

@spice @genType.as("UserEntity")
type userEntity = {
  joined_at_timestamp: Ethers.BigInt.t,
  id: id,
  numberOfSwaps: Ethers.BigInt.t,
}

type entity =
  | LiquidityPoolDailySnapshotEntity(liquidityPoolDailySnapshotEntity)
  | LiquidityPoolHourlySnapshotEntity(liquidityPoolHourlySnapshotEntity)
  | LiquidityPoolNewEntity(liquidityPoolNewEntity)
  | LiquidityPoolWeeklySnapshotEntity(liquidityPoolWeeklySnapshotEntity)
  | TokenEntity(tokenEntity)
  | TokenDailySnapshotEntity(tokenDailySnapshotEntity)
  | TokenHourlySnapshotEntity(tokenHourlySnapshotEntity)
  | TokenWeeklySnapshotEntity(tokenWeeklySnapshotEntity)
  | UserEntity(userEntity)

type eventIdentifier = {
  chainId: int,
  blockNumber: int,
  logIndex: int,
}

type entityData<'entityType> =
  Set('entityType, eventIdentifier) | Delete(string, eventIdentifier) | Read('entityType) //make delete take a EntityStore.key type

@genType
type inMemoryStoreRow<'entityType> = {
  current: entityData<'entityType>,
  history: array<entityData<'entityType>>,
}

//*************
//**CONTRACTS**
//*************

@genType.as("EventLog")
type eventLog<'a> = {
  params: 'a,
  chainId: int,
  txOrigin: option<Ethers.ethAddress>,
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

    // Entity: LiquidityPoolNew
    type liquidityPoolNewEntityHandlerContext = {
      get: id => option<liquidityPoolNewEntity>,
      getToken0: liquidityPoolNewEntity => tokenEntity,
      getToken1: liquidityPoolNewEntity => tokenEntity,
      set: liquidityPoolNewEntity => unit,
      delete: id => unit,
    }

    type liquidityPoolNewEntityHandlerContextAsync = {
      get: id => promise<option<liquidityPoolNewEntity>>,
      getToken0: liquidityPoolNewEntity => promise<tokenEntity>,
      getToken1: liquidityPoolNewEntity => promise<tokenEntity>,
      set: liquidityPoolNewEntity => unit,
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
      @as("LiquidityPoolDailySnapshot")
      liquidityPoolDailySnapshot: liquidityPoolDailySnapshotEntityHandlerContext,
      @as("LiquidityPoolHourlySnapshot")
      liquidityPoolHourlySnapshot: liquidityPoolHourlySnapshotEntityHandlerContext,
      @as("LiquidityPoolNew") liquidityPoolNew: liquidityPoolNewEntityHandlerContext,
      @as("LiquidityPoolWeeklySnapshot")
      liquidityPoolWeeklySnapshot: liquidityPoolWeeklySnapshotEntityHandlerContext,
      @as("Token") token: tokenEntityHandlerContext,
      @as("TokenDailySnapshot") tokenDailySnapshot: tokenDailySnapshotEntityHandlerContext,
      @as("TokenHourlySnapshot") tokenHourlySnapshot: tokenHourlySnapshotEntityHandlerContext,
      @as("TokenWeeklySnapshot") tokenWeeklySnapshot: tokenWeeklySnapshotEntityHandlerContext,
      @as("User") user: userEntityHandlerContext,
    }
    @genType
    type handlerContextAsync = {
      log: Logs.userLogger,
      @as("LiquidityPoolDailySnapshot")
      liquidityPoolDailySnapshot: liquidityPoolDailySnapshotEntityHandlerContextAsync,
      @as("LiquidityPoolHourlySnapshot")
      liquidityPoolHourlySnapshot: liquidityPoolHourlySnapshotEntityHandlerContextAsync,
      @as("LiquidityPoolNew") liquidityPoolNew: liquidityPoolNewEntityHandlerContextAsync,
      @as("LiquidityPoolWeeklySnapshot")
      liquidityPoolWeeklySnapshot: liquidityPoolWeeklySnapshotEntityHandlerContextAsync,
      @as("Token") token: tokenEntityHandlerContextAsync,
      @as("TokenDailySnapshot") tokenDailySnapshot: tokenDailySnapshotEntityHandlerContextAsync,
      @as("TokenHourlySnapshot") tokenHourlySnapshot: tokenHourlySnapshotEntityHandlerContextAsync,
      @as("TokenWeeklySnapshot") tokenWeeklySnapshot: tokenWeeklySnapshotEntityHandlerContextAsync,
      @as("User") user: userEntityHandlerContextAsync,
    }

    @genType
    type liquidityPoolNewEntityLoaderContext = {
      load: (id, ~loaders: liquidityPoolNewLoaderConfig=?) => unit,
    }

    @genType
    type contractRegistrations = {
      //TODO only add contracts we've registered for the event in the config
      addPool: Ethers.ethAddress => unit,
      //TODO only add contracts we've registered for the event in the config
      addPoolFactory: Ethers.ethAddress => unit,
      //TODO only add contracts we've registered for the event in the config
      addVoter: Ethers.ethAddress => unit,
      //TODO only add contracts we've registered for the event in the config
      addVotingReward: Ethers.ethAddress => unit,
    }
    @genType
    type loaderContext = {
      log: Logs.userLogger,
      contractRegistration: contractRegistrations,
      @as("LiquidityPoolNew") liquidityPoolNew: liquidityPoolNewEntityLoaderContext,
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

    // Entity: LiquidityPoolNew
    type liquidityPoolNewEntityHandlerContext = {
      get: id => option<liquidityPoolNewEntity>,
      getToken0: liquidityPoolNewEntity => tokenEntity,
      getToken1: liquidityPoolNewEntity => tokenEntity,
      set: liquidityPoolNewEntity => unit,
      delete: id => unit,
    }

    type liquidityPoolNewEntityHandlerContextAsync = {
      get: id => promise<option<liquidityPoolNewEntity>>,
      getToken0: liquidityPoolNewEntity => promise<tokenEntity>,
      getToken1: liquidityPoolNewEntity => promise<tokenEntity>,
      set: liquidityPoolNewEntity => unit,
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
      get: id => option<userEntity>,
      set: userEntity => unit,
      delete: id => unit,
    }

    type userEntityHandlerContextAsync = {
      get: id => promise<option<userEntity>>,
      set: userEntity => unit,
      delete: id => unit,
    }

    @genType
    type handlerContext = {
      log: Logs.userLogger,
      @as("LiquidityPoolDailySnapshot")
      liquidityPoolDailySnapshot: liquidityPoolDailySnapshotEntityHandlerContext,
      @as("LiquidityPoolHourlySnapshot")
      liquidityPoolHourlySnapshot: liquidityPoolHourlySnapshotEntityHandlerContext,
      @as("LiquidityPoolNew") liquidityPoolNew: liquidityPoolNewEntityHandlerContext,
      @as("LiquidityPoolWeeklySnapshot")
      liquidityPoolWeeklySnapshot: liquidityPoolWeeklySnapshotEntityHandlerContext,
      @as("Token") token: tokenEntityHandlerContext,
      @as("TokenDailySnapshot") tokenDailySnapshot: tokenDailySnapshotEntityHandlerContext,
      @as("TokenHourlySnapshot") tokenHourlySnapshot: tokenHourlySnapshotEntityHandlerContext,
      @as("TokenWeeklySnapshot") tokenWeeklySnapshot: tokenWeeklySnapshotEntityHandlerContext,
      @as("User") user: userEntityHandlerContext,
    }
    @genType
    type handlerContextAsync = {
      log: Logs.userLogger,
      @as("LiquidityPoolDailySnapshot")
      liquidityPoolDailySnapshot: liquidityPoolDailySnapshotEntityHandlerContextAsync,
      @as("LiquidityPoolHourlySnapshot")
      liquidityPoolHourlySnapshot: liquidityPoolHourlySnapshotEntityHandlerContextAsync,
      @as("LiquidityPoolNew") liquidityPoolNew: liquidityPoolNewEntityHandlerContextAsync,
      @as("LiquidityPoolWeeklySnapshot")
      liquidityPoolWeeklySnapshot: liquidityPoolWeeklySnapshotEntityHandlerContextAsync,
      @as("Token") token: tokenEntityHandlerContextAsync,
      @as("TokenDailySnapshot") tokenDailySnapshot: tokenDailySnapshotEntityHandlerContextAsync,
      @as("TokenHourlySnapshot") tokenHourlySnapshot: tokenHourlySnapshotEntityHandlerContextAsync,
      @as("TokenWeeklySnapshot") tokenWeeklySnapshot: tokenWeeklySnapshotEntityHandlerContextAsync,
      @as("User") user: userEntityHandlerContextAsync,
    }

    @genType
    type liquidityPoolNewEntityLoaderContext = {
      load: (id, ~loaders: liquidityPoolNewLoaderConfig=?) => unit,
    }
    @genType
    type userEntityLoaderContext = {load: id => unit}

    @genType
    type contractRegistrations = {
      //TODO only add contracts we've registered for the event in the config
      addPool: Ethers.ethAddress => unit,
      //TODO only add contracts we've registered for the event in the config
      addPoolFactory: Ethers.ethAddress => unit,
      //TODO only add contracts we've registered for the event in the config
      addVoter: Ethers.ethAddress => unit,
      //TODO only add contracts we've registered for the event in the config
      addVotingReward: Ethers.ethAddress => unit,
    }
    @genType
    type loaderContext = {
      log: Logs.userLogger,
      contractRegistration: contractRegistrations,
      @as("LiquidityPoolNew") liquidityPoolNew: liquidityPoolNewEntityLoaderContext,
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

    // Entity: LiquidityPoolNew
    type liquidityPoolNewEntityHandlerContext = {
      get: id => option<liquidityPoolNewEntity>,
      getToken0: liquidityPoolNewEntity => tokenEntity,
      getToken1: liquidityPoolNewEntity => tokenEntity,
      set: liquidityPoolNewEntity => unit,
      delete: id => unit,
    }

    type liquidityPoolNewEntityHandlerContextAsync = {
      get: id => promise<option<liquidityPoolNewEntity>>,
      getToken0: liquidityPoolNewEntity => promise<tokenEntity>,
      getToken1: liquidityPoolNewEntity => promise<tokenEntity>,
      set: liquidityPoolNewEntity => unit,
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

    // Entity: Token
    type tokenEntityHandlerContext = {
      get: id => option<tokenEntity>,
      set: tokenEntity => unit,
      delete: id => unit,
    }

    type tokenEntityHandlerContextAsync = {
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
      @as("LiquidityPoolDailySnapshot")
      liquidityPoolDailySnapshot: liquidityPoolDailySnapshotEntityHandlerContext,
      @as("LiquidityPoolHourlySnapshot")
      liquidityPoolHourlySnapshot: liquidityPoolHourlySnapshotEntityHandlerContext,
      @as("LiquidityPoolNew") liquidityPoolNew: liquidityPoolNewEntityHandlerContext,
      @as("LiquidityPoolWeeklySnapshot")
      liquidityPoolWeeklySnapshot: liquidityPoolWeeklySnapshotEntityHandlerContext,
      @as("Token") token: tokenEntityHandlerContext,
      @as("TokenDailySnapshot") tokenDailySnapshot: tokenDailySnapshotEntityHandlerContext,
      @as("TokenHourlySnapshot") tokenHourlySnapshot: tokenHourlySnapshotEntityHandlerContext,
      @as("TokenWeeklySnapshot") tokenWeeklySnapshot: tokenWeeklySnapshotEntityHandlerContext,
      @as("User") user: userEntityHandlerContext,
    }
    @genType
    type handlerContextAsync = {
      log: Logs.userLogger,
      @as("LiquidityPoolDailySnapshot")
      liquidityPoolDailySnapshot: liquidityPoolDailySnapshotEntityHandlerContextAsync,
      @as("LiquidityPoolHourlySnapshot")
      liquidityPoolHourlySnapshot: liquidityPoolHourlySnapshotEntityHandlerContextAsync,
      @as("LiquidityPoolNew") liquidityPoolNew: liquidityPoolNewEntityHandlerContextAsync,
      @as("LiquidityPoolWeeklySnapshot")
      liquidityPoolWeeklySnapshot: liquidityPoolWeeklySnapshotEntityHandlerContextAsync,
      @as("Token") token: tokenEntityHandlerContextAsync,
      @as("TokenDailySnapshot") tokenDailySnapshot: tokenDailySnapshotEntityHandlerContextAsync,
      @as("TokenHourlySnapshot") tokenHourlySnapshot: tokenHourlySnapshotEntityHandlerContextAsync,
      @as("TokenWeeklySnapshot") tokenWeeklySnapshot: tokenWeeklySnapshotEntityHandlerContextAsync,
      @as("User") user: userEntityHandlerContextAsync,
    }

    @genType
    type liquidityPoolNewEntityLoaderContext = {
      load: (id, ~loaders: liquidityPoolNewLoaderConfig=?) => unit,
    }
    @genType
    type tokenEntityLoaderContext = {load: id => unit}

    @genType
    type contractRegistrations = {
      //TODO only add contracts we've registered for the event in the config
      addPool: Ethers.ethAddress => unit,
      //TODO only add contracts we've registered for the event in the config
      addPoolFactory: Ethers.ethAddress => unit,
      //TODO only add contracts we've registered for the event in the config
      addVoter: Ethers.ethAddress => unit,
      //TODO only add contracts we've registered for the event in the config
      addVotingReward: Ethers.ethAddress => unit,
    }
    @genType
    type loaderContext = {
      log: Logs.userLogger,
      contractRegistration: contractRegistrations,
      @as("LiquidityPoolNew") liquidityPoolNew: liquidityPoolNewEntityLoaderContext,
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

    // Entity: LiquidityPoolNew
    type liquidityPoolNewEntityHandlerContext = {
      getToken0: liquidityPoolNewEntity => tokenEntity,
      getToken1: liquidityPoolNewEntity => tokenEntity,
      set: liquidityPoolNewEntity => unit,
      delete: id => unit,
    }

    type liquidityPoolNewEntityHandlerContextAsync = {
      getToken0: liquidityPoolNewEntity => promise<tokenEntity>,
      getToken1: liquidityPoolNewEntity => promise<tokenEntity>,
      set: liquidityPoolNewEntity => unit,
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

    // Entity: Token
    type tokenEntityHandlerContext = {
      poolTokens: array<option<tokenEntity>>,
      get: id => option<tokenEntity>,
      set: tokenEntity => unit,
      delete: id => unit,
    }

    type tokenEntityHandlerContextAsync = {
      poolTokens: array<option<tokenEntity>>,
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
      @as("LiquidityPoolDailySnapshot")
      liquidityPoolDailySnapshot: liquidityPoolDailySnapshotEntityHandlerContext,
      @as("LiquidityPoolHourlySnapshot")
      liquidityPoolHourlySnapshot: liquidityPoolHourlySnapshotEntityHandlerContext,
      @as("LiquidityPoolNew") liquidityPoolNew: liquidityPoolNewEntityHandlerContext,
      @as("LiquidityPoolWeeklySnapshot")
      liquidityPoolWeeklySnapshot: liquidityPoolWeeklySnapshotEntityHandlerContext,
      @as("Token") token: tokenEntityHandlerContext,
      @as("TokenDailySnapshot") tokenDailySnapshot: tokenDailySnapshotEntityHandlerContext,
      @as("TokenHourlySnapshot") tokenHourlySnapshot: tokenHourlySnapshotEntityHandlerContext,
      @as("TokenWeeklySnapshot") tokenWeeklySnapshot: tokenWeeklySnapshotEntityHandlerContext,
      @as("User") user: userEntityHandlerContext,
    }
    @genType
    type handlerContextAsync = {
      log: Logs.userLogger,
      @as("LiquidityPoolDailySnapshot")
      liquidityPoolDailySnapshot: liquidityPoolDailySnapshotEntityHandlerContextAsync,
      @as("LiquidityPoolHourlySnapshot")
      liquidityPoolHourlySnapshot: liquidityPoolHourlySnapshotEntityHandlerContextAsync,
      @as("LiquidityPoolNew") liquidityPoolNew: liquidityPoolNewEntityHandlerContextAsync,
      @as("LiquidityPoolWeeklySnapshot")
      liquidityPoolWeeklySnapshot: liquidityPoolWeeklySnapshotEntityHandlerContextAsync,
      @as("Token") token: tokenEntityHandlerContextAsync,
      @as("TokenDailySnapshot") tokenDailySnapshot: tokenDailySnapshotEntityHandlerContextAsync,
      @as("TokenHourlySnapshot") tokenHourlySnapshot: tokenHourlySnapshotEntityHandlerContextAsync,
      @as("TokenWeeklySnapshot") tokenWeeklySnapshot: tokenWeeklySnapshotEntityHandlerContextAsync,
      @as("User") user: userEntityHandlerContextAsync,
    }

    @genType
    type tokenEntityLoaderContext = {
      poolTokensLoad: array<id> => unit,
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
      //TODO only add contracts we've registered for the event in the config
      addVotingReward: Ethers.ethAddress => unit,
    }
    @genType
    type loaderContext = {
      log: Logs.userLogger,
      contractRegistration: contractRegistrations,
      @as("Token") token: tokenEntityLoaderContext,
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

    // Entity: LiquidityPoolNew
    type liquidityPoolNewEntityHandlerContext = {
      emissionSinglePool: option<liquidityPoolNewEntity>,
      get: id => option<liquidityPoolNewEntity>,
      getToken0: liquidityPoolNewEntity => tokenEntity,
      getToken1: liquidityPoolNewEntity => tokenEntity,
      set: liquidityPoolNewEntity => unit,
      delete: id => unit,
    }

    type liquidityPoolNewEntityHandlerContextAsync = {
      emissionSinglePool: option<liquidityPoolNewEntity>,
      get: id => promise<option<liquidityPoolNewEntity>>,
      getToken0: liquidityPoolNewEntity => promise<tokenEntity>,
      getToken1: liquidityPoolNewEntity => promise<tokenEntity>,
      set: liquidityPoolNewEntity => unit,
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

    // Entity: Token
    type tokenEntityHandlerContext = {
      emissionRewardToken: option<tokenEntity>,
      get: id => option<tokenEntity>,
      set: tokenEntity => unit,
      delete: id => unit,
    }

    type tokenEntityHandlerContextAsync = {
      emissionRewardToken: option<tokenEntity>,
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
      @as("LiquidityPoolDailySnapshot")
      liquidityPoolDailySnapshot: liquidityPoolDailySnapshotEntityHandlerContext,
      @as("LiquidityPoolHourlySnapshot")
      liquidityPoolHourlySnapshot: liquidityPoolHourlySnapshotEntityHandlerContext,
      @as("LiquidityPoolNew") liquidityPoolNew: liquidityPoolNewEntityHandlerContext,
      @as("LiquidityPoolWeeklySnapshot")
      liquidityPoolWeeklySnapshot: liquidityPoolWeeklySnapshotEntityHandlerContext,
      @as("Token") token: tokenEntityHandlerContext,
      @as("TokenDailySnapshot") tokenDailySnapshot: tokenDailySnapshotEntityHandlerContext,
      @as("TokenHourlySnapshot") tokenHourlySnapshot: tokenHourlySnapshotEntityHandlerContext,
      @as("TokenWeeklySnapshot") tokenWeeklySnapshot: tokenWeeklySnapshotEntityHandlerContext,
      @as("User") user: userEntityHandlerContext,
    }
    @genType
    type handlerContextAsync = {
      log: Logs.userLogger,
      @as("LiquidityPoolDailySnapshot")
      liquidityPoolDailySnapshot: liquidityPoolDailySnapshotEntityHandlerContextAsync,
      @as("LiquidityPoolHourlySnapshot")
      liquidityPoolHourlySnapshot: liquidityPoolHourlySnapshotEntityHandlerContextAsync,
      @as("LiquidityPoolNew") liquidityPoolNew: liquidityPoolNewEntityHandlerContextAsync,
      @as("LiquidityPoolWeeklySnapshot")
      liquidityPoolWeeklySnapshot: liquidityPoolWeeklySnapshotEntityHandlerContextAsync,
      @as("Token") token: tokenEntityHandlerContextAsync,
      @as("TokenDailySnapshot") tokenDailySnapshot: tokenDailySnapshotEntityHandlerContextAsync,
      @as("TokenHourlySnapshot") tokenHourlySnapshot: tokenHourlySnapshotEntityHandlerContextAsync,
      @as("TokenWeeklySnapshot") tokenWeeklySnapshot: tokenWeeklySnapshotEntityHandlerContextAsync,
      @as("User") user: userEntityHandlerContextAsync,
    }

    @genType
    type liquidityPoolNewEntityLoaderContext = {
      emissionSinglePoolLoad: (id, ~loaders: liquidityPoolNewLoaderConfig=?) => unit,
      load: (id, ~loaders: liquidityPoolNewLoaderConfig=?) => unit,
    }
    @genType
    type tokenEntityLoaderContext = {
      emissionRewardTokenLoad: id => unit,
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
      //TODO only add contracts we've registered for the event in the config
      addVotingReward: Ethers.ethAddress => unit,
    }
    @genType
    type loaderContext = {
      log: Logs.userLogger,
      contractRegistration: contractRegistrations,
      @as("LiquidityPoolNew") liquidityPoolNew: liquidityPoolNewEntityLoaderContext,
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

    // Entity: LiquidityPoolDailySnapshot
    type liquidityPoolDailySnapshotEntityHandlerContext = {
      get: id => option<liquidityPoolDailySnapshotEntity>,
      set: liquidityPoolDailySnapshotEntity => unit,
      delete: id => unit,
    }

    type liquidityPoolDailySnapshotEntityHandlerContextAsync = {
      get: id => promise<option<liquidityPoolDailySnapshotEntity>>,
      set: liquidityPoolDailySnapshotEntity => unit,
      delete: id => unit,
    }

    // Entity: LiquidityPoolHourlySnapshot
    type liquidityPoolHourlySnapshotEntityHandlerContext = {
      get: id => option<liquidityPoolHourlySnapshotEntity>,
      set: liquidityPoolHourlySnapshotEntity => unit,
      delete: id => unit,
    }

    type liquidityPoolHourlySnapshotEntityHandlerContextAsync = {
      get: id => promise<option<liquidityPoolHourlySnapshotEntity>>,
      set: liquidityPoolHourlySnapshotEntity => unit,
      delete: id => unit,
    }

    // Entity: LiquidityPoolNew
    type liquidityPoolNewEntityHandlerContext = {
      get: id => option<liquidityPoolNewEntity>,
      getToken0: liquidityPoolNewEntity => tokenEntity,
      getToken1: liquidityPoolNewEntity => tokenEntity,
      set: liquidityPoolNewEntity => unit,
      delete: id => unit,
    }

    type liquidityPoolNewEntityHandlerContextAsync = {
      get: id => promise<option<liquidityPoolNewEntity>>,
      getToken0: liquidityPoolNewEntity => promise<tokenEntity>,
      getToken1: liquidityPoolNewEntity => promise<tokenEntity>,
      set: liquidityPoolNewEntity => unit,
      delete: id => unit,
    }

    // Entity: LiquidityPoolWeeklySnapshot
    type liquidityPoolWeeklySnapshotEntityHandlerContext = {
      get: id => option<liquidityPoolWeeklySnapshotEntity>,
      set: liquidityPoolWeeklySnapshotEntity => unit,
      delete: id => unit,
    }

    type liquidityPoolWeeklySnapshotEntityHandlerContextAsync = {
      get: id => promise<option<liquidityPoolWeeklySnapshotEntity>>,
      set: liquidityPoolWeeklySnapshotEntity => unit,
      delete: id => unit,
    }

    // Entity: Token
    type tokenEntityHandlerContext = {
      get: id => option<tokenEntity>,
      set: tokenEntity => unit,
      delete: id => unit,
    }

    type tokenEntityHandlerContextAsync = {
      get: id => promise<option<tokenEntity>>,
      set: tokenEntity => unit,
      delete: id => unit,
    }

    // Entity: TokenDailySnapshot
    type tokenDailySnapshotEntityHandlerContext = {
      get: id => option<tokenDailySnapshotEntity>,
      set: tokenDailySnapshotEntity => unit,
      delete: id => unit,
    }

    type tokenDailySnapshotEntityHandlerContextAsync = {
      get: id => promise<option<tokenDailySnapshotEntity>>,
      set: tokenDailySnapshotEntity => unit,
      delete: id => unit,
    }

    // Entity: TokenHourlySnapshot
    type tokenHourlySnapshotEntityHandlerContext = {
      get: id => option<tokenHourlySnapshotEntity>,
      set: tokenHourlySnapshotEntity => unit,
      delete: id => unit,
    }

    type tokenHourlySnapshotEntityHandlerContextAsync = {
      get: id => promise<option<tokenHourlySnapshotEntity>>,
      set: tokenHourlySnapshotEntity => unit,
      delete: id => unit,
    }

    // Entity: TokenWeeklySnapshot
    type tokenWeeklySnapshotEntityHandlerContext = {
      get: id => option<tokenWeeklySnapshotEntity>,
      set: tokenWeeklySnapshotEntity => unit,
      delete: id => unit,
    }

    type tokenWeeklySnapshotEntityHandlerContextAsync = {
      get: id => promise<option<tokenWeeklySnapshotEntity>>,
      set: tokenWeeklySnapshotEntity => unit,
      delete: id => unit,
    }

    // Entity: User
    type userEntityHandlerContext = {
      get: id => option<userEntity>,
      set: userEntity => unit,
      delete: id => unit,
    }

    type userEntityHandlerContextAsync = {
      get: id => promise<option<userEntity>>,
      set: userEntity => unit,
      delete: id => unit,
    }

    @genType
    type handlerContext = {
      log: Logs.userLogger,
      @as("LiquidityPoolDailySnapshot")
      liquidityPoolDailySnapshot: liquidityPoolDailySnapshotEntityHandlerContext,
      @as("LiquidityPoolHourlySnapshot")
      liquidityPoolHourlySnapshot: liquidityPoolHourlySnapshotEntityHandlerContext,
      @as("LiquidityPoolNew") liquidityPoolNew: liquidityPoolNewEntityHandlerContext,
      @as("LiquidityPoolWeeklySnapshot")
      liquidityPoolWeeklySnapshot: liquidityPoolWeeklySnapshotEntityHandlerContext,
      @as("Token") token: tokenEntityHandlerContext,
      @as("TokenDailySnapshot") tokenDailySnapshot: tokenDailySnapshotEntityHandlerContext,
      @as("TokenHourlySnapshot") tokenHourlySnapshot: tokenHourlySnapshotEntityHandlerContext,
      @as("TokenWeeklySnapshot") tokenWeeklySnapshot: tokenWeeklySnapshotEntityHandlerContext,
      @as("User") user: userEntityHandlerContext,
    }
    @genType
    type handlerContextAsync = {
      log: Logs.userLogger,
      @as("LiquidityPoolDailySnapshot")
      liquidityPoolDailySnapshot: liquidityPoolDailySnapshotEntityHandlerContextAsync,
      @as("LiquidityPoolHourlySnapshot")
      liquidityPoolHourlySnapshot: liquidityPoolHourlySnapshotEntityHandlerContextAsync,
      @as("LiquidityPoolNew") liquidityPoolNew: liquidityPoolNewEntityHandlerContextAsync,
      @as("LiquidityPoolWeeklySnapshot")
      liquidityPoolWeeklySnapshot: liquidityPoolWeeklySnapshotEntityHandlerContextAsync,
      @as("Token") token: tokenEntityHandlerContextAsync,
      @as("TokenDailySnapshot") tokenDailySnapshot: tokenDailySnapshotEntityHandlerContextAsync,
      @as("TokenHourlySnapshot") tokenHourlySnapshot: tokenHourlySnapshotEntityHandlerContextAsync,
      @as("TokenWeeklySnapshot") tokenWeeklySnapshot: tokenWeeklySnapshotEntityHandlerContextAsync,
      @as("User") user: userEntityHandlerContextAsync,
    }

    @genType
    type tokenDailySnapshotEntityLoaderContext = {load: id => unit}
    @genType
    type liquidityPoolDailySnapshotEntityLoaderContext = {load: id => unit}
    @genType
    type userEntityLoaderContext = {load: id => unit}
    @genType
    type tokenWeeklySnapshotEntityLoaderContext = {load: id => unit}
    @genType
    type liquidityPoolWeeklySnapshotEntityLoaderContext = {load: id => unit}
    @genType
    type liquidityPoolNewEntityLoaderContext = {
      load: (id, ~loaders: liquidityPoolNewLoaderConfig=?) => unit,
    }
    @genType
    type tokenHourlySnapshotEntityLoaderContext = {load: id => unit}
    @genType
    type liquidityPoolHourlySnapshotEntityLoaderContext = {load: id => unit}
    @genType
    type tokenEntityLoaderContext = {load: id => unit}

    @genType
    type contractRegistrations = {
      //TODO only add contracts we've registered for the event in the config
      addPool: Ethers.ethAddress => unit,
      //TODO only add contracts we've registered for the event in the config
      addPoolFactory: Ethers.ethAddress => unit,
      //TODO only add contracts we've registered for the event in the config
      addVoter: Ethers.ethAddress => unit,
      //TODO only add contracts we've registered for the event in the config
      addVotingReward: Ethers.ethAddress => unit,
    }
    @genType
    type loaderContext = {
      log: Logs.userLogger,
      contractRegistration: contractRegistrations,
      @as("TokenDailySnapshot") tokenDailySnapshot: tokenDailySnapshotEntityLoaderContext,
      @as("LiquidityPoolDailySnapshot")
      liquidityPoolDailySnapshot: liquidityPoolDailySnapshotEntityLoaderContext,
      @as("User") user: userEntityLoaderContext,
      @as("TokenWeeklySnapshot") tokenWeeklySnapshot: tokenWeeklySnapshotEntityLoaderContext,
      @as("LiquidityPoolWeeklySnapshot")
      liquidityPoolWeeklySnapshot: liquidityPoolWeeklySnapshotEntityLoaderContext,
      @as("LiquidityPoolNew") liquidityPoolNew: liquidityPoolNewEntityLoaderContext,
      @as("TokenHourlySnapshot") tokenHourlySnapshot: tokenHourlySnapshotEntityLoaderContext,
      @as("LiquidityPoolHourlySnapshot")
      liquidityPoolHourlySnapshot: liquidityPoolHourlySnapshotEntityLoaderContext,
      @as("Token") token: tokenEntityLoaderContext,
    }
  }
}
module VotingRewardContract = {
  module NotifyRewardEvent = {
    //Note: each parameter is using a binding of its index to help with binding in ethers
    //This handles both unamed params and also named params that clash with reserved keywords
    //eg. if an event param is called "values" it will clash since eventArgs will have a '.values()' iterator
    type ethersEventArgs = {
      @as("0") from: Ethers.ethAddress,
      @as("1") reward: Ethers.ethAddress,
      @as("2") epoch: Ethers.BigInt.t,
      @as("3") amount: Ethers.BigInt.t,
    }

    @spice @genType
    type eventArgs = {
      from: Ethers.ethAddress,
      reward: Ethers.ethAddress,
      epoch: Ethers.BigInt.t,
      amount: Ethers.BigInt.t,
    }

    @genType.as("VotingRewardContract_NotifyReward_EventLog")
    type log = eventLog<eventArgs>

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

    // Entity: LiquidityPoolNew
    type liquidityPoolNewEntityHandlerContext = {
      bribeSinglePool: option<liquidityPoolNewEntity>,
      get: id => option<liquidityPoolNewEntity>,
      getToken0: liquidityPoolNewEntity => tokenEntity,
      getToken1: liquidityPoolNewEntity => tokenEntity,
      set: liquidityPoolNewEntity => unit,
      delete: id => unit,
    }

    type liquidityPoolNewEntityHandlerContextAsync = {
      bribeSinglePool: option<liquidityPoolNewEntity>,
      get: id => promise<option<liquidityPoolNewEntity>>,
      getToken0: liquidityPoolNewEntity => promise<tokenEntity>,
      getToken1: liquidityPoolNewEntity => promise<tokenEntity>,
      set: liquidityPoolNewEntity => unit,
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

    // Entity: Token
    type tokenEntityHandlerContext = {
      bribeRewardToken: option<tokenEntity>,
      get: id => option<tokenEntity>,
      set: tokenEntity => unit,
      delete: id => unit,
    }

    type tokenEntityHandlerContextAsync = {
      bribeRewardToken: option<tokenEntity>,
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
      @as("LiquidityPoolDailySnapshot")
      liquidityPoolDailySnapshot: liquidityPoolDailySnapshotEntityHandlerContext,
      @as("LiquidityPoolHourlySnapshot")
      liquidityPoolHourlySnapshot: liquidityPoolHourlySnapshotEntityHandlerContext,
      @as("LiquidityPoolNew") liquidityPoolNew: liquidityPoolNewEntityHandlerContext,
      @as("LiquidityPoolWeeklySnapshot")
      liquidityPoolWeeklySnapshot: liquidityPoolWeeklySnapshotEntityHandlerContext,
      @as("Token") token: tokenEntityHandlerContext,
      @as("TokenDailySnapshot") tokenDailySnapshot: tokenDailySnapshotEntityHandlerContext,
      @as("TokenHourlySnapshot") tokenHourlySnapshot: tokenHourlySnapshotEntityHandlerContext,
      @as("TokenWeeklySnapshot") tokenWeeklySnapshot: tokenWeeklySnapshotEntityHandlerContext,
      @as("User") user: userEntityHandlerContext,
    }
    @genType
    type handlerContextAsync = {
      log: Logs.userLogger,
      @as("LiquidityPoolDailySnapshot")
      liquidityPoolDailySnapshot: liquidityPoolDailySnapshotEntityHandlerContextAsync,
      @as("LiquidityPoolHourlySnapshot")
      liquidityPoolHourlySnapshot: liquidityPoolHourlySnapshotEntityHandlerContextAsync,
      @as("LiquidityPoolNew") liquidityPoolNew: liquidityPoolNewEntityHandlerContextAsync,
      @as("LiquidityPoolWeeklySnapshot")
      liquidityPoolWeeklySnapshot: liquidityPoolWeeklySnapshotEntityHandlerContextAsync,
      @as("Token") token: tokenEntityHandlerContextAsync,
      @as("TokenDailySnapshot") tokenDailySnapshot: tokenDailySnapshotEntityHandlerContextAsync,
      @as("TokenHourlySnapshot") tokenHourlySnapshot: tokenHourlySnapshotEntityHandlerContextAsync,
      @as("TokenWeeklySnapshot") tokenWeeklySnapshot: tokenWeeklySnapshotEntityHandlerContextAsync,
      @as("User") user: userEntityHandlerContextAsync,
    }

    @genType
    type liquidityPoolNewEntityLoaderContext = {
      bribeSinglePoolLoad: (id, ~loaders: liquidityPoolNewLoaderConfig=?) => unit,
      load: (id, ~loaders: liquidityPoolNewLoaderConfig=?) => unit,
    }
    @genType
    type tokenEntityLoaderContext = {
      bribeRewardTokenLoad: id => unit,
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
      //TODO only add contracts we've registered for the event in the config
      addVotingReward: Ethers.ethAddress => unit,
    }
    @genType
    type loaderContext = {
      log: Logs.userLogger,
      contractRegistration: contractRegistrations,
      @as("LiquidityPoolNew") liquidityPoolNew: liquidityPoolNewEntityLoaderContext,
      @as("Token") token: tokenEntityLoaderContext,
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
  | VotingRewardContract_NotifyReward(eventLog<VotingRewardContract.NotifyRewardEvent.eventArgs>)

@spice
type eventName =
  | @spice.as("Pool_Fees") Pool_Fees
  | @spice.as("Pool_Swap") Pool_Swap
  | @spice.as("Pool_Sync") Pool_Sync
  | @spice.as("PoolFactory_PoolCreated") PoolFactory_PoolCreated
  | @spice.as("Voter_DistributeReward") Voter_DistributeReward
  | @spice.as("Voter_GaugeCreated") Voter_GaugeCreated
  | @spice.as("VotingReward_NotifyReward") VotingReward_NotifyReward

let eventNameToString = (eventName: eventName) =>
  switch eventName {
  | Pool_Fees => "Fees"
  | Pool_Swap => "Swap"
  | Pool_Sync => "Sync"
  | PoolFactory_PoolCreated => "PoolCreated"
  | Voter_DistributeReward => "DistributeReward"
  | Voter_GaugeCreated => "GaugeCreated"
  | VotingReward_NotifyReward => "NotifyReward"
  }

exception UnknownEvent(string, string)
let eventTopicToEventName = (contractName, topic0) =>
  switch (contractName, topic0) {
  | ("Pool", "0x112c256902bf554b6ed882d2936687aaeb4225e8cd5b51303c90ca6cf43a8602") => Pool_Fees
  | ("Pool", "0xb3e2773606abfd36b5bd91394b3a54d1398336c65005baf7bf7a05efeffaf75b") => Pool_Swap
  | ("Pool", "0xcf2aa50876cdfbb541206f89af0ee78d44a2abf8d328e37fa4917f982149848a") => Pool_Sync
  | ("PoolFactory", "0x2128d88d14c80cb081c1252a5acff7a264671bf199ce226b53788fb26065005e") =>
    PoolFactory_PoolCreated
  | ("Voter", "0x4fa9693cae526341d334e2862ca2413b2e503f1266255f9e0869fb36e6d89b17") =>
    Voter_DistributeReward
  | ("Voter", "0xef9f7d1ffff3b249c6b9bf2528499e935f7d96bb6d6ec4e7da504d1d3c6279e1") =>
    Voter_GaugeCreated
  | ("VotingReward", "0x52977ea98a2220a03ee9ba5cb003ada08d394ea10155483c95dc2dc77a7eb24b") =>
    VotingReward_NotifyReward
  | (contractName, topic0) => UnknownEvent(contractName, topic0)->raise
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
