import {
  PoolContract_Fees_loader,
  PoolContract_Fees_handler,
  PoolContract_Sync_loader,
  PoolContract_Sync_handler,
  PoolContract_Swap_loader,
  PoolContract_Swap_handler,
  PoolFactoryContract_PoolCreated_handler,
} from "../generated/src/Handlers.gen";

import {
  LiquidityPoolEntity,
  TokenEntity,
  LatestETHPriceEntity,
  liquidityPoolEntity,
} from "./src/Types.gen";

import {
  TEN_TO_THE_18_BI,
  STABLECOIN_POOL_ADDRESSES,
  WHITELISTED_TOKENS_ADDRESSES,
  TESTING_POOL_ADDRESSES,
} from "./Constants";

import {
  normalizeTokenAmountTo1e18,
  calculateETHPriceInUSD,
  isStablecoinPool,
  findPricePerETH,
  multiplyBase1e18,
  divideBase1e18,
} from "./Helpers";

import {
  poolsWithWhitelistedTokens,
  updateLatestETHPriceKey,
  getLatestETHPriceKey,
} from "./Store";

PoolFactoryContract_PoolCreated_handler(({ event, context }) => {
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
    // Create TokenEntities in the DB
    context.Token.set(token0_instance);
    context.Token.set(token1_instance);

    // Create a new instance of LiquidityPoolEntity to be updated in the DB
    const new_pool: LiquidityPoolEntity = {
      id: event.params.pool.toString(),
      token0: token0_instance.id,
      token1: token1_instance.id,
      isStable: event.params.stable,
      reserve0: 0n,
      reserve1: 0n,
      cumulativeVolume0: 0n,
      cumulativeVolume1: 0n,
      cumulativeFees0: 0n,
      cumulativeFees1: 0n,
      numberOfSwaps: 1n,
      token0Price: 0n,
      token1Price: 0n,
      lastUpdatedTimestamp: BigInt(event.blockTimestamp),
    };
    // Create the LiquidityPoolEntity in the DB
    context.LiquidityPool.set(new_pool);

    // Push the pool that was created to the poolsWithWhitelistedTokens list if the pool contains at least one whitelisted token
    if (
      WHITELISTED_TOKENS_ADDRESSES.includes(token0_instance.id) ||
      WHITELISTED_TOKENS_ADDRESSES.includes(token1_instance.id)
    ) {
      poolsWithWhitelistedTokens.push({
        address: event.params.pool.toString(),
        token0_address: event.params.token0.toString(),
        token1_address: event.params.token1.toString(),
      });
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
    // Create a new instance of LiquidityPoolEntity to be updated in the DB
    const liquidity_pool_instance: LiquidityPoolEntity = {
      ...current_liquidity_pool,
      cumulativeFees0:
        current_liquidity_pool.cumulativeFees0 + BigInt(event.params.amount0),
      cumulativeFees1:
        current_liquidity_pool.cumulativeFees1 + BigInt(event.params.amount1),
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
    // Create a new instance of LiquidityPoolEntity to be updated in the DB
    const liquidity_pool_instance: LiquidityPoolEntity = {
      ...current_liquidity_pool,
      cumulativeVolume0:
        current_liquidity_pool.cumulativeVolume0 +
        BigInt(event.params.amount0In),
      cumulativeVolume1:
        current_liquidity_pool.cumulativeVolume1 +
        BigInt(event.params.amount1In),
      numberOfSwaps: current_liquidity_pool.numberOfSwaps + 1n,
      lastUpdatedTimestamp: BigInt(event.blockTimestamp),
    };
    // Update the LiquidityPoolEntity in the DB
    context.LiquidityPool.set(liquidity_pool_instance);
  }
});

PoolContract_Sync_loader(({ event, context }) => {
  // Load the single liquidity pool from the loader to be updated
  context.LiquidityPool.singlePoolLoad(event.srcAddress.toString(), {
    loaders: {
      loadToken0: true,
      loadToken1: true,
    },
  });

  // Load stablecoin pools for weighted average ETH price calculation, only if pool is stablecoin pool
  if (isStablecoinPool(event.srcAddress.toString().toLowerCase())) {
    context.LiquidityPool.stablecoinPoolsLoad(STABLECOIN_POOL_ADDRESSES, {});
  }

  // Load all the pools to be used in pricing
  // Use the addresses from poolsWithWhitelistedTokens list
  context.LiquidityPool.pricingPoolsLoad(
    poolsWithWhitelistedTokens.map((pool) => pool.address),
    {}
  );

  // Load all the whitelisted tokens to be potentially used in pricing
  context.Token.whitelistedTokensLoad(WHITELISTED_TOKENS_ADDRESSES);

  // Load LatestETHPrice entity
  context.LatestETHPrice.load(getLatestETHPriceKey());
});

PoolContract_Sync_handler(({ event, context }) => {
  // Fetch the current liquidity pool from the loader
  let current_liquidity_pool = context.LiquidityPool.singlePool;

  // Get a list of all the whitelisted token entities
  let whitelisted_tokens_list = context.Token.whitelistedTokens.filter(
    (item): item is TokenEntity => item !== undefined
  );

  // filter out the pools where the token is not present
  let relevant_pools_list = context.LiquidityPool.pricingPools.filter(
    (item): item is liquidityPoolEntity => item !== undefined
  );

  // Get the LatestETHPrice object
  let latest_eth_price = context.LatestETHPrice.get(getLatestETHPriceKey());

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

    // Create a new instance of LiquidityPoolEntity to be updated in the DB
    const liquidity_pool_instance: LiquidityPoolEntity = {
      ...current_liquidity_pool,
      reserve0: normalized_reserve0,
      reserve1: normalized_reserve1,
      token0Price,
      token1Price,
      lastUpdatedTimestamp: BigInt(event.blockTimestamp),
    };

    // Update the LiquidityPoolEntity in the DB
    context.LiquidityPool.set(liquidity_pool_instance);

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
      updateLatestETHPriceKey(event.blockTimestamp.toString());
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
      token0_instance.id,
      whitelisted_tokens_list,
      relevant_pools_list
    );

    if (token0PricePerETH == TEN_TO_THE_18_BI) {
      token1PricePerETH = token1Price;
    }
    if (token1PricePerETH == TEN_TO_THE_18_BI) {
      token0PricePerETH = token0Price;
    }

    if (latest_eth_price) {
      // Create a new instance of TokenEntity to be updated in the DB
      const new_token0_instance: TokenEntity = {
        id: token0_instance.id,
        pricePerETH: token0PricePerETH,
        pricePerUSD: multiplyBase1e18(
          token0PricePerETH,
          latest_eth_price.price
        ),
        lastUpdatedTimestamp: BigInt(event.blockTimestamp),
      };
      const new_token1_instance: TokenEntity = {
        id: token1_instance.id,
        pricePerETH: token1PricePerETH,
        pricePerUSD: multiplyBase1e18(
          token1PricePerETH,
          latest_eth_price.price
        ),
        lastUpdatedTimestamp: BigInt(event.blockTimestamp),
      };

      context.Token.set(new_token0_instance);
      context.Token.set(new_token1_instance);
    }
  }
});
