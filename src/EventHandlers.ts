/*
 *Please refer to https://docs.envio.dev for a thorough guide on all Envio indexer features*
 */

// code below is purely for demonstration purposes
// please use it for reference only and delete it when you start working on your indexer

import { PoolContract_Sync_handler } from "../generated/src/Handlers.gen";

PoolContract_Sync_handler(({ event, context }) => {
  const pair_instance = {
    id: String(event.blockNumber),
    timestamp: BigInt(event.blockTimestamp),
    reserve0: BigInt(event.params.reserve0),
    reserve1: BigInt(event.params.reserve1),
  };
  context.pair.set(pair_instance);
});
