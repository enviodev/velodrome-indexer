import {
  PoolFactory,
  PoolFactory_SetCustomFee,
} from "generated";

import { getErc20TokenDetails } from "./../Erc20";

import { TokenEntityMapping } from "./../CustomTypes";
import { Token, LiquidityPoolNew } from "./../src/Types.gen";
import { generatePoolName } from "./../Helpers";

PoolFactory.PoolCreated.contractRegister(({ event, context }) => {
  context.addPool(event.params.pool);
});

PoolFactory.PoolCreated.handlerWithLoader({
  loader: async ({ event, context }) => {
    // load the token entities
    const poolToken0 = await context.Token.get(
      event.params.token0 + "-" + event.chainId.toString()
    );
    const poolToken1 = await context.Token.get(
      event.params.token1 + "-" + event.chainId.toString()
    );

    return { poolToken1, poolToken0 };
  },

  handler: async ({
    event,
    context,
    loaderReturn: { poolToken1, poolToken0 },
  }) => {
    // Create an array to store the token symbols for pool naming later
    let poolTokenSymbols: string[] = [];

    // Create a mapping of poolToken to its address
    let poolTokenAddressMappings: TokenEntityMapping[] = [
      { address: event.params.token0, tokenInstance: poolToken0 },
      { address: event.params.token1, tokenInstance: poolToken1 },
    ];

    // Iterating over each token
    for (let poolTokenAddressMapping of poolTokenAddressMappings) {
      if (poolTokenAddressMapping.tokenInstance == undefined) {
        // If token entity is undefined, then make the async calls and create token entity
        const {
          name: tokenName,
          decimals: tokenDecimals,
          symbol: tokenSymbol,
        } = await getErc20TokenDetails(
          poolTokenAddressMapping.address,
          event.chainId
        );

        // Create new instances of Token to be updated in the DB
        const tokenInstance: Token = {
          id: poolTokenAddressMapping.address + "-" + event.chainId.toString(),
          symbol: tokenSymbol,
          name: tokenName,
          decimals: BigInt(tokenDecimals),
          chainID: BigInt(event.chainId),
          pricePerUSDNew: 0n,
          lastUpdatedTimestamp: new Date(event.block.timestamp * 1000),
        };

        // Update the Token in the DB
        context.Token.set(tokenInstance);

        // Push the token symbol to the poolTokenSymbols array
        poolTokenSymbols.push(tokenSymbol);
      } else {
        // If token entity exists, then push the token symbol to the poolTokenSymbols array
        poolTokenSymbols.push(poolTokenAddressMapping.tokenInstance.symbol);
      }
    }

    // Create a new instance of LiquidityPoolEntity to be updated in the DB
    const pool: LiquidityPoolNew = {
      id: event.params.pool.toString(),
      chainID: BigInt(event.chainId),
      name: generatePoolName(
        poolTokenSymbols[0],
        poolTokenSymbols[1],
        event.params.stable
      ),
      token0_id: event.params.token0 + "-" + event.chainId.toString(),
      token1_id: event.params.token1 + "-" + event.chainId.toString(),
      isStable: event.params.stable,
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
    };

    // Create the LiquidityPoolEntity in the DB
    context.LiquidityPoolNew.set(pool);
  },
});

PoolFactory.SetCustomFee.handler(async ({ event, context }) => {
  const entity: PoolFactory_SetCustomFee = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    pool: event.params.pool,
    fee: event.params.fee,
    timestamp: new Date(event.block.timestamp * 1000), // Convert to Date
    chainId: event.chainId,
  };

  context.PoolFactory_SetCustomFee.set(entity);
});