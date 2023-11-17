import {
  PoolContract_Sync_loader,
  PoolContract_Sync_handler,
} from "../generated/src/Handlers.gen";
import { poolEntity } from "./src/Types.gen";

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
    };
    context.Pool.set(pool_instance);
  }
});
