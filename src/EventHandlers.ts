import {
  PoolContract_Sync_loader,
  PoolContract_Sync_handler,
  PoolContract_Swap_loader,
  PoolContract_Swap_handler,
} from "../generated/src/Handlers.gen";
import { poolEntity } from "./src/Types.gen";

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
      numberOfSwaps: current_pool.numberOfSwaps + BigInt(1),
    };
    context.Pool.set(pool_instance);
  } else {
    const pool_instance: poolEntity = {
      id: event.srcAddress.toString(),
      reserve0: BigInt(0),
      reserve1: BigInt(0),
      cumulativeVolume0: BigInt(event.params.amount0In),
      cumulativeVolume1: BigInt(event.params.amount1In),
      numberOfSwaps: BigInt(1),
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
    const pool_instance: poolEntity = {
      ...current_pool,
      reserve0: BigInt(event.params.reserve0),
      reserve1: BigInt(event.params.reserve1),
    };
    context.Pool.set(pool_instance);
  } else {
    const pool_instance: poolEntity = {
      id: event.srcAddress.toString(),
      reserve0: BigInt(event.params.reserve0),
      reserve1: BigInt(event.params.reserve1),
      cumulativeVolume0: BigInt(0),
      cumulativeVolume1: BigInt(0),
      numberOfSwaps: BigInt(0),
    };
    context.Pool.set(pool_instance);
  }
});
