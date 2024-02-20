import {
  PoolContract_Fees_loader,
  PoolContract_Fees_handler,
  PoolContract_Sync_loader,
  PoolContract_Sync_handler,
  PoolContract_Swap_loader,
  PoolContract_Swap_handler,
  PoolFactoryContract_PoolCreated_loader,
  PoolFactoryContract_PoolCreated_handlerAsync,
  VoterContract_DistributeReward_loader,
  VoterContract_DistributeReward_handler,
  VoterContract_GaugeCreated_loader,
  VoterContract_GaugeCreated_handler,
  VotingRewardContract_NotifyReward_loader,
  VotingRewardContract_NotifyReward_handler,
} from "../generated/src/Handlers.gen";

import { TokenEntity, LiquidityPoolNewEntity } from "./src/Types.gen";

import {
  // DEFAULT_STATE_STORE,
  // INITIAL_ETH_PRICE,
  STATE_STORE_ID,
  CHAIN_CONSTANTS,
  PRICING_POOLS,
  USD_TOKENS_ADDRESSES,
  TOKENS_PRICED_IN_USD_ADDRESSES,
  PRICING_POOLS_ADDRESSES,
  TEN_TO_THE_18_BI,
} from "./Constants";

import {
  normalizeTokenAmountTo1e18,
  // getLiquidityPoolAndUserMappingId,
  generatePoolName,
  trimAfterDashAndLowercase,
  absBigInt,
} from "./Helpers";

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

PoolFactoryContract_PoolCreated_loader(({ event, context }) => {
  // // Dynamic contract registration for Pool contracts
  // context.contractRegistration.addPool(event.params.pool);

  // load the token entities
  context.Token.poolTokensLoad([
    event.params.token0 + "-" + event.chainId.toString(),
    event.params.token1 + "-" + event.chainId.toString(),
  ]);
});

PoolFactoryContract_PoolCreated_handlerAsync(async ({ event, context }) => {
  // Retrieve the token entities - they might be undefined at this point
  let poolTokens = await context.Token.poolTokens;

  // Create an array to store the token symbols for pool naming later
  let poolTokenSymbols: string[] = [];

  // Create a mapping of poolToken to its address
  let poolTokenAddressMappings: TokenEntityMapping[] = [
    { address: event.params.token0, tokenInstance: poolTokens[0] },
    { address: event.params.token1, tokenInstance: poolTokens[1] },
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

      // Create new instances of TokenEntity to be updated in the DB
      const tokenInstance: TokenEntity = {
        id: poolTokenAddressMapping.address + "-" + event.chainId.toString(),
        symbol: tokenSymbol,
        name: tokenName,
        decimals: BigInt(tokenDecimals),
        chainID: BigInt(event.chainId),
        pricePerUSDNew: 0n,
        lastUpdatedTimestamp: BigInt(event.blockTimestamp),
      };

      // Update the TokenEntity in the DB
      context.Token.set(tokenInstance);

      // Push the token symbol to the poolTokenSymbols array
      poolTokenSymbols.push(tokenSymbol);
    } else {
      // If token entity exists, then push the token symbol to the poolTokenSymbols array
      poolTokenSymbols.push(poolTokenAddressMapping.tokenInstance.symbol);
    }
  }

  // Create a new instance of LiquidityPoolEntity to be updated in the DB
  const pool: LiquidityPoolNewEntity = {
    id: event.params.pool.toString(),
    chainID: BigInt(event.chainId),
    name: generatePoolName(
      poolTokenSymbols[0],
      poolTokenSymbols[1],
      event.params.stable
    ),
    token0: event.params.token0 + "-" + event.chainId.toString(),
    token1: event.params.token1 + "-" + event.chainId.toString(),
    isStable: event.params.stable,
    reserve0: 0n,
    reserve1: 0n,
    // totalLiquidityETH: 0n,
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
    lastUpdatedTimestamp: BigInt(event.blockTimestamp),
  };

  // Create the LiquidityPoolEntity in the DB
  context.LiquidityPoolNew.set(pool);
});

PoolContract_Fees_loader(({ event, context }) => {
  context.LiquidityPoolNew.load(event.srcAddress.toString(), {
    loaders: {
      loadToken0: true,
      loadToken1: true,
    },
  });
});

PoolContract_Fees_handler(({ event, context }) => {
  // Fetch the current liquidity pool from the loader
  let currentLiquidityPool = context.LiquidityPoolNew.get(
    event.srcAddress.toString()
  );

  // The pool entity should be created via PoolCreated event from the PoolFactory contract
  if (currentLiquidityPool) {
    // Get the tokens from the loader and update their pricing
    let token0Instance =
      context.LiquidityPoolNew.getToken0(currentLiquidityPool);

    let token1Instance =
      context.LiquidityPoolNew.getToken1(currentLiquidityPool);

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
    // Create a new instance of LiquidityPoolEntity to be updated in the DB
    const liquidityPoolInstance: LiquidityPoolNewEntity = {
      ...currentLiquidityPool,
      totalFees0: currentLiquidityPool.totalFees0 + normalizedFeeAmount0Total,
      totalFees1: currentLiquidityPool.totalFees1 + normalizedFeeAmount1Total,
      totalFeesUSD:
        currentLiquidityPool.totalFeesUSD +
        normalizedFeeAmount0TotalUsd +
        normalizedFeeAmount1TotalUsd,
      lastUpdatedTimestamp: BigInt(event.blockTimestamp),
    };
    // Update the LiquidityPoolEntity in the DB
    context.LiquidityPoolNew.set(liquidityPoolInstance);
  }
});

PoolContract_Swap_loader(({ event, context }) => {
  context.LiquidityPoolNew.load(event.srcAddress.toString(), {
    loaders: {
      loadToken0: true,
      loadToken1: true,
    },
  });
});

PoolContract_Swap_handler(({ event, context }) => {
  let liquidityPoolNew = context.LiquidityPoolNew.get(
    event.srcAddress.toString()
  );

  // Fetching the relevant liquidity pool user mapping
  // const liquidityPoolUserMapping =
  //   context.LiquidityPoolUserMapping.poolUserMapping;

  // // If the mapping doesn't exist yet, create the mapping and save in DB
  // if (!liquidityPoolUserMapping) {
  //   let newLiquidityPoolUserMapping: LiquidityPoolUserMappingEntity = {
  //     id: getLiquidityPoolAndUserMappingId(
  //       event.srcAddress.toString(),
  //       event.params.to.toString()
  //     ),
  //     liquidityPool: event.srcAddress.toString(),
  //     user: event.params.to.toString(),
  //   };

  //   context.LiquidityPoolUserMapping.set(newLiquidityPoolUserMapping);
  // }

  // Fetching the relevant user entity
  // let currentUser = context.User.user;

  // The pool entity should be created via PoolCreated event from the PoolFactory contract
  if (liquidityPoolNew) {
    // Get the tokens from the loader and update their pricing
    let token0Instance = context.LiquidityPoolNew.getToken0(liquidityPoolNew);

    let token1Instance = context.LiquidityPoolNew.getToken1(liquidityPoolNew);

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

    // Work out relative token pricing base on swaps above.
    const liquidityPoolInstanceNew: LiquidityPoolNewEntity = {
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
      lastUpdatedTimestamp: BigInt(event.blockTimestamp),
    };

    context.LiquidityPoolNew.set(liquidityPoolInstanceNew);

    // Get the user id from the loader or initialize it from the event if user doesn't exist
    // let existingUserId = currentUser
    //   ? currentUser.id
    //   : event.params.to.toString();
    // let existingUserVolume = currentUser ? currentUser.totalSwapVolumeUSD : 0n;
    // let existingUserNumberOfSwaps = currentUser
    //   ? currentUser.numberOfSwaps
    //   : 0n;

    // // Create a new instance of UserEntity to be updated in the DB
    // const userInstance: UserEntity = {
    //   id: existingUserId,
    //   totalSwapVolumeUSD:
    //     existingUserVolume +
    //     normalizedAmount0TotalUsd +
    //     normalizedAmount1TotalUsd,
    //   numberOfSwaps: existingUserNumberOfSwaps + 1n,
    //   lastUpdatedTimestamp: BigInt(event.blockTimestamp),
    // };

    // Update the UserEntity in the DB
    // context.User.set(userInstance);
  }
});

PoolContract_Sync_loader(({ event, context }) => {
  context.LiquidityPoolNew.load(event.srcAddress.toString(), {
    loaders: {
      loadToken0: true,
      loadToken1: true,
    },
  });
});

PoolContract_Sync_handler(({ event, context }) => {
  let liquidityPoolNew = context.LiquidityPoolNew.get(
    event.srcAddress.toString()
  );

  // The pool entity should be created via PoolCreated event from the PoolFactory contract
  if (liquidityPoolNew) {
    // Get the tokens from the loader and update their pricing
    let token0Instance = context.LiquidityPoolNew.getToken0(liquidityPoolNew);

    let token1Instance = context.LiquidityPoolNew.getToken1(liquidityPoolNew);

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

    ////////////////////////// New code for pricing liquidity pools.

    let token0Address = token0Instance.id.split("-")[0];
    let token1Address = token1Instance.id.split("-")[0];

    // if (PRICING_POOLS_ADDRESSES.includes(event.srcAddress.toString())) {
    //   // push pool address to whitelistedPoolIds
    //   // let latestPrice = context.LatestPrice.get(event.srcAddress.toString());
    //   let priceInUSD;
    //   // Note pools need to be volatile for this to work!!
    //   if (USD_TOKENS_ADDRESSES.includes(token1Address)) {
    //     priceInUSD = token0Price;
    //   } else {
    //     priceInUSD = token1Price;
    //   }

    //   const newLatestPriceInstance: LatestPriceEntity = {
    //     id: event.srcAddress.toString(),
    //     price: priceInUSD,
    //   };
    //   context.LatestPrice.set(newLatestPriceInstance);
    // }
    let token0PricePerUSDNew = 0n;
    let token1PricePerUSDNew = 0n;

    // caution, every pool can adjust prices here. Sync catiously, review!
    // Check at least x amount of stable coin reserves exist before pricing.
    // Review stability of pricing alogrithm here.
    // Assuming stability of these stable coins.
    // Don't use sync to set prices unless a critical amount of normalised reserves exist.

    // We could add some logic that if the change is more than 20% in a single shot, its likely
    // a thinly traded liquidity pool and we shouldn't use it for pricing? Price of token for normal
    // coins should never drop that much that quick. Even 50%.
    if (
      USD_TOKENS_ADDRESSES.includes(token0Address) &&
      normalizedReserve0 > BigInt(5 * 10 ** 22) // require $50k USD before using pricing.
    ) {
      token0PricePerUSDNew = TEN_TO_THE_18_BI;
      token1PricePerUSDNew = token1Price;
    } else if (
      USD_TOKENS_ADDRESSES.includes(token1Address) &&
      normalizedReserve1 > BigInt(5 * 10 ** 22)
    ) {
      token0PricePerUSDNew = token0Price;
      token1PricePerUSDNew = TEN_TO_THE_18_BI;
    } else if (
      // We potentially don't even need this to be a whitelist ...
      // So as long as the token had suffcient liquidity against a USD pair, its fairly priced.
      // and could be used here.
      TOKENS_PRICED_IN_USD_ADDRESSES.includes(token0Address) &&
      multiplyBase1e18(normalizedReserve0, token0PricePerUSDNew) >
        BigInt(10 * 10 ** 22)
    ) {
      // Other token can be accurately priced
      token1PricePerUSDNew = multiplyBase1e18(
        token0PricePerUSDNew,
        token1Price
      );
      token0PricePerUSDNew = token0Instance.pricePerUSDNew;
    } else if (
      TOKENS_PRICED_IN_USD_ADDRESSES.includes(token1Address) &&
      multiplyBase1e18(normalizedReserve1, token1PricePerUSDNew) >
        BigInt(10 * 10 ** 22)
    ) {
      // Other token can be accurately priced
      token0PricePerUSDNew = multiplyBase1e18(
        token1PricePerUSDNew,
        token0Price
      );
      token1PricePerUSDNew = token1Instance.pricePerUSDNew;
    } else if (
      multiplyBase1e18(normalizedReserve0, token0PricePerUSDNew) >
      BigInt(20 * 10 ** 22) // if more than 200k liquidity for random token, then we can use the price.
    ) {
      // Other token can be accurately priced
      token1PricePerUSDNew = multiplyBase1e18(
        token0PricePerUSDNew,
        token1Price
      );
      token0PricePerUSDNew = token0Instance.pricePerUSDNew;
    } else if (
      multiplyBase1e18(normalizedReserve1, token1PricePerUSDNew) >
      BigInt(20 * 10 ** 22)
    ) {
      // Other token can be accurately priced
      token0PricePerUSDNew = multiplyBase1e18(
        token1PricePerUSDNew,
        token0Price
      );
      token1PricePerUSDNew = token1Instance.pricePerUSDNew;
    } else {
      // critical, if one of the cases aren't matched, it should keep
      // what price it already has for that token and not update it.
      token0PricePerUSDNew = token0Instance.pricePerUSDNew;
      token1PricePerUSDNew = token1Instance.pricePerUSDNew;
    }
    // Think about case where a token was priced because it had suffcient liquidity,
    // but its price stays constant as it never achieves suffcient liquidity again to
    // update the price. Ideally we'd want to zero price this token again at somepoint.

    let totalLiquidityUSD = 0n;
    // Only non-zero this figure if we don't have a price for both tokens(?)
    totalLiquidityUSD =
      multiplyBase1e18(normalizedReserve0, token0PricePerUSDNew) +
      multiplyBase1e18(normalizedReserve1, token1PricePerUSDNew);

    // Create a new instance of LiquidityPoolEntity to be updated in the DB
    const liquidityPoolInstanceNew: LiquidityPoolNewEntity = {
      ...liquidityPoolNew,
      reserve0: normalizedReserve0,
      reserve1: normalizedReserve1,
      totalLiquidityUSD: totalLiquidityUSD,
      token0Price: token0Price,
      token1Price: token1Price,
      lastUpdatedTimestamp: BigInt(event.blockTimestamp),
    };

    // Create a new instance of TokenEntity to be updated in the DB
    const newToken0Instance: TokenEntity = {
      ...token0Instance,
      chainID: BigInt(event.chainId),
      pricePerUSDNew: token0PricePerUSDNew,
      lastUpdatedTimestamp: BigInt(event.blockTimestamp),
    };
    const newToken1Instance: TokenEntity = {
      ...token1Instance,
      chainID: BigInt(event.chainId),
      pricePerUSDNew: token1PricePerUSDNew,
      lastUpdatedTimestamp: BigInt(event.blockTimestamp),
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
    context.LiquidityPoolDailySnapshot.set(liquidityPoolDailySnapshotInstance);
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

      // Update TokenEntity in the DB
      context.Token.set(tokenInstance);
      // Update the TokenDailySnapshotEntity in the DB
      context.TokenHourlySnapshot.set(tokenHourlySnapshotInstance);
      // Update the TokenDailySnapshotEntity in the DB
      context.TokenDailySnapshot.set(tokenDailySnapshotInstance);
      // Update the TokenWeeklySnapshotEntity in the DB
      context.TokenWeeklySnapshot.set(tokenWeeklySnapshotInstance);
    }
  }
});

VoterContract_GaugeCreated_loader(({ event, context }) => {
  // // Dynamically register bribe VotingReward contracts
  // // This means that user does not need to manually define all the BribeVotingReward contract address in the configuration file
  // context.contractRegistration.addVotingReward(event.params.bribeVotingReward);
});

VoterContract_GaugeCreated_handler(({ event, context }) => {
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

VoterContract_DistributeReward_loader(({ event, context }) => {
  // retrieve the pool address from the gauge address
  let poolAddress = getPoolAddressByGaugeAddress(
    event.chainId,
    event.params.gauge
  );

  // If there is a pool address with the particular gauge address, load the pool
  if (poolAddress) {
    // Load the LiquidityPool entity to be updated,
    context.LiquidityPoolNew.emissionSinglePoolLoad(poolAddress, {});

    // Load the reward token (VELO for Optimism and AERO for Base) for conversion of emissions amount into USD
    context.Token.emissionRewardTokenLoad(
      CHAIN_CONSTANTS[event.chainId].rewardToken.address +
        "-" +
        event.chainId.toString()
    );
  } else {
    // If there is no pool address with the particular gauge address, log the error
    context.log.warn(
      `No pool address found for the gauge address ${event.params.gauge.toString()}`
    );
  }
});

VoterContract_DistributeReward_handler(({ event, context }) => {
  // Fetch reward token (VELO for Optimism and AERO for Base) entity
  let rewardToken = context.Token.emissionRewardToken;
  // Fetch the Gauge entity that was loaded
  let currentLiquidityPool = context.LiquidityPoolNew.emissionSinglePool;

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
    // Create a new instance of GaugeEntity to be updated in the DB
    let newLiquidityPoolInstance: LiquidityPoolNewEntity = {
      ...currentLiquidityPool,
      totalEmissions:
        currentLiquidityPool.totalEmissions + normalizedEmissionsAmount,
      totalEmissionsUSD:
        currentLiquidityPool.totalEmissionsUSD + normalizedEmissionsAmountUsd,
      lastUpdatedTimestamp: BigInt(event.blockTimestamp),
    };

    // Update the LiquidityPoolEntity in the DB
    context.LiquidityPoolNew.set(newLiquidityPoolInstance);

    // Update the RewardTokenEntity in the DB
    // context.RewardToken.set(rewardToken);
  } else {
    // If there is no pool entity with the particular gauge address, log the error
    context.log.warn(
      `No pool entity or reward token found for the gauge address ${event.params.gauge.toString()}`
    );
  }
});

VotingRewardContract_NotifyReward_loader(({ event, context }) => {
  // retrieve the pool address from the gauge address
  let poolAddress = getPoolAddressByBribeVotingRewardAddress(
    event.chainId,
    event.srcAddress
  );

  if (poolAddress) {
    // Load the LiquidityPool entity to be updated,
    context.LiquidityPoolNew.bribeSinglePoolLoad(poolAddress, {});

    // Load the reward token (VELO for Optimism and AERO for Base) for conversion of emissions amount into USD
    context.Token.bribeRewardTokenLoad(
      event.params.reward + "-" + event.chainId.toString()
    );
  } else {
    //// QUESTION - I am running into this warning quite often. What does it mean? Why would this warning happen?

    // If there is no pool address with the particular gauge address, log the error
    context.log.warn(
      `No pool address found for the bribe voting address ${event.srcAddress.toString()}`
    );
  }
});

VotingRewardContract_NotifyReward_handler(({ event, context }) => {
  // Fetch reward token (VELO for Optimism and AERO for Base) entity
  let rewardToken = context.Token.bribeRewardToken;
  // Fetch the Gauge entity that was loaded
  let currentLiquidityPool = context.LiquidityPoolNew.bribeSinglePool;

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
    // Create a new instance of GaugeEntity to be updated in the DB
    let newLiquidityPoolInstance: LiquidityPoolNewEntity = {
      ...currentLiquidityPool,
      totalBribesUSD:
        currentLiquidityPool.totalBribesUSD + normalizedBribesAmountUsd,
      lastUpdatedTimestamp: BigInt(event.blockTimestamp),
    };

    // Update the LiquidityPoolEntity in the DB
    context.LiquidityPoolNew.set(newLiquidityPoolInstance);

    // Update the RewardTokenEntity in the DB
    // context.RewardToken.set(rewardToken); // Doesn't do anything from what I can tell.
  }
});
