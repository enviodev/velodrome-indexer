import {
  PoolContract_Fees_loader,
  PoolContract_Fees_handler,
  PoolContract_Sync_loader,
  PoolContract_Sync_handler,
  PoolContract_Swap_loader,
  PoolContract_Swap_handler,
} from "../generated/src/Handlers.gen";
import { poolEntity } from "./src/Types.gen";

const TEN_TO_THE_18_BI = BigInt(10 ^ 18);

PoolContract_Fees_loader(({ event, context }) => {
  let _ = context.Pool.load(event.srcAddress.toString());
});

PoolContract_Fees_handler(({ event, context }) => {
  let current_pool = context.Pool.get(event.srcAddress.toString());

  if (current_pool) {
    const pool_instance: poolEntity = {
      ...current_pool,
      cumulativeFees0:
        current_pool.cumulativeFees0 + BigInt(event.params.amount0),
      cumulativeFees1:
        current_pool.cumulativeFees1 + BigInt(event.params.amount1),
    };
    context.Pool.set(pool_instance);
  } else {
    const pool_instance: poolEntity = {
      id: event.srcAddress.toString(),
      reserve0: 0n,
      reserve1: 0n,
      cumulativeVolume0: 0n,
      cumulativeVolume1: 0n,
      cumulativeFees0: BigInt(event.params.amount0),
      cumulativeFees1: BigInt(event.params.amount1),
      numberOfSwaps: 1n,
      token0Price: 0n,
      token1Price: 0n,
    };
    context.Pool.set(pool_instance);
  }
});

PoolContract_Swap_loader(({ event, context }) => {
  let _ = context.Pool.load(event.srcAddress.toString());
});

PoolContract_Swap_handler(({ event, context }) => {
  let current_pool = context.Pool.get(event.srcAddress.toString());

  if (current_pool) {
    const pool_instance: poolEntity = {
      ...current_pool,
      cumulativeVolume0:
        current_pool.cumulativeVolume0 + BigInt(event.params.amount0In),
      cumulativeVolume1:
        current_pool.cumulativeVolume1 + BigInt(event.params.amount1In),
      numberOfSwaps: current_pool.numberOfSwaps + 1n,
    };
    context.Pool.set(pool_instance);
  } else {
    const pool_instance: poolEntity = {
      id: event.srcAddress.toString(),
      reserve0: 0n,
      reserve1: 0n,
      cumulativeVolume0: BigInt(event.params.amount0In),
      cumulativeVolume1: BigInt(event.params.amount1In),
      cumulativeFees0: 0n,
      cumulativeFees1: 0n,
      numberOfSwaps: 1n,
      token0Price: 0n,
      token1Price: 0n,
    };
    context.Pool.set(pool_instance);
  }
});

PoolContract_Sync_loader(({ event, context }) => {
  let _ = context.Pool.load(event.srcAddress.toString());
});

PoolContract_Sync_handler(({ event, context }) => {
  let current_pool = context.Pool.get(event.srcAddress.toString());

  if (current_pool) {
    let token0Price = current_pool.token0Price;
    let token1Price = current_pool.token1Price;

    if (event.params.reserve0 != 0n && event.params.reserve1 != 0n) {
      token1Price =
        (TEN_TO_THE_18_BI * event.params.reserve1) / event.params.reserve0;

      token0Price =
        (TEN_TO_THE_18_BI * event.params.reserve0) / event.params.reserve1;
    }

    const pool_instance: poolEntity = {
      ...current_pool,
      reserve0: BigInt(event.params.reserve0),
      reserve1: BigInt(event.params.reserve1),
      token0Price,
      token1Price,
    };
    context.Pool.set(pool_instance);
  } else {
    let token0Price = 0n;
    let token1Price = 0n;
    if (event.params.reserve0 != 0n && event.params.reserve1 != 0n) {
      token1Price =
        (TEN_TO_THE_18_BI * event.params.reserve1) / event.params.reserve0;

      token0Price =
        (TEN_TO_THE_18_BI * event.params.reserve0) / event.params.reserve1;
    }

    const pool_instance: poolEntity = {
      id: event.srcAddress.toString(),
      reserve0: BigInt(event.params.reserve0),
      reserve1: BigInt(event.params.reserve1),
      cumulativeVolume0: 0n,
      cumulativeVolume1: 0n,
      cumulativeFees0: 0n,
      cumulativeFees1: 0n,
      numberOfSwaps: 0n,
      token0Price,
      token1Price,
    };
    context.Pool.set(pool_instance);
  }
});
