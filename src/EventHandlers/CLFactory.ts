import { CLFactory, CLFactory_PoolCreated, CLPoolAggregator } from "generated";
import { updateCLPoolAggregator } from "../Aggregators/CLPoolAggregator";
import { TokenEntityMapping } from "../CustomTypes";
import { getErc20TokenDetails } from "../Erc20";
import { TokenIdByChain } from "../Constants";
import { generatePoolName } from "../Helpers";

CLFactory.PoolCreated.contractRegister(({ event, context }) => {
  context.addCLPool(event.params.pool);
});

CLFactory.PoolCreated.handlerWithLoader({
  loader: async ({ event, context }) => {
    const [poolToken0, poolToken1] = await Promise.all([
      context.Token.get(TokenIdByChain(event.params.token0, event.chainId)),
      context.Token.get(TokenIdByChain(event.params.token1, event.chainId)),
    ]);

    return { poolToken0, poolToken1 };
  },
  handler: async ({ event, context, loaderReturn }) => {

    const entity: CLFactory_PoolCreated = {
      id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
      token0: TokenIdByChain(event.params.token0, event.chainId),
      token1: TokenIdByChain(event.params.token1, event.chainId),
      tickSpacing: event.params.tickSpacing,
      pool: event.params.pool,
      timestamp: new Date(event.block.timestamp * 1000),
      chainId: event.chainId,
    };

    context.CLFactory_PoolCreated.set(entity);

    const { poolToken0, poolToken1 } = loaderReturn;
    let poolTokenSymbols: string[] = [];
    let poolTokenAddressMappings: TokenEntityMapping[] = [
      { address: event.params.token0, tokenInstance: poolToken0 },
      { address: event.params.token1, tokenInstance: poolToken1 },
    ];

    for (let poolTokenAddressMapping of poolTokenAddressMappings) {
      if (poolTokenAddressMapping.tokenInstance == undefined) {
        const { symbol: tokenSymbol } = await getErc20TokenDetails(
          poolTokenAddressMapping.address,
          event.chainId
        );
        poolTokenSymbols.push(tokenSymbol);
      } else {
        poolTokenSymbols.push(poolTokenAddressMapping.tokenInstance.symbol);
      }
    }

    const aggregator: CLPoolAggregator = {
      id: event.params.pool,
      chainId: event.chainId,
      name: generatePoolName(
        poolTokenSymbols[0],
        poolTokenSymbols[1],
        false // Pool is not stable
      ),
      token0_id: TokenIdByChain(event.params.token0, event.chainId),
      token1_id: TokenIdByChain(event.params.token1, event.chainId),
      token0_address: event.params.token0,
      token1_address: event.params.token1,
      isStable: false,
      reserve0: 0n,
      reserve1: 0n,
      totalLiquidityUSD: 0n,
      totalVolume0: 0n,
      totalVolume1: 0n,
      totalVolumeUSD: 0n,
      totalFees0: 0n,
      totalFees1: 0n,
      totalFeesUSD: 0n,
      numberOfSwaps: 0n,
      token0Price: 0n,
      token1Price: 0n,
      totalEmissions: 0n,
      totalEmissionsUSD: 0n,
      totalBribesUSD: 0n,
      lastUpdatedTimestamp: new Date(event.block.timestamp * 1000),
      lastSnapshotTimestamp: new Date(event.block.timestamp * 1000),
    };

    updateCLPoolAggregator(
      aggregator,
      aggregator,
      new Date(event.block.timestamp * 1000),
      context
    );
  },
});
