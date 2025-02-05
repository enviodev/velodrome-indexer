import {
  CLFactory,
  CLFactory_PoolCreated,
  LiquidityPoolAggregator,
  Token,
} from "generated";
import { updateLiquidityPoolAggregator } from "../Aggregators/LiquidityPoolAggregator";
import { TokenEntityMapping } from "../CustomTypes";
import { TokenIdByChain } from "../Constants";
import { generatePoolName } from "../Helpers";
import { createTokenEntity } from "../PriceOracle";
import { Erc20TokenDetails, getErc20TokenDetails } from "../Erc20";

CLFactory.PoolCreated.contractRegister(
  ({ event, context }) => {
    context.addCLPool(event.params.pool);
  },
  { preRegisterDynamicContracts: true }
);

CLFactory.PoolCreated.handlerWithLoader({
  loader: async ({ event, context }) => {
    const poolTokens = await Promise.all(
      [event.params.token0, event.params.token1].map(async (address) => ({
        token: await context.Token.get(TokenIdByChain(address, event.chainId)),
        address,
      }))
    );

    const [tokenData0, tokenData1] = await Promise.all(
      poolTokens.map(async ({ token, address }) => {
        let tokenDetails: Erc20TokenDetails;
        if (token) {
          const { name, symbol, decimals } = token;
          tokenDetails = { name, symbol, decimals };
        } else {
          tokenDetails = await getErc20TokenDetails(address, event.chainId);
        }

        return {
          token,
          address,
          tokenDetails,
          isWhitelisted: token?.isWhitelisted ?? false,
        };
      })
    );

    return { tokenData0, tokenData1 };
  },
  handler: async ({ event, context, loaderReturn }) => {
    const entity: CLFactory_PoolCreated = {
      id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
      token0: TokenIdByChain(event.params.token0, event.chainId),
      token1: TokenIdByChain(event.params.token1, event.chainId),
      tickSpacing: event.params.tickSpacing,
      pool: event.params.pool,
      timestamp: new Date(event.block.timestamp * 1000),
      blockNumber: event.block.number,
      logIndex: event.logIndex,
      chainId: event.chainId,
    };

    context.CLFactory_PoolCreated.set(entity);

    const { tokenData0, tokenData1 } = loaderReturn;
    loaderReturn;
    const poolTokenSymbols = [
      tokenData0.tokenDetails.symbol,
      tokenData1.tokenDetails.symbol,
    ];

    for (let tokenData of [tokenData0, tokenData1]) {
      if (tokenData.token === undefined) {
        createTokenEntity(
          tokenData.address,
          event.chainId,
          event.block.number,
          tokenData.tokenDetails,
          context
        );
      }
    }

    const aggregator: LiquidityPoolAggregator = {
      id: event.params.pool,
      chainId: event.chainId,
      name: generatePoolName(
        poolTokenSymbols[0],
        poolTokenSymbols[1],
        false, // Pool is not stable
        Number(event.params.tickSpacing) // Pool is CL
      ),
      token0_id: TokenIdByChain(event.params.token0, event.chainId),
      token1_id: TokenIdByChain(event.params.token1, event.chainId),
      token0_address: event.params.token0,
      token1_address: event.params.token1,
      isStable: false,
      isCL: true,
      reserve0: 0n,
      reserve1: 0n,
      totalLiquidityUSD: 0n,
      totalVolume0: 0n,
      totalVolume1: 0n,
      totalVolumeUSD: 0n,
      totalVolumeUSDWhitelisted: 0n,
      totalFees0: 0n,
      totalFees1: 0n,
      totalFeesUSD: 0n,
      totalFeesUSDWhitelisted: 0n,
      numberOfSwaps: 0n,
      token0Price: 0n,
      token1Price: 0n,
      totalVotesDeposited: 0n,
      totalVotesDepositedUSD: 0n,
      totalEmissions: 0n,
      totalEmissionsUSD: 0n,
      totalBribesUSD: 0n,
      gaugeIsAlive: false,
      token0IsWhitelisted: tokenData0.isWhitelisted,
      token1IsWhitelisted: tokenData1.isWhitelisted,
      lastUpdatedTimestamp: new Date(event.block.timestamp * 1000),
      lastSnapshotTimestamp: new Date(event.block.timestamp * 1000),
    };

    updateLiquidityPoolAggregator(
      aggregator,
      aggregator,
      new Date(event.block.timestamp * 1000),
      context
    );
  },
});
