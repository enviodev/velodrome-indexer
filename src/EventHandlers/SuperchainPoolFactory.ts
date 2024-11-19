import { SuperchainPoolFactory, SuperchainPoolFactory_RootPoolCreated } from "generated";

import { TokenIdByChain } from "../Constants";

SuperchainPoolFactory.RootPoolCreated.handlerWithLoader({
  loader: async ({ event, context }) => {

    const poolChainId = event.chainId;

    const [poolToken0, poolToken1] = await Promise.all([
      context.Token.get(TokenIdByChain(event.params.token0, poolChainId)),
      context.Token.get(TokenIdByChain(event.params.token1, poolChainId)),
    ]);

    return { poolToken0, poolToken1, poolChainId };
  },
  handler: async ({ event, context, loaderReturn }) => {
    const { poolToken0, poolToken1, poolChainId } = loaderReturn;

    const entity: SuperchainPoolFactory_RootPoolCreated = {
      id: `${poolChainId}_${event.block.number}_${event.logIndex}`,
      token0: event.params.token0,
      token1: event.params.token1,
      pool: event.params.pool,
      timestamp: new Date(event.block.timestamp * 1000),
      chainId: event.chainId,
      poolChainId,
      stable: event.params.stable,
      length: event.params.length,
    };

    context.SuperchainPoolFactory_RootPoolCreated.set(entity);
  },
});