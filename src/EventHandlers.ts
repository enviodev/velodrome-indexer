import {
  PoolContract_Fees_loader,
  PoolContract_Fees_handler,
  PoolContract_Sync_loader,
  PoolContract_Sync_handler,
  PoolContract_Swap_loader,
  PoolContract_Swap_handler,
  PoolFactoryContract_PoolCreated_loader,
  PoolFactoryContract_PoolCreated_handler,
  VoterContract_DistributeReward_loader,
  VoterContract_DistributeReward_handler,
  VoterContract_GaugeCreated_loader,
  VoterContract_GaugeCreated_handler,
} from "../generated/src/Handlers.gen";

import {
  GaugeEntity,
  LatestETHPriceEntity,
  LiquidityPoolEntity,
  TokenEntity,
  UserEntity,
  LiquidityPoolUserMappingEntity,
} from "./src/Types.gen";

import {
  DEFAULT_STATE_STORE,
  INITIAL_ETH_PRICE,
  STATE_STORE_ID,
  TEN_TO_THE_18_BI,
  CHAIN_CONSTANTS,
} from "./Constants";

import {
  calculateETHPriceInUSD,
  isStablecoinPool,
  findPricePerETH,
  normalizeTokenAmountTo1e18,
  getLiquidityPoolAndUserMappingId,
} from "./Helpers";

import { divideBase1e18, multiplyBase1e18 } from "./Maths";

import {
  getLiquidityPoolSnapshotByInterval,
  getTokenSnapshotByInterval,
} from "./IntervalSnapshots";

import { SnapshotInterval } from "./CustomTypes";

import { whitelistedPoolIds } from "./Store";

PoolFactoryContract_PoolCreated_loader(({ event, context }) => {
  context.StateStore.stateStoreLoad(STATE_STORE_ID, {
    loaders: {},
  });
});

PoolFactoryContract_PoolCreated_handler(({ event, context }) => {
  // TODO remove this when we are indexing all the pools
  if (
    CHAIN_CONSTANTS[event.chainId].testingPoolAddresses.includes(
      event.params.pool.toString()
    )
  ) {
    // Create new instances of TokenEntity to be updated in the DB
    const token0_instance: TokenEntity = {
      id: event.params.token0.toString(),
      chainID: BigInt(event.chainId),
      pricePerETH: 0n,
      pricePerUSD: 0n,
      lastUpdatedTimestamp: BigInt(event.blockTimestamp),
    };

    const token1_instance: TokenEntity = {
      id: event.params.token1.toString(),
      chainID: BigInt(event.chainId),
      pricePerETH: 0n,
      pricePerUSD: 0n,
      lastUpdatedTimestamp: BigInt(event.blockTimestamp),
    };

    // Create a new instance of LiquidityPoolEntity to be updated in the DB
    const new_pool: LiquidityPoolEntity = {
      id: event.params.pool.toString(),
      chainID: BigInt(event.chainId),
      token0: token0_instance.id,
      token1: token1_instance.id,
      isStable: event.params.stable,
      reserve0: 0n,
      reserve1: 0n,
      totalLiquidityETH: 0n,
      totalLiquidityUSD: 0n,
      totalVolume0: 0n,
      totalVolume1: 0n,
      totalVolumeUSD: 0n,
      totalFees0: 0n,
      totalFees1: 0n,
      totalFeesUSD: 0n,
      numberOfSwaps: 1n,
      token0Price: 0n,
      token1Price: 0n,
      lastUpdatedTimestamp: BigInt(event.blockTimestamp),
    };
    // Create TokenEntities in the DB
    context.Token.set(token0_instance);
    context.Token.set(token1_instance);
    // Create the LiquidityPoolEntity in the DB
    context.LiquidityPool.set(new_pool);

    // Push the pool that was created to the poolsWithWhitelistedTokens list if the pool contains at least one whitelisted token
    if (
      CHAIN_CONSTANTS[event.chainId].whitelistedTokenAddresses.includes(
        token0_instance.id
      ) ||
      CHAIN_CONSTANTS[event.chainId].whitelistedTokenAddresses.includes(
        token1_instance.id
      )
    ) {
      if (!context.StateStore.stateStore) {
        context.LatestETHPrice.set(INITIAL_ETH_PRICE);
        context.StateStore.set(DEFAULT_STATE_STORE);
      }
      // push pool address to whitelistedPoolIds
      whitelistedPoolIds.push(new_pool.id);
    } else {
      context.log.info(
        `Pool with address ${event.params.pool.toString()} does not contain any whitelisted tokens`
      );
    }
    // push pool address to whitelistedPoolIds
    whitelistedPoolIds.push(new_pool.id);
  } else {
    context.log.info(
      `Pool with address ${event.params.pool.toString()} does not contain any whitelisted tokens`
    );
  }
});

PoolContract_Fees_loader(({ event, context }) => {
  //Load the single liquidity pool from the loader to be updated
  context.LiquidityPool.load(event.srcAddress.toString(), {
    loaders: {
      loadToken0: true,
      loadToken1: true,
    },
  });
});

PoolContract_Fees_handler(({ event, context }) => {
  // Fetch the current liquidity pool from the loader
  let current_liquidity_pool = context.LiquidityPool.get(
    event.srcAddress.toString()
  );

  // The pool entity should be created via PoolCreated event from the PoolFactory contract
  if (current_liquidity_pool) {
    // Get the tokens from the loader and update their pricing
    let token0_instance = context.LiquidityPool.getToken0(
      current_liquidity_pool
    );

    let token1_instance = context.LiquidityPool.getToken1(
      current_liquidity_pool
    );

    // Normalize swap amounts to 1e18
    let normalized_fee_amount_0_total = normalizeTokenAmountTo1e18(
      current_liquidity_pool.token0,
      event.params.amount0,
      event.chainId
    );
    let normalized_fee_amount_1_total = normalizeTokenAmountTo1e18(
      current_liquidity_pool.token1,
      event.params.amount1,
      event.chainId
    );

    // Calculate amounts in USD
    let normalized_fee_amount_0_total_usd = multiplyBase1e18(
      normalized_fee_amount_0_total,
      token0_instance.pricePerUSD
    );
    let normalized_fee_amount_1_total_usd = multiplyBase1e18(
      normalized_fee_amount_1_total,
      token1_instance.pricePerUSD
    );
    // Create a new instance of LiquidityPoolEntity to be updated in the DB
    const liquidity_pool_instance: LiquidityPoolEntity = {
      ...current_liquidity_pool,
      totalFees0:
        current_liquidity_pool.totalFees0 + normalized_fee_amount_0_total,
      totalFees1:
        current_liquidity_pool.totalFees1 + normalized_fee_amount_1_total,
      totalFeesUSD:
        current_liquidity_pool.totalFeesUSD +
        normalized_fee_amount_0_total_usd +
        normalized_fee_amount_1_total_usd,
      lastUpdatedTimestamp: BigInt(event.blockTimestamp),
    };
    // Update the LiquidityPoolEntity in the DB
    context.LiquidityPool.set(liquidity_pool_instance);
  }
});

PoolContract_Swap_loader(({ event, context }) => {
  //Load the single liquidity pool from the loader to be updated
  context.LiquidityPool.load(event.srcAddress.toString(), {
    loaders: {
      loadToken0: true,
      loadToken1: true,
    },
  });

  //Load the mapping for liquidity pool and the user
  context.LiquidityPoolUserMapping.load(
    getLiquidityPoolAndUserMappingId(
      event.srcAddress.toString(),
      event.params.sender.toString()
    ),
    {}
  );

  //Load the user entity
  context.User.userLoad(event.params.sender.toString());
});

PoolContract_Swap_handler(({ event, context }) => {
  // Fetch the current liquidity pool from the loader
  let current_liquidity_pool = context.LiquidityPool.get(
    event.srcAddress.toString()
  );

  // Fetching the relevant liquidity pool user mapping
  const liquidityPoolUserMapping = context.LiquidityPoolUserMapping.get(
    getLiquidityPoolAndUserMappingId(
      event.srcAddress.toString(),
      event.params.sender.toString()
    )
  );

  // If the mapping doesn't exist yet, create the mapping and save in DB
  if (!liquidityPoolUserMapping) {
    let newLiquidityPoolUserMapping: LiquidityPoolUserMappingEntity = {
      id: getLiquidityPoolAndUserMappingId(
        event.srcAddress.toString(),
        event.params.sender.toString()
      ),
      liquidityPool: event.srcAddress.toString(),
      user: event.params.sender.toString(),
    };

    context.LiquidityPoolUserMapping.set(newLiquidityPoolUserMapping);
  }

  let current_user = context.User.user;
  ``;
  // The pool entity should be created via PoolCreated event from the PoolFactory contract
  if (current_liquidity_pool) {
    // Get the tokens from the loader and update their pricing
    let token0_instance = context.LiquidityPool.getToken0(
      current_liquidity_pool
    );

    let token1_instance = context.LiquidityPool.getToken1(
      current_liquidity_pool
    );

    // Normalize swap amounts to 1e18
    let normalized_amount_0_total = normalizeTokenAmountTo1e18(
      current_liquidity_pool.token0,
      event.params.amount0In + event.params.amount0Out,
      event.chainId
    );
    let normalized_amount_1_total = normalizeTokenAmountTo1e18(
      current_liquidity_pool.token1,
      event.params.amount1In + event.params.amount1Out,
      event.chainId
    );

    // Calculate amounts in USD
    let normalized_amount_0_total_usd = multiplyBase1e18(
      normalized_amount_0_total,
      token0_instance.pricePerUSD
    );
    let normalized_amount_1_total_usd = multiplyBase1e18(
      normalized_amount_1_total,
      token1_instance.pricePerUSD
    );

    let existing_user_id = current_user
      ? current_user.id
      : event.params.sender.toString();
    let existing_user_volume = current_user
      ? current_user.totalSwapVolumeUSD
      : 0n;
    let existing_user_number_of_swaps = current_user
      ? current_user.numberOfSwaps
      : 0n;

    // Create a new instance of UserEntity to be updated in the DB
    const user_instance: UserEntity = {
      id: existing_user_id,
      totalSwapVolumeUSD:
        existing_user_volume +
        normalized_amount_0_total_usd +
        normalized_amount_1_total_usd,
      numberOfSwaps: existing_user_number_of_swaps + 1n,
      lastUpdatedTimestamp: BigInt(event.blockTimestamp),
    };

    // Create a new instance of LiquidityPoolEntity to be updated in the DB
    const liquidity_pool_instance: LiquidityPoolEntity = {
      ...current_liquidity_pool,
      totalVolume0:
        current_liquidity_pool.totalVolume0 + normalized_amount_0_total,
      totalVolume1:
        current_liquidity_pool.totalVolume1 + normalized_amount_1_total,
      totalVolumeUSD:
        current_liquidity_pool.totalVolumeUSD +
        normalized_amount_0_total_usd +
        normalized_amount_1_total_usd,
      numberOfSwaps: current_liquidity_pool.numberOfSwaps + 1n,
      lastUpdatedTimestamp: BigInt(event.blockTimestamp),
    };

    // Update the LiquidityPoolEntity in the DB
    context.LiquidityPool.set(liquidity_pool_instance);
    // Update the UserEntity in the DB
    context.User.set(user_instance);
  }
});

PoolContract_Sync_loader(({ event, context }) => {
  // load the global state store
  context.StateStore.stateStoreLoad(STATE_STORE_ID, {
    loaders: { loadLatestEthPrice: true },
  });

  // Load the single liquidity pool from the loader to be updated
  context.LiquidityPool.singlePoolLoad(event.srcAddress.toString(), {
    loaders: {
      loadToken0: false,
      loadToken1: false,
    },
  });

  // Load stablecoin pools for weighted average ETH price calculation, only if pool is stablecoin pool
  const stableCoinPoolAddresses = isStablecoinPool(
    event.srcAddress.toString().toLowerCase(),
    event.chainId
  )
    ? CHAIN_CONSTANTS[event.chainId].stablecoinPoolAddresses
    : [];
  context.LiquidityPool.stablecoinPoolsLoad(stableCoinPoolAddresses, {});

  // Load all the whitelisted pools i.e. pools with at least one white listed tokens
  context.LiquidityPool.whitelistedPoolsLoad(whitelistedPoolIds, {});

  // Load all the whitelisted tokens to be potentially used in pricing
  context.Token.whitelistedTokensLoad(
    CHAIN_CONSTANTS[event.chainId].whitelistedTokenAddresses
  );
});

PoolContract_Sync_handler(({ event, context }) => {
  const { stateStore } = context.StateStore;
  if (!stateStore) {
    throw new Error(
      "Critical bug: stateStore is undefined. Make sure it is defined on pool creation."
    );
  }

  // Fetch the current liquidity pool from the loader
  let current_liquidity_pool = context.LiquidityPool.singlePool;

  // Get a list of all the whitelisted token entities
  let whitelisted_tokens_list = context.Token.whitelistedTokens.filter(
    (item) => !!item
  ) as TokenEntity[];

  // filter out the pools where the token is not present
  let relevant_pools_list = context.LiquidityPool.whitelistedPools.filter(
    (item): item is LiquidityPoolEntity => item !== undefined
  );

  // Get the LatestETHPrice object
  let latest_eth_price = context.StateStore.getLatestEthPrice(stateStore);

  // The pool entity should be created via PoolCreated event from the PoolFactory contract
  if (current_liquidity_pool) {
    let token0Price = current_liquidity_pool.token0Price;
    let token1Price = current_liquidity_pool.token1Price;

    // Normalize reserve amounts to 1e18
    let normalized_reserve0 = normalizeTokenAmountTo1e18(
      current_liquidity_pool.token0,
      event.params.reserve0,
      event.chainId
    );
    let normalized_reserve1 = normalizeTokenAmountTo1e18(
      current_liquidity_pool.token1,
      event.params.reserve1,
      event.chainId
    );

    // Calculate relative token prices
    if (normalized_reserve0 != 0n && normalized_reserve1 != 0n) {
      token0Price = divideBase1e18(normalized_reserve1, normalized_reserve0);

      token1Price = divideBase1e18(normalized_reserve0, normalized_reserve1);
    }

    // Get the tokens from the loader and update their pricing
    let token0_instance = context.LiquidityPool.getToken0(
      current_liquidity_pool
    );

    let token1_instance = context.LiquidityPool.getToken1(
      current_liquidity_pool
    );

    let token0PricePerETH = findPricePerETH(
      token0_instance.id,
      whitelisted_tokens_list,
      relevant_pools_list,
      event.chainId
    );

    let token1PricePerETH = findPricePerETH(
      token1_instance.id,
      whitelisted_tokens_list,
      relevant_pools_list,
      event.chainId
    );

    if (token0PricePerETH == TEN_TO_THE_18_BI) {
      token1PricePerETH = token1Price;
    }
    if (token1PricePerETH == TEN_TO_THE_18_BI) {
      token0PricePerETH = token0Price;
    }

    // Create a new instance of TokenEntity to be updated in the DB
    const new_token0_instance: TokenEntity = {
      id: token0_instance.id,
      chainID: BigInt(event.chainId),
      pricePerETH: token0PricePerETH,
      pricePerUSD: multiplyBase1e18(token0PricePerETH, latest_eth_price.price),
      lastUpdatedTimestamp: BigInt(event.blockTimestamp),
    };
    const new_token1_instance: TokenEntity = {
      id: token1_instance.id,
      chainID: BigInt(event.chainId),
      pricePerETH: token1PricePerETH,
      pricePerUSD: multiplyBase1e18(token1PricePerETH, latest_eth_price.price),
      lastUpdatedTimestamp: BigInt(event.blockTimestamp),
    };

    // Create a new instance of LiquidityPoolEntity to be updated in the DB
    const liquidity_pool_instance: LiquidityPoolEntity = {
      ...current_liquidity_pool,
      reserve0: normalized_reserve0,
      reserve1: normalized_reserve1,
      totalLiquidityETH:
        multiplyBase1e18(normalized_reserve0, new_token0_instance.pricePerETH) +
        multiplyBase1e18(normalized_reserve1, new_token1_instance.pricePerETH),
      totalLiquidityUSD:
        multiplyBase1e18(normalized_reserve0, new_token0_instance.pricePerUSD) +
        multiplyBase1e18(normalized_reserve1, new_token1_instance.pricePerUSD),
      token0Price,
      token1Price,
      lastUpdatedTimestamp: BigInt(event.blockTimestamp),
    };

    // Create a new instance of LiquidityPoolHourlySnapshotEntity to be updated in the DB
    const liquidity_pool_hourly_snapshot_instance =
      getLiquidityPoolSnapshotByInterval(
        liquidity_pool_instance,
        SnapshotInterval.Hourly
      );

    // Create a new instance of LiquidityPoolDailySnapshotEntity to be updated in the DB
    const liquidity_pool_daily_snapshot_instance =
      getLiquidityPoolSnapshotByInterval(
        liquidity_pool_instance,
        SnapshotInterval.Daily
      );

    // Create a new instance of LiquidityPoolWeeklySnapshotEntity to be updated in the DB
    const liquidity_pool_weekly_snapshot_instance =
      getLiquidityPoolSnapshotByInterval(
        liquidity_pool_instance,
        SnapshotInterval.Weekly
      );

    // Update the LiquidityPoolEntity in the DB
    context.LiquidityPool.set(liquidity_pool_instance);
    // Update the LiquidityPoolDailySnapshotEntity in the DB
    context.LiquidityPoolHourlySnapshot.set(
      liquidity_pool_hourly_snapshot_instance
    );
    // Update the LiquidityPoolDailySnapshotEntity in the DB
    context.LiquidityPoolDailySnapshot.set(
      liquidity_pool_daily_snapshot_instance
    );
    // Update the LiquidityPoolWeeklySnapshotEntity in the DB
    context.LiquidityPoolWeeklySnapshot.set(
      liquidity_pool_weekly_snapshot_instance
    );

    // Updating the Token related entities in DB for token0 and token1
    for (let token_instance of [new_token0_instance, new_token1_instance]) {
      // Create a new instance of LiquidityPoolHourlySnapshotEntity to be updated in the DB
      const token_hourly_snapshot_instance = getTokenSnapshotByInterval(
        token_instance,
        SnapshotInterval.Hourly
      );

      // Create a new instance of LiquidityPoolDailySnapshotEntity to be updated in the DB
      const token_daily_snapshot_instance = getTokenSnapshotByInterval(
        token_instance,
        SnapshotInterval.Daily
      );

      // Create a new instance of LiquidityPoolWeeklySnapshotEntity to be updated in the DB
      const token_weekly_snapshot_instance = getTokenSnapshotByInterval(
        token_instance,
        SnapshotInterval.Weekly
      );

      // Update TokenEntity in the DB
      context.Token.set(token_instance);
      // Update the TokenDailySnapshotEntity in the DB
      context.TokenHourlySnapshot.set(token_hourly_snapshot_instance);
      // Update the TokenDailySnapshotEntity in the DB
      context.TokenDailySnapshot.set(token_daily_snapshot_instance);
      // Update the TokenWeeklySnapshotEntity in the DB
      context.TokenWeeklySnapshot.set(token_weekly_snapshot_instance);
    }

    // Updating of ETH price if the pool is a stablecoin pool
    if (
      isStablecoinPool(event.srcAddress.toString().toLowerCase(), event.chainId)
    ) {
      // Filter out undefined values
      let stablecoin_pools_list = context.LiquidityPool.stablecoinPools.filter(
        (item): item is LiquidityPoolEntity => item !== undefined
      );

      // Overwrite stablecoin pool with latest data
      let poolIndex = stablecoin_pools_list.findIndex(
        (pool) => pool.id === liquidity_pool_instance.id
      );
      stablecoin_pools_list[poolIndex] = liquidity_pool_instance;

      // Calculate weighted average ETH price using stablecoin pools
      let ethPriceInUSD = calculateETHPriceInUSD(stablecoin_pools_list);

      // Creating LatestETHPriceEntity with the latest price
      let latest_eth_price_instance: LatestETHPriceEntity = {
        id: event.blockTimestamp.toString(),
        price: ethPriceInUSD,
      };

      // Creating a new instance of LatestETHPriceEntity to be updated in the DB
      context.LatestETHPrice.set(latest_eth_price_instance);

      // update latestETHPriceKey value with event.blockTimestamp.toString()
      context.StateStore.set({
        ...stateStore,
        latestEthPrice: latest_eth_price_instance.id,
      });
    }
  }
});

VoterContract_GaugeCreated_loader(({ event, context }) => {
  // Load the single liquidity pool from the loader to be updated
  context.LiquidityPool.load(event.params.pool.toString(), {
    loaders: {
      loadToken0: false,
      loadToken1: false,
    },
  });
});

VoterContract_GaugeCreated_handler(({ event, context }) => {
  // Fetch the current liquidity pool from the loader
  let current_liquidity_pool = context.LiquidityPool.get(
    event.params.pool.toString()
  );

  if (current_liquidity_pool) {
    // Create a new instance of GaugeEntity to be updated in the DB
    let gauge: GaugeEntity = {
      id: event.params.gauge.toString(),
      chainID: BigInt(event.chainId),
      pool: event.params.pool.toString(),
      totalEmissions: 0n,
      totalEmissionsUSD: 0n,
      lastUpdatedTimestamp: BigInt(event.blockTimestamp),
    };

    // Create Gauge entity in the DB
    context.Gauge.set(gauge);
  }
});

VoterContract_DistributeReward_loader(({ event, context }) => {
  // Load the Gauge entity to be updated
  context.Gauge.load(event.params.gauge.toString(), {});
  // Load VELO token for conversion of emissions amount into USD
  context.Token.rewardTokenLoad(
    CHAIN_CONSTANTS[event.chainId].rewardToken.address
  );
});

VoterContract_DistributeReward_handler(({ event, context }) => {
  // Fetch VELO Token entity
  let rewardToken = context.Token.rewardToken;
  // Fetch the Gauge entity that was loaded
  let gauge = context.Gauge.get(event.params.gauge.toString());

  // Dev note: Assumption here is that the GaugeCreated event has already been indexed and the Gauge entity has been created
  // Dev note: Assumption here is that the VELO token entity has already been created at this point
  if (gauge && rewardToken) {
    let normalized_emissions_amount = normalizeTokenAmountTo1e18(
      CHAIN_CONSTANTS[event.chainId].rewardToken.address,
      event.params.amount,
      event.chainId
    );

    let normalized_emissions_amount_usd = multiplyBase1e18(
      normalized_emissions_amount,
      rewardToken.pricePerUSD
    );
    // Create a new instance of GaugeEntity to be updated in the DB
    let new_gauge_instance: GaugeEntity = {
      ...gauge,
      totalEmissions: gauge.totalEmissions + normalized_emissions_amount,
      totalEmissionsUSD: gauge.totalEmissions + normalized_emissions_amount_usd,
      lastUpdatedTimestamp: BigInt(event.blockTimestamp),
    };

    // Create Gauge entity in the DB
    context.Gauge.set(new_gauge_instance);
  }
});
