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
  CLPoolAggregator,
} from "generated";
import { set_whitelisted_prices } from "../PriceOracle";
import { normalizeTokenAmountTo1e18 } from "../Helpers";
import { multiplyBase1e18, abs } from "../Maths";
import { updateCLPoolAggregator } from "../Aggregators/CLPoolAggregator";

CLPool.Burn.handler(async ({ event, context }) => {
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
});

CLPool.Collect.handler(async ({ event, context }) => {
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
});

CLPool.CollectFees.handler(async ({ event, context }) => {
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

CLPool.Mint.handler(async ({ event, context }) => {
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

    const [token0Instance, token1Instance, clPoolAggregator] =
      await Promise.all([
        context.Token.get(pool_created[0].token0),
        context.Token.get(pool_created[0].token1),
        context.CLPoolAggregator.get(pool_id),
      ]);

    return { clPoolAggregator, token0Instance, token1Instance };
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

    if (loaderReturn && loaderReturn.clPoolAggregator) {
      const { clPoolAggregator, token0Instance, token1Instance } = loaderReturn;

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

      const clPoolAggregatorDiff: Partial<CLPoolAggregator> = {
        totalVolume0:
          clPoolAggregator.totalVolume0 + tokenUpdateData.netAmount0,
        totalVolume1:
          clPoolAggregator.totalVolume1 + tokenUpdateData.netAmount1,
        totalVolumeUSD:
          clPoolAggregator.totalVolumeUSD + tokenUpdateData.volumeInUSD,
        token0Price:
          token0Instance?.pricePerUSDNew ?? clPoolAggregator.token0Price,
        token1Price:
          token1Instance?.pricePerUSDNew ?? clPoolAggregator.token1Price,
        numberOfSwaps: clPoolAggregator.numberOfSwaps + 1n,
      };

      updateCLPoolAggregator(
        clPoolAggregatorDiff,
        clPoolAggregator,
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
