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
  LatestETHPriceUSDEntity,
} from "./src/Types.gen";
import { TEN_TO_THE_18_BI, STABLECOIN_POOLS } from "./CONSTANTS";
import {
  normalizeTokenAmountTo1e18,
  calculateETHPriceInUSD,
  isStablecoinPool,
} from "./helpers";

let stablecoin_pool_addresses = Object.keys(STABLECOIN_POOLS);

PoolFactoryContract_PoolCreated_handler(({ event, context }) => {
  const new_pool: LiquidityPoolEntity = {
    id: event.params.pool.toString(),
    token0: event.params.token0.toString(),
    token1: event.params.token1.toString(),
    stable: event.params.stable,
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
  context.LiquidityPool.set(new_pool);

  const token0: TokenEntity = {
    id: event.params.token0.toString(),
    pricePerETH: 0n,
  };
  const token1: TokenEntity = {
    id: event.params.token1.toString(),
    pricePerETH: 0n,
  };
  context.Token.set(token0);
  context.Token.set(token1);
});

PoolContract_Fees_loader(({ event, context }) => {
  let _ = context.LiquidityPool.load(event.srcAddress.toString());
});

PoolContract_Fees_handler(({ event, context }) => {
  let current_liquidity_pool = context.LiquidityPool.get(
    event.srcAddress.toString()
  );

  if (current_liquidity_pool) {
    const liquidity_pool_instance: LiquidityPoolEntity = {
      ...current_liquidity_pool,
      cumulativeFees0:
        current_liquidity_pool.cumulativeFees0 + BigInt(event.params.amount0),
      cumulativeFees1:
        current_liquidity_pool.cumulativeFees1 + BigInt(event.params.amount1),
      lastUpdatedTimestamp: BigInt(event.blockTimestamp),
    };
    context.LiquidityPool.set(liquidity_pool_instance);
  }
});

PoolContract_Swap_loader(({ event, context }) => {
  let _ = context.LiquidityPool.load(event.srcAddress.toString());
});

PoolContract_Swap_handler(({ event, context }) => {
  let current_liquidity_pool = context.LiquidityPool.get(
    event.srcAddress.toString()
  );

  if (current_liquidity_pool) {
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
    context.LiquidityPool.set(liquidity_pool_instance);
  }
});

PoolContract_Sync_loader(({ event, context }) => {
  let _ = context.LiquidityPool.singlePoolLoad(event.srcAddress.toString());
  if (isStablecoinPool(event.srcAddress.toString().toLowerCase())) {
    context.LiquidityPool.stablePoolsLoad(stablecoin_pool_addresses);
  }
});

PoolContract_Sync_handler(({ event, context }) => {

  let current_liquidity_pool = context.LiquidityPool.singlePool;

  if (current_liquidity_pool) {
    let token0Price = current_liquidity_pool.token0Price;
    let token1Price = current_liquidity_pool.token1Price;

    let normalized_reserve0 = normalizeTokenAmountTo1e18(
      current_liquidity_pool.token0,
      event.params.reserve0
    );
    let normalized_reserve1 = normalizeTokenAmountTo1e18(
      current_liquidity_pool.token1,
      event.params.reserve1
    );

    if (normalized_reserve0 != 0n && normalized_reserve1 != 0n) {
      token0Price =
        (TEN_TO_THE_18_BI * normalized_reserve1) / normalized_reserve0;

      token1Price =
        (TEN_TO_THE_18_BI * normalized_reserve0) / normalized_reserve1;
    }

    const liquidity_pool_instance: LiquidityPoolEntity = {
      ...current_liquidity_pool,
      reserve0: normalized_reserve0,
      reserve1: normalized_reserve1,
      token0Price,
      token1Price,
      lastUpdatedTimestamp: BigInt(event.blockTimestamp),
    };
    context.LiquidityPool.set(liquidity_pool_instance);
    if (isStablecoinPool(event.srcAddress.toString().toLowerCase())) {
      // Filter out undefined values
      let stablecoin_pools_list = context.LiquidityPool.stablePools.filter(
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
    }
  }
});
