import { Pool, Pool_Swap, Pool_Sync, Pool_Mint, Pool_Burn } from "generated";

import { LiquidityPoolAggregator, Token, User } from "./../src/Types.gen";
import { normalizeTokenAmountTo1e18 } from "./../Helpers";
import { abs, multiplyBase1e18 } from "./../Maths";
import { refreshTokenPrice } from "../PriceOracle";
import { updateLiquidityPoolAggregator } from "../Aggregators/LiquidityPoolAggregator";
import { TokenIdByChain } from "../Constants";

// Helper function to get checksum address

Pool.Mint.handler(async ({ event, context }) => {
  const entity: Pool_Mint = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    sender: event.params.sender,
    transactionHash: event.transaction.hash,
    amount0: event.params.amount0,
    amount1: event.params.amount1,
    sourceAddress: event.srcAddress,
    timestamp: new Date(event.block.timestamp * 1000),
    chainId: event.chainId,
  };

  context.Pool_Mint.set(entity);
});

Pool.Burn.handler(async ({ event, context }) => {
  const entity: Pool_Burn = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    sender: event.params.sender,
    to: event.params.to,
    amount0: event.params.amount0,
    amount1: event.params.amount1,
    sourceAddress: event.srcAddress,
    timestamp: new Date(event.block.timestamp * 1000),
    chainId: event.chainId,
  };

  context.Pool_Burn.set(entity);
});

Pool.Fees.handlerWithLoader({
  loader: async ({ event, context }) => {
    const liquidityPoolAggregator = await context.LiquidityPoolAggregator.get(
      event.srcAddress
    );

    if (!liquidityPoolAggregator) {
      context.log.error(`LiquidityPoolAggregator ${event.srcAddress} not found during collect fees on chain ${event.chainId}`);
      return null;
    }

    const [token0Instance, token1Instance] = await Promise.all([
      context.Token.get(
        TokenIdByChain(liquidityPoolAggregator.token0_address, event.chainId)
      ),
      context.Token.get(
        TokenIdByChain(liquidityPoolAggregator.token1_address, event.chainId)
      ),
    ]);

    return { liquidityPoolAggregator, token0Instance, token1Instance };
  },
  handler: async ({ event, context, loaderReturn }) => {
    if (!loaderReturn) return;

    const { liquidityPoolAggregator, token0Instance, token1Instance } = loaderReturn;

    let tokenUpdateData = {
      totalFees0: event.params.amount0,
      totalFees1: event.params.amount1,
      totalFeesNormalized0: 0n,
      totalFeesNormalized1: 0n,
      totalFeesUSD: 0n,
    };

    tokenUpdateData.totalFees0 = event.params.amount0
    if (token0Instance) {
      tokenUpdateData.totalFeesNormalized0 = normalizeTokenAmountTo1e18(
        event.params.amount0,
        Number(token0Instance.decimals)
      );
      tokenUpdateData.totalFeesUSD += multiplyBase1e18(
        tokenUpdateData.totalFeesNormalized0,
        token0Instance.pricePerUSDNew
      );
    }

    tokenUpdateData.totalFees1 = event.params.amount1
    if (token1Instance) {
      tokenUpdateData.totalFeesNormalized1 = normalizeTokenAmountTo1e18(
        event.params.amount1,
        Number(token1Instance.decimals)
      );
      tokenUpdateData.totalFeesUSD += multiplyBase1e18(
        tokenUpdateData.totalFeesNormalized1,
        token1Instance.pricePerUSDNew
      );
    }

    const liquidityPoolDiff = {
      totalFees0: liquidityPoolAggregator.totalFees0 + tokenUpdateData.totalFees0,
      totalFees1: liquidityPoolAggregator.totalFees1 + tokenUpdateData.totalFees1,
      totalFeesUSD: liquidityPoolAggregator.totalFeesUSD + tokenUpdateData.totalFeesUSD,
      lastUpdatedTimestamp: new Date(event.block.timestamp * 1000),
    };

    updateLiquidityPoolAggregator(
      liquidityPoolDiff,
      liquidityPoolAggregator,
      liquidityPoolDiff.lastUpdatedTimestamp,
      context
    );
  },
});

Pool.Swap.handlerWithLoader({
  loader: async ({ event, context }) => {
    const liquidityPoolAggregator = await context.LiquidityPoolAggregator.get(
      event.srcAddress
    );

    if (!liquidityPoolAggregator) {
      context.log.error(`LiquidityPoolAggregator ${event.srcAddress} not found during swap on chain ${event.chainId}`);
      return null;
    }

    const [token0Instance, token1Instance, user, isLiquidityPool] =
      await Promise.all([
        context.Token.get(liquidityPoolAggregator.token0_id),
        context.Token.get(liquidityPoolAggregator.token1_id),
        context.User.get(event.params.to),
        context.LiquidityPoolAggregator.get(event.params.to)
      ]);

    return {
      liquidityPoolAggregator,
      token0Instance,
      token1Instance,
      to_address: event.params.to,
      user,
    };
  },
  handler: async ({ event, context, loaderReturn }) => {
    const blockDatetime = new Date(event.block.timestamp * 1000);

    const entity: Pool_Swap = {
      id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
      sender: event.params.sender,
      to: event.params.to,
      amount0In: event.params.amount0In,
      amount1In: event.params.amount1In,
      amount0Out: event.params.amount0Out,
      amount1Out: event.params.amount1Out,
      sourceAddress: event.srcAddress, // Add sourceAddress
      timestamp: blockDatetime, // Convert to Date
      chainId: event.chainId,
    };

    context.Pool_Swap.set(entity);
    if (loaderReturn) {
      const { liquidityPoolAggregator, token0Instance, token1Instance, to_address, user } =
        loaderReturn;

      let token0 = token0Instance;
      let token1 = token1Instance;

      let tokenUpdateData = {
        netAmount0: 0n,
        netAmount1: 0n,
        netVolumeToken0USD: 0n,
        netVolumeToken1USD: 0n,
        volumeInUSD: 0n,
      };

      tokenUpdateData.netAmount0 = event.params.amount0In + event.params.amount0Out;
      if (token0) {
        try {
          token0 = await refreshTokenPrice(token0, event.block.number, event.block.timestamp, event.chainId, context);
        } catch (error) {
          context.log.error(`Error refreshing token price for ${token0?.address} on chain ${event.chainId}: ${error}`);
        }
        const normalizedAmount0 = normalizeTokenAmountTo1e18(
          event.params.amount0In + event.params.amount0Out,
          Number(token0.decimals)
        );
        tokenUpdateData.netVolumeToken0USD = multiplyBase1e18(
          normalizedAmount0,
          token0.pricePerUSDNew
        );
      }

      tokenUpdateData.netAmount1 = event.params.amount1In + event.params.amount1Out;
      if (token1) {
        try {
          token1 = await refreshTokenPrice(token1, event.block.number, event.block.timestamp, event.chainId, context);
        } catch (error) {
          context.log.error(`Error refreshing token price for ${token1?.address} on chain ${event.chainId}: ${error}`);
        }
        const normalizedAmount1 = normalizeTokenAmountTo1e18(
          event.params.amount1In + event.params.amount1Out,
          Number(token1.decimals)
        );
        tokenUpdateData.netVolumeToken1USD = multiplyBase1e18(
          normalizedAmount1,
          token1.pricePerUSDNew
        );
      }

      // Use volume from token 0 if it's priced, otherwise use token 1
      tokenUpdateData.volumeInUSD =
        tokenUpdateData.netVolumeToken0USD != 0n
          ? tokenUpdateData.netVolumeToken0USD
          : tokenUpdateData.netVolumeToken1USD;


      const liquidityPoolDiff = {
        totalVolume0: liquidityPoolAggregator.totalVolume0 + tokenUpdateData.netAmount0,
        totalVolume1: liquidityPoolAggregator.totalVolume1 + tokenUpdateData.netAmount1,
        totalVolumeUSD:
          liquidityPoolAggregator.totalVolumeUSD + tokenUpdateData.volumeInUSD,
        token0Price:
          token0Instance?.pricePerUSDNew ?? liquidityPoolAggregator.token0Price,
        token1Price:
          token1Instance?.pricePerUSDNew ?? liquidityPoolAggregator.token1Price,
        numberOfSwaps: liquidityPoolAggregator.numberOfSwaps + 1n,
        lastUpdatedTimestamp: new Date(event.block.timestamp * 1000),
      };

      updateLiquidityPoolAggregator(
        liquidityPoolDiff,
        liquidityPoolAggregator,
        liquidityPoolDiff.lastUpdatedTimestamp,
        context
      );


      // Update user and  create if they don't exist
      if (!user) {
        let newUser: User = {
          id: to_address,
          numberOfSwaps: 1n,
          joined_at_timestamp: blockDatetime,
        };
        context.User.set(newUser);
      } else {
        let existingUser: User = {
          ...user,
          numberOfSwaps: user.numberOfSwaps + 1n,
          joined_at_timestamp:
            user.joined_at_timestamp <
            blockDatetime
              ? user.joined_at_timestamp
              : blockDatetime,
        }; // for unordered head mode this correctly categorizes base users who may have joined early on optimism.
        try {
          context.User.set(existingUser);
        } catch (error) {
          console.log("Error updating user:", error);
        }
      }
    }
  },
});

/**
 * Sync event handler.
 * @notice This event is triggered by Uniswap V2 factory when a new LP position is created, and updates the reserves for the pool.
 */
Pool.Sync.handlerWithLoader({
  loader: async ({ event, context }) => {
    const liquidityPoolAggregator = await context.LiquidityPoolAggregator.get(
      event.srcAddress
    );

    if (!liquidityPoolAggregator) {
      context.log.error(`LiquidityPoolAggregator ${event.srcAddress} not found during sync on chain ${event.chainId}`);
      return null;
    }

    const [token0Instance, token1Instance] = await Promise.all([
      context.Token.get(liquidityPoolAggregator.token0_id),
      context.Token.get(liquidityPoolAggregator.token1_id),
    ]);

    return { liquidityPoolAggregator, token0Instance, token1Instance };
  },
  handler: async ({ event, context, loaderReturn }) => {
    if (!loaderReturn) return;
    const blockDatetime = new Date(event.block.timestamp * 1000);

    const { liquidityPoolAggregator, token0Instance, token1Instance } = loaderReturn;

    const entity: Pool_Sync = {
      id: `${event.chainId}_${liquidityPoolAggregator.id}_${event.block.number}_${event.logIndex}`,
      reserve0: event.params.reserve0,
      reserve1: event.params.reserve1,
      sourceAddress: event.srcAddress,
      timestamp: blockDatetime,
      chainId: event.chainId,
    };

    context.Pool_Sync.set(entity);

    let tokenUpdateData = {
      totalLiquidityUSD: 0n,
      normalizedReserve0: 0n,
      normalizedReserve1: 0n,
      token0PricePerUSDNew: token0Instance?.pricePerUSDNew ?? liquidityPoolAggregator.token0Price,
      token1PricePerUSDNew: token1Instance?.pricePerUSDNew ?? liquidityPoolAggregator.token1Price,
    };


    // Update price and liquidity if the token is priced
    if (token0Instance) {
      tokenUpdateData.normalizedReserve0 += normalizeTokenAmountTo1e18(
        event.params.reserve0,
        Number(token0Instance.decimals)
      );
      tokenUpdateData.token0PricePerUSDNew = token0Instance.pricePerUSDNew;
      tokenUpdateData.totalLiquidityUSD += multiplyBase1e18(
        tokenUpdateData.normalizedReserve0,
        tokenUpdateData.token0PricePerUSDNew
      );
    }

    if (token1Instance) {
      tokenUpdateData.normalizedReserve1 += normalizeTokenAmountTo1e18(
        event.params.reserve1,
        Number(token1Instance.decimals)
      );

      tokenUpdateData.token1PricePerUSDNew = token1Instance.pricePerUSDNew;
      tokenUpdateData.totalLiquidityUSD += multiplyBase1e18(
        tokenUpdateData.normalizedReserve1,
        tokenUpdateData.token1PricePerUSDNew
      );
    }

    const liquidityPoolDiff = {
      reserve0: event.params.reserve0,
      reserve1: event.params.reserve1,
      totalLiquidityUSD: tokenUpdateData.totalLiquidityUSD || liquidityPoolAggregator.totalLiquidityUSD,
      token0Price: tokenUpdateData.token0PricePerUSDNew,
      token1Price: tokenUpdateData.token1PricePerUSDNew,
      lastUpdatedTimestamp: blockDatetime,
    };

    updateLiquidityPoolAggregator(
      liquidityPoolDiff,
      liquidityPoolAggregator,
      liquidityPoolDiff.lastUpdatedTimestamp,
      context
    );
  },
});
