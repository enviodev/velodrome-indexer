import {
  PoolContract_Fees_loader,
  PoolContract_Fees_handler,
  PoolContract_Sync_loader,
  PoolContract_Sync_handler,
  PoolContract_Swap_loader,
  PoolContract_Swap_handler,
  PoolFactoryContract_PoolCreated_loader,
  PoolFactoryContract_PoolCreated_handler,
} from "../generated/src/Handlers.gen";

import {
  LiquidityPoolEntity,
  TokenEntity,
  LatestETHPriceEntity,
  UserEntity,
  LiquidityPoolUserMappingEntity,
} from "./src/Types.gen";

import {
  TEN_TO_THE_18_BI,
  STABLECOIN_POOL_ADDRESSES,
  WHITELISTED_TOKENS_ADDRESSES,
  TESTING_POOL_ADDRESSES,
  STATE_STORE_ID,
  INITIAL_ETH_PRICE,
  DEFAULT_STATE_STORE,
} from "./Constants";

import {
  normalizeTokenAmountTo1e18,
  calculateETHPriceInUSD,
  isStablecoinPool,
  findPricePerETH,
  getLiquidityPoolAndUserMappingId,
} from "./Helpers";

import { divideBase1e18, multiplyBase1e18 } from "./Maths";

PoolFactoryContract_PoolCreated_loader(({ event, context }) => {
  context.StateStore.stateStoreLoad(STATE_STORE_ID, {
    loaders: { loadPoolsWithWhitelistedTokens: {} },
  });
});

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
      totalLiquidityETH: 0n,
      totalLiquidityUSD: 0n,
      totalVolume0: 0n,
      totalVolume1: 0n,
      totalVolumeUSD: 0n,
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
  context.LiquidityPool.load(event.srcAddress.toString(), {});
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
      event.params.amount0In + event.params.amount0Out
    );
    let normalized_amount_1_total = normalizeTokenAmountTo1e18(
      current_liquidity_pool.token1,
      event.params.amount1In + event.params.amount1Out
    );

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

    context.Token.set(new_token0_instance);
    context.Token.set(new_token1_instance);

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
