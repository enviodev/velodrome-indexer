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
} from "./src/Types.gen";

import {
  DEFAULT_STATE_STORE,
  INITIAL_ETH_PRICE,
  STABLECOIN_POOL_ADDRESSES,
  STATE_STORE_ID,
  TEN_TO_THE_18_BI,
  TESTING_POOL_ADDRESSES,
  WHITELISTED_TOKENS_ADDRESSES,
  VELO,
} from "./Constants";

import {
  calculateETHPriceInUSD,
  isStablecoinPool,
  findPricePerETH,
  normalizeTokenAmountTo1e18,
} from "./Helpers";

import { divideBase1e18, multiplyBase1e18 } from "./Maths";

PoolFactoryContract_PoolCreated_loader(({ event, context }) => {
  context.StateStore.stateStoreLoad(STATE_STORE_ID, {
    loaders: { loadPoolsWithWhitelistedTokens: {} },
  });
});

PoolFactoryContract_PoolCreated_handler(({ event, context }) => {
  // TODO remove this when we are indexing all the pools
  if (TESTING_POOL_ADDRESSES.includes(event.params.pool.toString())) {
    // Create new instances of TokenEntity to be updated in the DB
    const token0_instance: TokenEntity = {
      id: event.params.token0.toString(),
      pricePerETH: 0n,
      pricePerUSD: 0n,
      lastUpdatedTimestamp: BigInt(event.blockTimestamp),
    };

    const token1_instance: TokenEntity = {
      id: event.params.token1.toString(),
      pricePerETH: 0n,
      pricePerUSD: 0n,
      lastUpdatedTimestamp: BigInt(event.blockTimestamp),
    };

    // Create a new instance of LiquidityPoolEntity to be updated in the DB
    const new_pool: LiquidityPoolEntity = {
      id: event.params.pool.toString(),
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
      WHITELISTED_TOKENS_ADDRESSES.includes(token0_instance.id) ||
      WHITELISTED_TOKENS_ADDRESSES.includes(token1_instance.id)
    ) {
      if (context.StateStore.stateStore) {
        context.StateStore.set({
          ...context.StateStore.stateStore,
          poolsWithWhitelistedTokens: [
            ...(context.StateStore.stateStore?.poolsWithWhitelistedTokens ||
              []),
            new_pool.id,
          ],
        });
      } else {
        context.LatestETHPrice.set(INITIAL_ETH_PRICE);
        context.StateStore.set({
          ...DEFAULT_STATE_STORE,
          poolsWithWhitelistedTokens: [new_pool.id],
        });
      }
    } else {
      context.log.info(
        `Pool with address ${event.params.pool.toString()} does not contain any whitelisted tokens`
      );
    }
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
      event.params.amount0
    );
    let normalized_fee_amount_1_total = normalizeTokenAmountTo1e18(
      current_liquidity_pool.token1,
      event.params.amount1
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
});

PoolContract_Swap_handler(({ event, context }) => {
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
    let normalized_amount_0_total = normalizeTokenAmountTo1e18(
      current_liquidity_pool.token0,
      event.params.amount0In + event.params.amount0Out
    );
    let normalized_amount_1_total = normalizeTokenAmountTo1e18(
      current_liquidity_pool.token1,
      event.params.amount1In + event.params.amount1Out
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
  }
});

PoolContract_Sync_loader(({ event, context }) => {
  // load the global state store
  context.StateStore.stateStoreLoad(STATE_STORE_ID, {
    loaders: { loadLatestEthPrice: true, loadPoolsWithWhitelistedTokens: {} },
  });

  // Load the single liquidity pool from the loader to be updated
  context.LiquidityPool.singlePoolLoad(event.srcAddress.toString(), {
    loaders: {
      loadToken0: false,
      loadToken1: false,
    },
  });

  // Load stablecoin pools for weighted average ETH price calculation, only if pool is stablecoin pool
  const stableCoinAddresses = isStablecoinPool(
    event.srcAddress.toString().toLowerCase()
  )
    ? STABLECOIN_POOL_ADDRESSES
    : [];
  context.LiquidityPool.stablecoinPoolsLoad(stableCoinAddresses, {});

  // Load all the whitelisted tokens to be potentially used in pricing
  context.Token.whitelistedTokensLoad(WHITELISTED_TOKENS_ADDRESSES);
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
  let relevant_pools_list =
    context.StateStore.getPoolsWithWhitelistedTokens(stateStore);

  // Get the LatestETHPrice object
  let latest_eth_price = context.StateStore.getLatestEthPrice(stateStore);

  // The pool entity should be created via PoolCreated event from the PoolFactory contract
  if (current_liquidity_pool) {
    let token0Price = current_liquidity_pool.token0Price;
    let token1Price = current_liquidity_pool.token1Price;

    // Normalize reserve amounts to 1e18
    let normalized_reserve0 = normalizeTokenAmountTo1e18(
      current_liquidity_pool.token0,
      event.params.reserve0
    );
    let normalized_reserve1 = normalizeTokenAmountTo1e18(
      current_liquidity_pool.token1,
      event.params.reserve1
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
      relevant_pools_list
    );

    let token1PricePerETH = findPricePerETH(
      token1_instance.id,
      whitelisted_tokens_list,
      relevant_pools_list
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
      pricePerETH: token0PricePerETH,
      pricePerUSD: multiplyBase1e18(token0PricePerETH, latest_eth_price.price),
      lastUpdatedTimestamp: BigInt(event.blockTimestamp),
    };
    const new_token1_instance: TokenEntity = {
      id: token1_instance.id,
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

    // Update TokenEntities in the DB
    context.Token.set(new_token0_instance);
    context.Token.set(new_token1_instance);
    // Update the LiquidityPoolEntity in the DB
    context.LiquidityPool.set(liquidity_pool_instance);

    // Updating of ETH price if the pool is a stablecoin pool
    if (isStablecoinPool(event.srcAddress.toString().toLowerCase())) {
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
  context.Token.veloTokenLoad(VELO.address);
});

VoterContract_DistributeReward_handler(({ event, context }) => {
  // Fetch VELO Token entity
  let veloToken = context.Token.veloToken;
  // Fetch the Gauge entity that was loaded
  let gauge = context.Gauge.get(event.params.gauge.toString());

  // Dev note: Assumption here is that the GaugeCreated event has already been indexed and the Gauge entity has been created
  // Dev note: Assumption here is that the VELO token entity has already been created at this point
  if (gauge && veloToken) {
    let normalized_emissions_amount = normalizeTokenAmountTo1e18(
      VELO.address,
      event.params.amount
    );

    let normalized_emissions_amount_usd = multiplyBase1e18(
      normalized_emissions_amount,
      veloToken.pricePerUSD
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
