/*
 *Please refer to https://docs.envio.dev for a thorough guide on all Envio indexer features*
 */

// code below is purely for demonstration purposes
// please use it for reference only and delete it when you start working on your indexer

import {
  FactoryContract_PoolCreated_loader,
  FactoryContract_PoolCreated_handler,
  PoolContract_Sync_loader,
  PoolContract_Sync_handler,
} from "../generated/src/Handlers.gen";
import { poolEntity } from "./src/Types.gen";

FactoryContract_PoolCreated_handler(({ event, context }) => {
  let pool_instance: poolEntity = {
    id: event.params.pool.toString(),
    token0: event.params.token0.toString(),
    token1: event.params.token1.toString(),
    stable: event.params.stable,
    reserve0: BigInt(0),
    reserve1: BigInt(0),
  };

  console.log("pool_instance", pool_instance);

  context.pool.set(pool_instance);
});

PoolContract_Sync_loader(({ event, context }) => {
  let _ = context.pool.load(event.srcAddress.toString());
});

PoolContract_Sync_handler(({ event, context }) => {
  let current_pool = context.pool.get(event.srcAddress.toString());

  if (current_pool) {
    const pool_instance: poolEntity = {
      ...current_pool,
      reserve0: BigInt(event.params.reserve0),
      reserve1: BigInt(event.params.reserve1),
    };
    context.pool.set(pool_instance);
  }
});
