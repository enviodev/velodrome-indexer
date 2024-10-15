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
      console.error("Token instances not found.", {
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
    const [liquidityPoolNew, toUser] = await Promise.all([
      context.LiquidityPoolNew.get(event.srcAddress),
      context.User.get(event.params.to),
    ]);

    if (liquidityPoolNew == undefined) return null;

    const [token0Instance, token1Instance, isLiquidityPool] = await Promise.all(
      [
        context.Token.get(liquidityPoolNew.token0_id),
        context.Token.get(liquidityPoolNew.token1_id),
        context.LiquidityPoolNew.get(event.params.to),
      ]
    );

    if (token0Instance == undefined || token1Instance == undefined) {
      // Commenting out error as overwhelming console.
      // console.log("Token instances not found.", {
      //   token0_id: liquidityPoolNew.token0_id,
      //   token1_id: liquidityPoolNew.token1_id,
      //   chainId: event.chainId,
      // });
      return null;
    }

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
    // The pool entity should be created via PoolCreated event from the PoolFactory contract
    // QUESTION: Should it error if this is undefined?
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

      // Same as above.
      // Important assume if amount0In is >0 then amount0Out =0 etc
      let netAmount0 = normalizeTokenAmountTo1e18(
        event.params.amount0In + event.params.amount0Out,
        Number(token0Instance.decimals)
      );
      let netAmount1 = normalizeTokenAmountTo1e18(
        event.params.amount1In + event.params.amount1Out,
        Number(token1Instance.decimals)
      );

      let token0Price = token0Instance.pricePerUSDNew;
      let token1Price = token1Instance.pricePerUSDNew;

      // Calculate amounts in USD
      // We don't double count volume, we use USD of first token if possible to
      // Calculate volume in USD.
      let netVolumeToken0USD = multiplyBase1e18(
        netAmount0,
        token0Instance.pricePerUSDNew
      );
      let netVolumeToken1USD = multiplyBase1e18(
        netAmount1,
        token1Instance.pricePerUSDNew
      );

      // Try use volume from token 0 if its priced, otherwise use token 1.
      let volumeInUSD =
        netVolumeToken0USD != 0n ? netVolumeToken0USD : netVolumeToken1USD;

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
        totalVolume0: liquidityPoolNew.totalVolume0 + netAmount0,
        totalVolume1: liquidityPoolNew.totalVolume1 + netAmount1,
        totalVolumeUSD: liquidityPoolNew.totalVolumeUSD + volumeInUSD,
        token0Price,
        token1Price,
        numberOfSwaps: liquidityPoolNew.numberOfSwaps + 1n,
        lastUpdatedTimestamp: new Date(event.block.timestamp * 1000),
      };

      context.LiquidityPoolNew.set(liquidityPoolInstanceNew);
    }
  },
});

Pool.Sync.handler(async ({ event, context }) => {
  const liquidityPoolNew = await context.LiquidityPoolNew.get(event.srcAddress);

  if (liquidityPoolNew == undefined) return;

  const entity: Pool_Sync = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    reserve0: event.params.reserve0,
    reserve1: event.params.reserve1,
    sourceAddress: event.srcAddress,
    timestamp: new Date(event.block.timestamp * 1000), // Convert to Date
    chainId: event.chainId,
  };

  context.Pool_Sync.set(entity);

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
  const token0Instance = await context.Token.get(liquidityPoolNew.token0_id);
  const token1Instance = await context.Token.get(liquidityPoolNew.token1_id);

  if (token0Instance == undefined || token1Instance == undefined) {
    console.error(
      "Token instances not found but are required fields for LiquidityPoolEntity.",
      {
        token0_id: liquidityPoolNew.token0_id,
        token1_id: liquidityPoolNew.token1_id,
        chainId: event.chainId,
      }
    );
    return;
  }

  // Normalize reserve amounts to 1e18
  let normalizedReserve0 = normalizeTokenAmountTo1e18(
    event.params.reserve0,
    Number(token0Instance.decimals)
  );
  let normalizedReserve1 = normalizeTokenAmountTo1e18(
    event.params.reserve1,
    Number(token1Instance.decimals)
  );

  let token0PricePerUSDNew = token0Instance.pricePerUSDNew;
  let token1PricePerUSDNew = token1Instance.pricePerUSDNew;

  let totalLiquidityUSD = 0n;
  // Only non-zero this figure if we don't have a price for both tokens(?)
  totalLiquidityUSD =
    multiplyBase1e18(normalizedReserve0, token0PricePerUSDNew) +
    multiplyBase1e18(normalizedReserve1, token1PricePerUSDNew);

  // Create a new instance of LiquidityPoolEntity to be updated in the DB
  const liquidityPoolInstanceNew: LiquidityPoolNew = {
    ...liquidityPoolNew,
    reserve0: normalizedReserve0,
    reserve1: normalizedReserve1,
    totalLiquidityUSD: totalLiquidityUSD,
    token0Price: token0PricePerUSDNew,
    token1Price: token1PricePerUSDNew,
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
});
