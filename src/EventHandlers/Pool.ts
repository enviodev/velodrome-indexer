import { Pool, Pool_Swap, Pool_Sync, Pool_Mint, Pool_Burn } from "generated";

import { Token, LiquidityPoolNew, User } from "./../src/Types.gen";
import { normalizeTokenAmountTo1e18 } from "./../Helpers";
import { multiplyBase1e18 } from "./../Maths";
import { getLiquidityPoolSnapshotByInterval } from "./../IntervalSnapshots";
import { SnapshotInterval } from "./../CustomTypes";
import { toChecksumAddress, TokenIdByChain } from "../Constants";
import { set_whitelisted_prices } from "../PriceOracle";

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
    const currentLiquidityPool = await context.LiquidityPoolNew.get(
      event.srcAddress
    );

    if (currentLiquidityPool == undefined) return null;

    const [token0Instance, token1Instance] = await Promise.all([
      context.Token.get(currentLiquidityPool.token0_id),
      context.Token.get(currentLiquidityPool.token1_id),
    ]);

    return { currentLiquidityPool, token0Instance, token1Instance };
  },
  handler: async ({ event, context, loaderReturn }) => {
    if (!loaderReturn) return;

    const { currentLiquidityPool, token0Instance, token1Instance } =
      loaderReturn;

    if (token0Instance == undefined || token1Instance == undefined) {
      console.log("Token instances not found.", {
        token0_id: currentLiquidityPool.token0_id,
        token1_id: currentLiquidityPool.token1_id,
        chainId: event.chainId,
      });
      return;
    }

    // Normalize swap amounts to 1e18
    let normalizedFeeAmount0Total = normalizeTokenAmountTo1e18(
      event.params.amount0,
      Number(token0Instance.decimals)
    );
    let normalizedFeeAmount1Total = normalizeTokenAmountTo1e18(
      event.params.amount1,
      Number(token1Instance.decimals)
    );

    // Calculate amounts in USD
    let normalizedFeeAmount0TotalUsd = multiplyBase1e18(
      normalizedFeeAmount0Total,
      token0Instance.pricePerUSDNew
    );
    let normalizedFeeAmount1TotalUsd = multiplyBase1e18(
      normalizedFeeAmount1Total,
      token1Instance.pricePerUSDNew
    );
    // Create a new instance of LiquidityPool to be updated in the DB
    const liquidityPoolInstance: LiquidityPoolNew = {
      ...currentLiquidityPool,
      totalFees0: currentLiquidityPool.totalFees0 + normalizedFeeAmount0Total,
      totalFees1: currentLiquidityPool.totalFees1 + normalizedFeeAmount1Total,
      totalFeesUSD:
        currentLiquidityPool.totalFeesUSD +
        normalizedFeeAmount0TotalUsd +
        normalizedFeeAmount1TotalUsd,
      lastUpdatedTimestamp: new Date(event.block.timestamp * 1000),
    };
    // Update the LiquidityPoolEntity in the DB
    context.LiquidityPoolNew.set(liquidityPoolInstance);
  },
});

Pool.Swap.handlerWithLoader({
  loader: async ({ event, context }) => {
    const liquidityPoolNew = await context.LiquidityPoolNew.get(event.srcAddress);

    if (liquidityPoolNew == undefined) return null;

    const [token0Instance, token1Instance, toUser, isLiquidityPool] = await Promise.all([
      context.Token.get(liquidityPoolNew.token0_id),
      context.Token.get(liquidityPoolNew.token1_id),
      context.User.get(event.params.to),
      context.LiquidityPoolNew.get(event.params.to),
    ]);

    return {
      liquidityPoolNew,
      token0Instance,
      token1Instance,
      to_address: event.params.to,
      toUser,
      isLiquidityPool: isLiquidityPool != undefined,
    };
  },
  handler: async ({ event, context, loaderReturn }) => {
    const entity: Pool_Swap = {
      id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
      sender: event.params.sender,
      to: event.params.to,
      amount0In: event.params.amount0In,
      amount1In: event.params.amount1In,
      amount0Out: event.params.amount0Out,
      amount1Out: event.params.amount1Out,
      sourceAddress: event.srcAddress, // Add sourceAddress
      timestamp: new Date(event.block.timestamp * 1000), // Convert to Date
      chainId: event.chainId,
    };

    context.Pool_Swap.set(entity);
    if (loaderReturn) {
      const { liquidityPoolNew, token0Instance, token1Instance, to_address } =
        loaderReturn;

      let tokenUpdateData = {
        netAmount0: 0n,
        netAmount1: 0n,
        netVolumeToken0USD: 0n,
        netVolumeToken1USD: 0n,
        volumeInUSD: 0n,
      };

      if (token0Instance) {
        tokenUpdateData.netAmount0 = normalizeTokenAmountTo1e18(
          event.params.amount0In + event.params.amount0Out,
          Number(token0Instance.decimals)
        );
        tokenUpdateData.netVolumeToken0USD = multiplyBase1e18(
          tokenUpdateData.netAmount0,
          token0Instance.pricePerUSDNew
        );
      }

      if (token1Instance) {
        tokenUpdateData.netAmount1 = normalizeTokenAmountTo1e18(
          event.params.amount1In + event.params.amount1Out,
          Number(token1Instance.decimals)
        );
        tokenUpdateData.netVolumeToken1USD = multiplyBase1e18(
          tokenUpdateData.netAmount1,
          token1Instance.pricePerUSDNew
        );
      }

      // Use volume from token 0 if it's priced, otherwise use token 1
      tokenUpdateData.volumeInUSD = tokenUpdateData.netVolumeToken0USD != 0n
        ? tokenUpdateData.netVolumeToken0USD
        : tokenUpdateData.netVolumeToken1USD;

      // add a new user if `to` isn't a liquidity pool and doesn't already exist
      // as a user
      if (!(await context.LiquidityPoolNew.get(to_address))) {
        let currentUser = await context.User.get(to_address);
        if (!currentUser) {
          let newUser: User = {
            id: to_address,
            numberOfSwaps: 1n,
            joined_at_timestamp: new Date(event.block.timestamp * 1000),
          };
          context.User.set(newUser);
        } else {
          let existingUser: User = {
            ...currentUser,
            numberOfSwaps: currentUser.numberOfSwaps + 1n,
            joined_at_timestamp:
              currentUser.joined_at_timestamp <
              new Date(event.block.timestamp * 1000)
                ? currentUser.joined_at_timestamp
                : new Date(event.block.timestamp * 1000),
          }; // for unordered head mode this correctly categorizes base users who may have joined early on optimism.
          context.User.set(existingUser);
        }
      }

      // Work out relative token pricing base on swaps above.
      const liquidityPoolInstanceNew: LiquidityPoolNew = {
        ...liquidityPoolNew,
        totalVolume0: liquidityPoolNew.totalVolume0 + tokenUpdateData.netAmount0,
        totalVolume1: liquidityPoolNew.totalVolume1 + tokenUpdateData.netAmount1,
        totalVolumeUSD: liquidityPoolNew.totalVolumeUSD + tokenUpdateData.volumeInUSD,
        token0Price: token0Instance?.pricePerUSDNew ?? liquidityPoolNew.token0Price,
        token1Price: token1Instance?.pricePerUSDNew ?? liquidityPoolNew.token1Price,
        numberOfSwaps: liquidityPoolNew.numberOfSwaps + 1n,
        lastUpdatedTimestamp: new Date(event.block.timestamp * 1000),
      };

      context.LiquidityPoolNew.set(liquidityPoolInstanceNew);
      const blockDatetime = new Date(event.block.timestamp * 1000);
      try {
        await set_whitelisted_prices(
          event.chainId,
          event.block.number,
          blockDatetime,
          context
        );
      } catch (error) {
        console.log("Error updating token prices on pool sync:", error);
      }

    }
  },
});

Pool.Sync.handlerWithLoader({
  loader: async ({ event, context }) => {
    const liquidityPoolNew = await context.LiquidityPoolNew.get(event.srcAddress);

    if (!liquidityPoolNew) return null;

    const [token0Instance, token1Instance] = await Promise.all([
      context.Token.get(liquidityPoolNew.token0_id),
      context.Token.get(liquidityPoolNew.token1_id),
    ]);

    return { liquidityPoolNew, token0Instance, token1Instance };
  },
  handler: async ({ event, context, loaderReturn }) => {
    if (!loaderReturn) return;

    const { liquidityPoolNew, token0Instance, token1Instance } = loaderReturn;

    const entity: Pool_Sync = {
      id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
      reserve0: event.params.reserve0,
      reserve1: event.params.reserve1,
      sourceAddress: event.srcAddress,
      timestamp: new Date(event.block.timestamp * 1000),
      chainId: event.chainId,
    };

    context.Pool_Sync.set(entity);

    let tokenUpdateData = {
      totalLiquidityUSD: 0n,
      normalizedReserve0: liquidityPoolNew.reserve0,
      normalizedReserve1: liquidityPoolNew.reserve1,
      token0PricePerUSDNew: liquidityPoolNew.token0Price,
      token1PricePerUSDNew: liquidityPoolNew.token1Price,
    };

    if (token0Instance) {
      tokenUpdateData.normalizedReserve0 = normalizeTokenAmountTo1e18(
        event.params.reserve0,
        Number(token0Instance.decimals)
      );
      tokenUpdateData.token0PricePerUSDNew = token0Instance.pricePerUSDNew;
      tokenUpdateData.totalLiquidityUSD += multiplyBase1e18(
        tokenUpdateData.normalizedReserve0, tokenUpdateData.token0PricePerUSDNew);
    }

    if (token1Instance) {
      tokenUpdateData.normalizedReserve1 = normalizeTokenAmountTo1e18(
        event.params.reserve1,
        Number(token1Instance.decimals)
      );
      tokenUpdateData.token1PricePerUSDNew = token1Instance.pricePerUSDNew;
      tokenUpdateData.totalLiquidityUSD += multiplyBase1e18(
        tokenUpdateData.normalizedReserve1, tokenUpdateData.token1PricePerUSDNew);
    }

    const liquidityPoolInstanceNew: LiquidityPoolNew = {
      ...liquidityPoolNew,
      reserve0: tokenUpdateData.normalizedReserve0,
      reserve1: tokenUpdateData.normalizedReserve1,
      totalLiquidityUSD: tokenUpdateData.totalLiquidityUSD,
      token0Price: tokenUpdateData.token0PricePerUSDNew,
      token1Price: tokenUpdateData.token1PricePerUSDNew,
      lastUpdatedTimestamp: new Date(event.block.timestamp * 1000),
    };

    const liquidityPoolHourlySnapshotInstance =
      getLiquidityPoolSnapshotByInterval(
        liquidityPoolInstanceNew,
        SnapshotInterval.Hourly
      );

    const liquidityPoolDailySnapshotInstance = getLiquidityPoolSnapshotByInterval(
      liquidityPoolInstanceNew,
      SnapshotInterval.Daily
    );

    const liquidityPoolWeeklySnapshotInstance =
      getLiquidityPoolSnapshotByInterval(
        liquidityPoolInstanceNew,
        SnapshotInterval.Weekly
      );

    context.LiquidityPoolNew.set(liquidityPoolInstanceNew);

    context.LiquidityPoolHourlySnapshot.set(liquidityPoolHourlySnapshotInstance);
    context.LiquidityPoolDailySnapshot.set(liquidityPoolDailySnapshotInstance);
    context.LiquidityPoolWeeklySnapshot.set(liquidityPoolWeeklySnapshotInstance);
  },
});
