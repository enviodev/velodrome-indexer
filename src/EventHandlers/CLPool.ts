import {
  CLPool,
  CLPool_Burn,
  CLPool_Collect,
  CLPool_CollectFees,
  CLPool_Flash,
  CLPool_IncreaseObservationCardinalityNext,
  CLPool_Initialize,
  CLPool_Mint,
  CLPool_SetFeeProtocol,
  CLPool_Swap,
  LiquidityPoolAggregator,
  Token,
} from "generated";
import { set_whitelisted_prices } from "../PriceOracle";
import { normalizeTokenAmountTo1e18 } from "../Helpers";
import { multiplyBase1e18, abs } from "../Maths";
import { updateLiquidityPoolAggregator } from "../Aggregators/LiquidityPoolAggregator";

/**
 * Updates the fee amounts for a CLPoolAggregator based on event data.
 *
 * This function calculates the new total fees for both tokens in a liquidity pool
 * and their equivalent value in USD. It normalizes the token amounts to a base of 1e18
 * for consistent calculations and updates the total fees in the aggregator.
 *
 * @param clPoolAggregator - The current state of the CLPoolAggregator, containing existing fee data.
 * @param event - The event data containing the fee amounts for token0 and token1.
 * @param token0Instance - The instance of token0, containing its decimals and price per USD.
 * @param token1Instance - The instance of token1, containing its decimals and price per USD.
 *
 * @returns An object containing the updated total fees for token0, token1, and their equivalent in USD.
 *
 * The returned object has the following structure:
 * - `totalFees0`: The updated total fees for token0, normalized to 1e18.
 * - `totalFees1`: The updated total fees for token1, normalized to 1e18.
 * - `totalFeesUSD`: The updated total fees in USD, calculated using the normalized token fees and their prices.
 */
function updateCLPoolFees(
  liquidityPoolAggregator: LiquidityPoolAggregator,
  event: any,
  token0Instance: Token | undefined,
  token1Instance: Token | undefined
) {
  let tokenUpdateData = {
    totalFees0: liquidityPoolAggregator.totalFees0,
    totalFees1: liquidityPoolAggregator.totalFees1,
    totalFeesUSD: liquidityPoolAggregator.totalFeesUSD,
  };

  if (token0Instance) {
    const incomingFees0 = normalizeTokenAmountTo1e18(
      event.params.amount0,
      Number(token0Instance.decimals)
    );
    tokenUpdateData.totalFees0 += incomingFees0;
    tokenUpdateData.totalFeesUSD += multiplyBase1e18(
      incomingFees0,
      token0Instance.pricePerUSDNew
    );
  }

  if (token1Instance) {
    const incomingFees1 = normalizeTokenAmountTo1e18(
      event.params.amount1,
      Number(token1Instance.decimals)
    );
    tokenUpdateData.totalFees1 += incomingFees1;
    tokenUpdateData.totalFeesUSD += multiplyBase1e18(
      incomingFees1,
      token1Instance.pricePerUSDNew
    );
  }

  return tokenUpdateData;
}

function updateCLPoolLiquidity(
  liquidityPoolAggregator: LiquidityPoolAggregator,
  event: any,
  token0Instance: Token | undefined,
  token1Instance: Token | undefined
) {
  let tokenUpdateData = {
    totalLiquidityUSD: 0n,
    normalizedReserve0: 0n,
    normalizedReserve1: 0n,
  };

  // Update normalized reserves regardles of whether the token is priced
  tokenUpdateData.normalizedReserve0 += normalizeTokenAmountTo1e18(
    event.params.amount0,
    Number(token0Instance?.decimals || 18)
  );

  tokenUpdateData.normalizedReserve1 += normalizeTokenAmountTo1e18(
    event.params.amount1,
    Number(token1Instance?.decimals || 18)
  );

  if (token0Instance) {
    tokenUpdateData.totalLiquidityUSD += multiplyBase1e18(
      tokenUpdateData.normalizedReserve0,
      liquidityPoolAggregator.token0Price
    );
  }

  if (token1Instance) {
    tokenUpdateData.totalLiquidityUSD += multiplyBase1e18(
      tokenUpdateData.normalizedReserve1,
      liquidityPoolAggregator.token1Price
    );
  }

  return tokenUpdateData;
}

CLPool.Burn.handlerWithLoader({
  loader: async ({ event, context }) => {
    const pool_id = event.srcAddress;

    const liquidityPoolAggregator = await context.LiquidityPoolAggregator.get(pool_id);

    if (!liquidityPoolAggregator) {
      context.log.error(`CLPoolAggregator ${pool_id} not found during mint`);
      return null;
    }

    const [token0Instance, token1Instance] = await Promise.all([
      context.Token.get(liquidityPoolAggregator.token0_id),
      context.Token.get(liquidityPoolAggregator.token1_id),
    ]);

    return { liquidityPoolAggregator, token0Instance, token1Instance };
  },

  handler: async ({ event, context, loaderReturn }) => {
    const entity: CLPool_Burn = {
      id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
      owner: event.params.owner,
      tickLower: event.params.tickLower,
      tickUpper: event.params.tickUpper,
      amount: event.params.amount,
      amount0: event.params.amount0,
      amount1: event.params.amount1,
      sourceAddress: event.srcAddress,
      timestamp: new Date(event.block.timestamp * 1000),
      chainId: event.chainId,
    };

    context.CLPool_Burn.set(entity);

    if (loaderReturn) {
      const { liquidityPoolAggregator, token0Instance, token1Instance } = loaderReturn;

      const tokenUpdateData = updateCLPoolLiquidity(
        liquidityPoolAggregator,
        event,
        token0Instance,
        token1Instance
      );

      const liquidityPoolDiff = {
        reserve0:
          liquidityPoolAggregator.reserve0 + tokenUpdateData.normalizedReserve0,
        reserve1:
          liquidityPoolAggregator.reserve1 + tokenUpdateData.normalizedReserve1,
        totalLiquidityUSD:
          liquidityPoolAggregator.totalLiquidityUSD +
          tokenUpdateData.totalLiquidityUSD,
        lastUpdatedTimestamp: new Date(event.block.timestamp * 1000),
      };

      updateLiquidityPoolAggregator(
        liquidityPoolDiff,
        liquidityPoolAggregator,
        liquidityPoolDiff.lastUpdatedTimestamp,
        context
      );
    }
  },
});

CLPool.Collect.handlerWithLoader({
  loader: async ({ event, context }) => {
    const pool_id = event.srcAddress;
    const pool_created = await context.CLFactory_PoolCreated.getWhere.pool.eq(
      pool_id
    );

    if (!pool_created || pool_created.length === 0) {
      context.log.error(`Pool ${pool_id} not found during collect`);
      return null;
    }

    const [token0Instance, token1Instance, liquidityPoolAggregator] =
      await Promise.all([
        context.Token.get(pool_created[0].token0),
        context.Token.get(pool_created[0].token1),
        context.LiquidityPoolAggregator.get(pool_id),
      ]);

    return { liquidityPoolAggregator, token0Instance, token1Instance };
  },
  handler: async ({ event, context, loaderReturn }) => {
    const entity: CLPool_Collect = {
      id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
      owner: event.params.owner,
      recipient: event.params.recipient,
      tickLower: event.params.tickLower,
      tickUpper: event.params.tickUpper,
      amount0: event.params.amount0,
      amount1: event.params.amount1,
      sourceAddress: event.srcAddress,
      timestamp: new Date(event.block.timestamp * 1000),
      chainId: event.chainId,
    };

    context.CLPool_Collect.set(entity);

    if (loaderReturn && loaderReturn.liquidityPoolAggregator) {
      const { liquidityPoolAggregator, token0Instance, token1Instance } = loaderReturn;

      const tokenUpdateData = updateCLPoolFees(
        liquidityPoolAggregator,
        event,
        token0Instance,
        token1Instance
      );

      updateLiquidityPoolAggregator(
        tokenUpdateData,
        liquidityPoolAggregator,
        new Date(event.block.timestamp * 1000),
        context
      );
    }
  },
});

CLPool.CollectFees.handlerWithLoader({
  loader: async ({ event, context }) => {
    const pool_id = event.srcAddress;
    const pool_created = await context.CLFactory_PoolCreated.getWhere.pool.eq(
      pool_id
    );

    if (!pool_created || pool_created.length === 0) {
      context.log.error(`Pool ${pool_id} not found during collect`);
      return null;
    }

    const [token0Instance, token1Instance, clPoolAggregator] =
      await Promise.all([
        context.Token.get(pool_created[0].token0),
        context.Token.get(pool_created[0].token1),
        context.LiquidityPoolAggregator.get(pool_id),
      ]);

    return { clPoolAggregator, token0Instance, token1Instance };
  },
  handler: async ({ event, context, loaderReturn }) => {
    const entity: CLPool_CollectFees = {
      id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
      recipient: event.params.recipient,
      amount0: event.params.amount0,
      amount1: event.params.amount1,
      sourceAddress: event.srcAddress,
      timestamp: new Date(event.block.timestamp * 1000),
      chainId: event.chainId,
    };

    context.CLPool_CollectFees.set(entity);

    if (loaderReturn && loaderReturn.clPoolAggregator) {
      const { clPoolAggregator, token0Instance, token1Instance } = loaderReturn;

      const tokenUpdateData = updateCLPoolFees(
        clPoolAggregator,
        event,
        token0Instance,
        token1Instance
      );

      updateLiquidityPoolAggregator(
        tokenUpdateData,
        clPoolAggregator,
        new Date(event.block.timestamp * 1000),
        context
      );
    }
  },
});

CLPool.Flash.handler(async ({ event, context }) => {
  const entity: CLPool_Flash = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    sender: event.params.sender,
    recipient: event.params.recipient,
    amount0: event.params.amount0,
    amount1: event.params.amount1,
    paid0: event.params.paid0,
    paid1: event.params.paid1,
    sourceAddress: event.srcAddress,
    timestamp: new Date(event.block.timestamp * 1000),
    chainId: event.chainId,
  };

  context.CLPool_Flash.set(entity);
});

CLPool.IncreaseObservationCardinalityNext.handler(
  async ({ event, context }) => {
    const entity: CLPool_IncreaseObservationCardinalityNext = {
      id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
      observationCardinalityNextOld: event.params.observationCardinalityNextOld,
      observationCardinalityNextNew: event.params.observationCardinalityNextNew,
      sourceAddress: event.srcAddress,
      timestamp: new Date(event.block.timestamp * 1000),
      chainId: event.chainId,
    };

    context.CLPool_IncreaseObservationCardinalityNext.set(entity);
  }
);

CLPool.Initialize.handler(async ({ event, context }) => {
  const entity: CLPool_Initialize = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    sqrtPriceX96: event.params.sqrtPriceX96,
    tick: event.params.tick,
    sourceAddress: event.srcAddress,
    timestamp: new Date(event.block.timestamp * 1000),
    chainId: event.chainId,
  };

  context.CLPool_Initialize.set(entity);
});

CLPool.Mint.handlerWithLoader({
  loader: async ({ event, context }) => {
    const pool_id = event.srcAddress;

    const liquidityPoolAggregator = await context.LiquidityPoolAggregator.get(pool_id);

    if (!liquidityPoolAggregator) {
      context.log.error(`LiquidityPoolAggregator ${pool_id} not found during mint`);
      return null;
    }

    const [token0Instance, token1Instance] = await Promise.all([
      context.Token.get(liquidityPoolAggregator.token0_id),
      context.Token.get(liquidityPoolAggregator.token1_id),
    ]);

    return { liquidityPoolAggregator, token0Instance, token1Instance };
  },
  handler: async ({ event, context, loaderReturn }) => {
    const entity: CLPool_Mint = {
      id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
      sender: event.params.sender,
      transactionHash: event.transaction.hash,
      owner: event.params.owner,
      tickLower: event.params.tickLower,
      tickUpper: event.params.tickUpper,
      amount: event.params.amount,
      amount0: event.params.amount0,
      amount1: event.params.amount1,
      sourceAddress: event.srcAddress,
      timestamp: new Date(event.block.timestamp * 1000),
      chainId: event.chainId,
    };

    context.CLPool_Mint.set(entity);

    if (loaderReturn) {
      const { liquidityPoolAggregator, token0Instance, token1Instance } = loaderReturn;

      const tokenUpdateData = updateCLPoolLiquidity(
        liquidityPoolAggregator,
        event,
        token0Instance,
        token1Instance
      );

      const liquidityPoolDiff = {
        reserve0:
          liquidityPoolAggregator.reserve0 + tokenUpdateData.normalizedReserve0,
        reserve1:
          liquidityPoolAggregator.reserve1 + tokenUpdateData.normalizedReserve1,
        totalLiquidityUSD:
          liquidityPoolAggregator.totalLiquidityUSD +
          tokenUpdateData.totalLiquidityUSD,
        lastUpdatedTimestamp: new Date(event.block.timestamp * 1000),
      };

      updateLiquidityPoolAggregator(
        liquidityPoolDiff,
        liquidityPoolAggregator,
        liquidityPoolDiff.lastUpdatedTimestamp,
        context
      );
    }
  },
});

CLPool.SetFeeProtocol.handler(async ({ event, context }) => {
  const entity: CLPool_SetFeeProtocol = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    feeProtocol0Old: event.params.feeProtocol0Old,
    feeProtocol1Old: event.params.feeProtocol1Old,
    feeProtocol0New: event.params.feeProtocol0New,
    feeProtocol1New: event.params.feeProtocol1New,
    sourceAddress: event.srcAddress,
    timestamp: new Date(event.block.timestamp * 1000),
    chainId: event.chainId,
  };

  context.CLPool_SetFeeProtocol.set(entity);
});

CLPool.Swap.handlerWithLoader({
  loader: async ({ event, context }) => {
    const pool_id = event.srcAddress;
    const pool_created = await context.CLFactory_PoolCreated.getWhere.pool.eq(
      pool_id
    );

    if (!pool_created || pool_created.length === 0) {
      context.log.error(`Pool ${pool_id} not found during swap`);
      return null;
    }

    const [token0Instance, token1Instance, liquidityPoolAggregator] =
      await Promise.all([
        context.Token.get(pool_created[0].token0),
        context.Token.get(pool_created[0].token1),
        context.LiquidityPoolAggregator.get(pool_id),
      ]);

    return { liquidityPoolAggregator, token0Instance, token1Instance };
  },
  handler: async ({ event, context, loaderReturn }) => {
    const entity: CLPool_Swap = {
      id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
      sender: event.params.sender,
      recipient: event.params.recipient,
      amount0: event.params.amount0,
      amount1: event.params.amount1,
      sqrtPriceX96: event.params.sqrtPriceX96,
      liquidity: event.params.liquidity,
      tick: event.params.tick,
      sourceAddress: event.srcAddress,
      timestamp: new Date(event.block.timestamp * 1000),
      chainId: event.chainId,
    };

    context.CLPool_Swap.set(entity);

    if (loaderReturn && loaderReturn.liquidityPoolAggregator) {
      const { liquidityPoolAggregator, token0Instance, token1Instance } = loaderReturn;

      let tokenUpdateData = {
        netAmount0: 0n,
        netAmount1: 0n,
        netVolumeToken0USD: 0n,
        netVolumeToken1USD: 0n,
        volumeInUSD: 0n,
      };

      if (token0Instance) {
        tokenUpdateData.netAmount0 = normalizeTokenAmountTo1e18(
          event.params.amount0,
          Number(token0Instance.decimals)
        );
        tokenUpdateData.netAmount0 = abs(tokenUpdateData.netAmount0);
        tokenUpdateData.netVolumeToken0USD = multiplyBase1e18(
          tokenUpdateData.netAmount0,
          token0Instance.pricePerUSDNew
        );
      }

      if (token1Instance) {
        tokenUpdateData.netAmount1 = normalizeTokenAmountTo1e18(
          event.params.amount1,
          Number(token1Instance.decimals)
        );
        tokenUpdateData.netAmount1 = abs(tokenUpdateData.netAmount1);
        tokenUpdateData.netVolumeToken1USD = multiplyBase1e18(
          tokenUpdateData.netAmount1,
          token1Instance.pricePerUSDNew
        );
      }

      // Use volume from token 0 if it's priced, otherwise use token 1
      tokenUpdateData.volumeInUSD =
        tokenUpdateData.netVolumeToken0USD != 0n
          ? tokenUpdateData.netVolumeToken0USD
          : tokenUpdateData.netVolumeToken1USD;

      const liquidityPoolAggregatorDiff: Partial<LiquidityPoolAggregator> = {
        totalVolume0:
          liquidityPoolAggregator.totalVolume0 + tokenUpdateData.netAmount0,
        totalVolume1:
          liquidityPoolAggregator.totalVolume1 + tokenUpdateData.netAmount1,
        totalVolumeUSD:
          liquidityPoolAggregator.totalVolumeUSD + tokenUpdateData.volumeInUSD,
        token0Price:
          token0Instance?.pricePerUSDNew ?? liquidityPoolAggregator.token0Price,
        token1Price:
          token1Instance?.pricePerUSDNew ?? liquidityPoolAggregator.token1Price,
        numberOfSwaps: liquidityPoolAggregator.numberOfSwaps + 1n,
      };

      updateLiquidityPoolAggregator(
        liquidityPoolAggregatorDiff,
        liquidityPoolAggregator,
        new Date(event.block.timestamp * 1000),
        context
      );
    }

    const blockDatetime = new Date(event.block.timestamp * 1000);
    try {
      await set_whitelisted_prices(
        event.chainId,
        event.block.number,
        blockDatetime,
        context
      );
    } catch (error) {
      console.log("Error updating token prices on CLPool swap:", error);
    }
  },
});
