import {
  Pool,
  PoolFactory,
  Voter,
  PriceFetcher,
  VotingReward,
} from "generated";

import { Token, LiquidityPoolNew, User } from "./src/Types.gen";

import { CHAIN_CONSTANTS } from "./Constants";

import { normalizeTokenAmountTo1e18, generatePoolName } from "./Helpers";

import { divideBase1e18, multiplyBase1e18 } from "./Maths";

import {
  getLiquidityPoolSnapshotByInterval,
  getTokenSnapshotByInterval,
} from "./IntervalSnapshots";

import { SnapshotInterval, TokenEntityMapping } from "./CustomTypes";

import { poolLookupStoreManager } from "./Store";

import { getErc20TokenDetails } from "./Erc20";

//// global state!
const {
  getPoolAddressByGaugeAddress,
  getPoolAddressByBribeVotingRewardAddress,
  addRewardAddressDetails,
} = poolLookupStoreManager();

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
          lastUpdatedTimestamp: BigInt(event.block.timestamp),
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
      lastUpdatedTimestamp: BigInt(event.block.timestamp),
    };

    // Create the LiquidityPoolEntity in the DB
    context.LiquidityPoolNew.set(pool);
  },
});

Pool.Fees.handlerWithLoader({
  loader: async ({ event, context }) => {
    const currentLiquidityPool = await context.LiquidityPoolNew.get(
      event.srcAddress.toString()
    );

    if (currentLiquidityPool == undefined) return null;

    // load the token entities
    const token0Instance = await context.Token.get(
      currentLiquidityPool.token0_id
    );
    const token1Instance = await context.Token.get(
      currentLiquidityPool.token1_id
    );

    if (token0Instance == undefined || token1Instance == undefined)
      throw new Error(
        "Token instances not found. They are required fields for LiquidityPoolEntity"
      );

    return { currentLiquidityPool, token0Instance, token1Instance };
  },
  handler: async ({ event, context, loaderReturn }) => {
    // The pool entity should be created via PoolCreated event from the PoolFactory contract
    if (loaderReturn) {
      const { currentLiquidityPool, token0Instance, token1Instance } =
        loaderReturn;

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
        lastUpdatedTimestamp: BigInt(event.block.timestamp),
      };
      // Update the LiquidityPoolEntity in the DB
      context.LiquidityPoolNew.set(liquidityPoolInstance);
    }
  },
});

Pool.Swap.handlerWithLoader({
  loader: async ({ event, context }) => {
    const liquidityPoolNew = await context.LiquidityPoolNew.get(
      event.srcAddress.toString()
    );

    if (liquidityPoolNew == undefined) return null;

    const token0Instance = await context.Token.get(liquidityPoolNew.token0_id);
    const token1Instance = await context.Token.get(liquidityPoolNew.token1_id);

    if (token0Instance == undefined || token1Instance == undefined)
      throw new Error(
        "Token instances not found. They are required fields for LiquidityPoolEntity"
      );

    // if the swap `to` is a liquidityPool, then we won't count
    // it as a unique user.
    const to_address = event.params.to.toString();
    const toUser = await context.User.get(to_address);
    const isLiquidityPool =
      (await context.LiquidityPoolNew.get(to_address)) != undefined;

    return {
      liquidityPoolNew,
      token0Instance,
      token1Instance,
      to_address,
      toUser,
      isLiquidityPool,
    };
  },
  handler: async ({ event, context, loaderReturn }) => {
    // The pool entity should be created via PoolCreated event from the PoolFactory contract
    // QUESTION: Should it error if this is undefined?
    if (loaderReturn) {
      const {
        liquidityPoolNew,
        token0Instance,
        token1Instance,
        to_address,
        toUser,
        isLiquidityPool,
      } = loaderReturn;

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

      let token0Price = 0n;
      let token1Price = 0n;
      if (netAmount0 != 0n && netAmount1 != 0n) {
        token0Price = divideBase1e18(netAmount1, netAmount0);
        token1Price = divideBase1e18(netAmount0, netAmount1);
      }

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
            joined_at_timestamp: BigInt(event.block.timestamp),
          };
          context.User.set(newUser);
        } else {
          let existingUser: User = {
            ...currentUser,
            numberOfSwaps: currentUser.numberOfSwaps + 1n,
            joined_at_timestamp:
              currentUser.joined_at_timestamp < BigInt(event.block.timestamp)
                ? currentUser.joined_at_timestamp
                : BigInt(event.block.timestamp),
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
        token0Price: liquidityPoolNew.isStable
          ? token0Price
          : liquidityPoolNew.token0Price,
        token1Price: liquidityPoolNew.isStable
          ? token1Price
          : liquidityPoolNew.token1Price,
        numberOfSwaps: liquidityPoolNew.numberOfSwaps + 1n,
        lastUpdatedTimestamp: BigInt(event.block.timestamp),
      };

      context.LiquidityPoolNew.set(liquidityPoolInstanceNew);
    }
  },
});

Pool.Sync.handlerWithLoader({
  loader: async ({ event, context }) => {
    const liquidityPoolNew = await context.LiquidityPoolNew.get(
      event.srcAddress.toString()
    );

    if (liquidityPoolNew == undefined) return null;

    const token0Instance = await context.Token.get(liquidityPoolNew.token0_id);
    const token1Instance = await context.Token.get(liquidityPoolNew.token1_id);

    if (token0Instance == undefined || token1Instance == undefined)
      throw new Error(
        "Token instances not found. They are required fields for LiquidityPoolEntity"
      );

    return { liquidityPoolNew, token0Instance, token1Instance };
  },
  handler: async ({ event, context, loaderReturn }) => {
    if (loaderReturn) {
      const { liquidityPoolNew, token0Instance, token1Instance } = loaderReturn;

      // Normalize reserve amounts to 1e18
      let normalizedReserve0 = normalizeTokenAmountTo1e18(
        event.params.reserve0,
        Number(token0Instance.decimals)
      );
      let normalizedReserve1 = normalizeTokenAmountTo1e18(
        event.params.reserve1,
        Number(token1Instance.decimals)
      );

      let token0Price = liquidityPoolNew.token0Price;
      let token1Price = liquidityPoolNew.token1Price;

      // Only if the pool is not stable does this token price hold, otherwise uses previous price
      if (
        normalizedReserve0 != 0n &&
        normalizedReserve1 != 0n &&
        !liquidityPoolNew.isStable
      ) {
        token0Price = divideBase1e18(normalizedReserve1, normalizedReserve0);
        token1Price = divideBase1e18(normalizedReserve0, normalizedReserve1);
      }

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
        token0Price: token0Price,
        token1Price: token1Price,
        lastUpdatedTimestamp: BigInt(event.block.timestamp),
      };

      // Create a new instance of Token to be updated in the DB
      const newToken0Instance: Token = {
        ...token0Instance,
        chainID: BigInt(event.chainId),
        pricePerUSDNew: token0PricePerUSDNew,
        lastUpdatedTimestamp: BigInt(event.block.timestamp),
      };
      const newToken1Instance: Token = {
        ...token1Instance,
        chainID: BigInt(event.chainId),
        pricePerUSDNew: token1PricePerUSDNew,
        lastUpdatedTimestamp: BigInt(event.block.timestamp),
      };

      const liquidityPoolHourlySnapshotInstance =
        getLiquidityPoolSnapshotByInterval(
          liquidityPoolInstanceNew,
          SnapshotInterval.Hourly
        );

      const liquidityPoolDailySnapshotInstance =
        getLiquidityPoolSnapshotByInterval(
          liquidityPoolInstanceNew,
          SnapshotInterval.Daily
        );

      const liquidityPoolWeeklySnapshotInstance =
        getLiquidityPoolSnapshotByInterval(
          liquidityPoolInstanceNew,
          SnapshotInterval.Weekly
        );

      context.LiquidityPoolNew.set(liquidityPoolInstanceNew);

      context.LiquidityPoolHourlySnapshot.set(
        liquidityPoolHourlySnapshotInstance
      );
      context.LiquidityPoolDailySnapshot.set(
        liquidityPoolDailySnapshotInstance
      );
      context.LiquidityPoolWeeklySnapshot.set(
        liquidityPoolWeeklySnapshotInstance
      );

      // Updating the Token related entities in DB for token0 and token1
      for (let tokenInstance of [newToken0Instance, newToken1Instance]) {
        // Create a new instance of LiquidityPoolHourlySnapshotEntity to be updated in the DB
        const tokenHourlySnapshotInstance = getTokenSnapshotByInterval(
          tokenInstance,
          SnapshotInterval.Hourly
        );

        // Create a new instance of LiquidityPoolDailySnapshotEntity to be updated in the DB
        const tokenDailySnapshotInstance = getTokenSnapshotByInterval(
          tokenInstance,
          SnapshotInterval.Daily
        );

        // Create a new instance of LiquidityPoolWeeklySnapshotEntity to be updated in the DB
        const tokenWeeklySnapshotInstance = getTokenSnapshotByInterval(
          tokenInstance,
          SnapshotInterval.Weekly
        );

        // Update Token in the DB
        context.Token.set(tokenInstance);
        // Update the TokenDailySnapshotEntity in the DB
        context.TokenHourlySnapshot.set(tokenHourlySnapshotInstance);
        // Update the TokenDailySnapshotEntity in the DB
        context.TokenDailySnapshot.set(tokenDailySnapshotInstance);
        // Update the TokenWeeklySnapshotEntity in the DB
        context.TokenWeeklySnapshot.set(tokenWeeklySnapshotInstance);
      }
    }
  },
});

Voter.GaugeCreated.contractRegister(({ event, context }) => {
  // // Dynamically register bribe VotingReward contracts
  // // This means that user does not need to manually define all the BribeVotingReward contract address in the configuration file
  context.addVotingReward(event.params.gauge);
});

Voter.GaugeCreated.handler(async ({ event, context }) => {
  // The pool entity should be created via PoolCreated event from the PoolFactory contract
  // Store pool details in poolRewardAddressStore
  let currentPoolRewardAddressMapping = {
    poolAddress: event.params.pool,
    gaugeAddress: event.params.gauge,
    bribeVotingRewardAddress: event.params.bribeVotingReward,
    // feeVotingRewardAddress: event.params.feeVotingReward, // currently not used
  };

  addRewardAddressDetails(event.chainId, currentPoolRewardAddressMapping);
});

Voter.DistributeReward.handlerWithLoader({
  loader: async ({ event, context }) => {
    let poolAddress = getPoolAddressByGaugeAddress(
      event.chainId,
      event.params.gauge
    );

    if (poolAddress) {
      // Load the LiquidityPool entity to be updated,
      const currentLiquidityPool = await context.LiquidityPoolNew.get(
        poolAddress
      );

      // Load the reward token (VELO for Optimism and AERO for Base) for conversion of emissions amount into USD
      const rewardToken = await context.Token.get(
        CHAIN_CONSTANTS[event.chainId].rewardToken.address +
        "-" +
        event.chainId.toString()
      );

      return { currentLiquidityPool, rewardToken };
    }

    // If there is no pool address with the particular gauge address, log the error
    context.log.warn(
      `No pool address found for the gauge address ${event.params.gauge.toString()}`
    );
    return null;
  },
  handler: async ({ event, context, loaderReturn }) => {
    if (loaderReturn) {
      const { currentLiquidityPool, rewardToken } = loaderReturn;

      // Dev note: Assumption here is that the GaugeCreated event has already been indexed and the Gauge entity has been created
      // Dev note: Assumption here is that the reward token (VELO for Optimism and AERO for Base) entity has already been created at this point
      if (currentLiquidityPool && rewardToken) {
        let normalizedEmissionsAmount = normalizeTokenAmountTo1e18(
          event.params.amount,
          Number(rewardToken.decimals)
        );

        // If the reward token does not have a price in USD, log
        if (rewardToken.pricePerUSDNew == 0n) {
          context.log.warn(
            `Reward token with ID ${rewardToken.id.toString()} does not have a USD price yet.`
          );
        }

        let normalizedEmissionsAmountUsd = multiplyBase1e18(
          normalizedEmissionsAmount,
          rewardToken.pricePerUSDNew
        );

        // Create a new instance of LiquidityPoolEntity to be updated in the DB
        let newLiquidityPoolInstance: LiquidityPoolNew = {
          ...currentLiquidityPool,
          totalEmissions:
            currentLiquidityPool.totalEmissions + normalizedEmissionsAmount,
          totalEmissionsUSD:
            currentLiquidityPool.totalEmissionsUSD +
            normalizedEmissionsAmountUsd,
          lastUpdatedTimestamp: BigInt(event.block.timestamp),
        };

        // Update the LiquidityPoolEntity in the DB
        context.LiquidityPoolNew.set(newLiquidityPoolInstance);
      } else {
        // If there is no pool entity with the particular gauge address, log the error
        context.log.warn(
          `No pool entity or reward token found for the gauge address ${event.params.gauge.toString()}`
        );
      }
    }
  },
});

VotingReward.NotifyReward.handlerWithLoader({
  loader: async ({ event, context }) => {
    let poolAddress = getPoolAddressByBribeVotingRewardAddress(
      event.chainId,
      event.srcAddress
    );

    if (poolAddress) {
      // Load the LiquidityPool entity to be updated,
      const currentLiquidityPool = await context.LiquidityPoolNew.get(
        poolAddress
      );

      // Load the reward token (VELO for Optimism and AERO for Base) for conversion of emissions amount into USD
      const rewardToken = await context.Token.get(
        event.params.reward + "-" + event.chainId.toString()
      );

      return { currentLiquidityPool, rewardToken };
    }

    // If there is no pool address with the particular bribe voting reward address, log the error
    context.log.warn(
      `No pool address found for the bribe voting address ${event.srcAddress.toString()}`
    );
    return null;
  },
  handler: async ({ event, context, loaderReturn }) => {
    if (loaderReturn) {
      const { currentLiquidityPool, rewardToken } = loaderReturn;

      // Dev note: Assumption here is that the GaugeCreated event has already been indexed and the Gauge entity has been created
      // Dev note: Assumption here is that the reward token (VELO for Optimism and AERO for Base) entity has already been created at this point
      if (currentLiquidityPool && rewardToken) {
        let normalizedBribesAmount = normalizeTokenAmountTo1e18(
          event.params.amount,
          Number(rewardToken.decimals)
        );

        // If the reward token does not have a price in USD, log
        if (rewardToken.pricePerUSDNew == 0n) {
          context.log.warn(
            `Reward token with ID ${event.params.reward.toString()} does not have a USD price yet.`
          );
        }

        // Calculate the bribes amount in USD
        let normalizedBribesAmountUsd = multiplyBase1e18(
          normalizedBribesAmount,
          rewardToken.pricePerUSDNew
        );

        // Create a new instance of LiquidityPoolEntity to be updated in the DB
        let newLiquidityPoolInstance: LiquidityPoolNew = {
          ...currentLiquidityPool,
          totalBribesUSD:
            currentLiquidityPool.totalBribesUSD + normalizedBribesAmountUsd,
          lastUpdatedTimestamp: BigInt(event.block.timestamp),
        };

        // Update the LiquidityPoolEntity in the DB
        context.LiquidityPoolNew.set(newLiquidityPoolInstance);
      }
    }
  },
});

PriceFetcher.PriceFetched.handlerWithLoader({
  loader: async ({ event, context }) => {
    // Load the single token from the loader to be updated
    const currentToken = await context.Token.get(
      event.params.token.toString() + "-" + event.chainId.toString()
    );

    return { currentToken };
  },
  handler: async ({ event, context, loaderReturn }) => {
    if (loaderReturn) {
      const { currentToken } = loaderReturn;

      // The token entity should be created via PoolCreated event from the PoolFactory contract
      if (currentToken) {
        // Create a new instance of Token to be updated in the DB
        const newTokenInstance: Token = {
          ...currentToken,
          pricePerUSDNew: event.params.price,
          lastUpdatedTimestamp: BigInt(event.block.timestamp),
        };

        // Update the Token in the DB
        context.Token.set(newTokenInstance);
      }
    }
  },
});
