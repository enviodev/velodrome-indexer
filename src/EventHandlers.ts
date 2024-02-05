const isRegressionValidationMode = false

import {
  PoolContract_Fees_loader,
  PoolContract_Fees_handler,
  PoolContract_Sync_loader,
  PoolContract_Sync_handler,
  PoolContract_Swap_loader,
  PoolContract_Swap_handler,
  PoolFactoryContract_PoolCreated_loader,
  PoolFactoryContract_PoolCreated_handlerAsync,
  PriceFetcherContract_PriceFetched_loader,
  PriceFetcherContract_PriceFetched_handler,
  VoterContract_DistributeReward_loader,
  VoterContract_DistributeReward_handler,
  VoterContract_GaugeCreated_loader,
  VoterContract_GaugeCreated_handler,
  VotingRewardContract_NotifyReward_loader,
  VotingRewardContract_NotifyReward_handler,
} from "../generated/src/Handlers.gen";

import {
  LatestETHPriceEntity,
  LiquidityPoolEntity,
  TokenEntity,
  UserEntity,
  LiquidityPoolUserMappingEntity,
} from "./src/Types.gen";

import {
  DEFAULT_STATE_STORE,
  INITIAL_ETH_PRICE,
  STATE_STORE_ID,
  TEN_TO_THE_18_BI,
  CHAIN_CONSTANTS,
} from "./Constants";

import {
  calculateETHPriceInUSD,
  isStablecoinPool,
  findPricePerETHOld,
  normalizeTokenAmountTo1e18,
  getLiquidityPoolAndUserMappingId,
  getPoolAddressByGaugeAddressOld,
  getPoolAddressByBribeVotingRewardAddressOld,
  generatePoolName,
  findPricePerETH,
} from "./Helpers";

import { divideBase1e18, multiplyBase1e18 } from "./Maths";

import {
  getLiquidityPoolSnapshotByInterval,
  getTokenSnapshotByInterval,
} from "./IntervalSnapshots";

import { SnapshotInterval, TokenEntityMapping } from "./CustomTypes";

import { poolLookupStoreManager, poolRewardAddressStoreOld, whitelistedPoolIdsManager, whitelistedPoolIdsOld } from "./Store";

import { getErc20TokenDetails } from "./Erc20";
import { assert } from "console";

//// global state!
const { getPoolAddressByGaugeAddress, getPoolAddressByBribeVotingRewardAddress, addRewardAddressDetails } = poolLookupStoreManager();
const { addWhitelistedPoolId, getWhitelistedPoolIds, getTokensFromWhitelistedPool } = whitelistedPoolIdsManager();

PoolFactoryContract_PoolCreated_loader(({ event, context }) => {
  // // Dynamic contract registration for Pool contracts
  // context.contractRegistration.addPool(event.params.pool);

  // load the global state store
  context.StateStore.stateStoreLoad(STATE_STORE_ID, {
    loaders: {},
  });

  // load the token entities
  context.Token.poolTokensLoad([event.params.token0, event.params.token1]);
});

PoolFactoryContract_PoolCreated_handlerAsync(async ({ event, context }) => {
  // Retrieve the global state store
  let stateStore = await context.StateStore.stateStore;

  if (!stateStore) {
    context.LatestETHPrice.set(INITIAL_ETH_PRICE);
    context.StateStore.set(DEFAULT_STATE_STORE);
  }

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
        id: poolTokenAddressMapping.address,
        symbol: tokenSymbol,
        name: tokenName,
        decimals: BigInt(tokenDecimals),
        chainID: BigInt(event.chainId),
        pricePerETH: 0n,
        pricePerUSD: 0n,
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
  const newPool: LiquidityPoolEntity = {
    id: event.params.pool.toString(),
    chainID: BigInt(event.chainId),
    name: generatePoolName(
      poolTokenSymbols[0],
      poolTokenSymbols[1],
      event.params.stable
    ),
    token0: event.params.token0,
    token1: event.params.token1,
    isStable: event.params.stable,
    reserve0: 0n,
    reserve1: 0n,
    totalLiquidityETH: 0n,
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
  context.LiquidityPool.set(newPool);

  // Push the pool that was created to the poolsWithWhitelistedTokens list if the pool contains at least one whitelisted token
  if (
    CHAIN_CONSTANTS[event.chainId].whitelistedTokenAddresses.includes(
      event.params.token0
    ) ||
    CHAIN_CONSTANTS[event.chainId].whitelistedTokenAddresses.includes(
      event.params.token1
    )
  ) {
    // push pool address to whitelistedPoolIds
    addWhitelistedPoolId(event.chainId, event.params.token0, event.params.token1, newPool.id);

    if (isRegressionValidationMode) whitelistedPoolIdsOld.push(newPool.id); /// kept to manually test there are no regressions.
  }
});

PoolContract_Fees_loader(({ event, context }) => {
  //Load the single liquidity pool from the loader to be updated
  context.LiquidityPool.load(event.srcAddress.toString(), {
    loaders: {
      loadToken0: true,
      loadToken1: true,
    },
  });
});

PoolContract_Fees_handler(({ event, context }) => {
  // Fetch the current liquidity pool from the loader
  let currentLiquidityPool = context.LiquidityPool.get(
    event.srcAddress.toString()
  );

  // The pool entity should be created via PoolCreated event from the PoolFactory contract
  if (currentLiquidityPool) {
    // Get the tokens from the loader and update their pricing
    let token0Instance = context.LiquidityPool.getToken0(currentLiquidityPool);

    let token1Instance = context.LiquidityPool.getToken1(currentLiquidityPool);

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
      token0Instance.pricePerUSD
    );
    let normalizedFeeAmount1TotalUsd = multiplyBase1e18(
      normalizedFeeAmount1Total,
      token1Instance.pricePerUSD
    );
    // Create a new instance of LiquidityPoolEntity to be updated in the DB
    const liquidityPoolInstance: LiquidityPoolEntity = {
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
    context.LiquidityPool.set(liquidityPoolInstance);
  }
});

PoolContract_Swap_loader(({ event, context }) => {
  //Load the single liquidity pool from the loader to be updated
  context.LiquidityPool.load(event.srcAddress.toString(), {
    loaders: {
      loadToken0: true,
      loadToken1: true,
    },
  });

  //Load the mapping for liquidity pool and the user
  context.LiquidityPoolUserMapping.poolUserMappingLoad(
    getLiquidityPoolAndUserMappingId(
      event.srcAddress.toString(),
      event.params.to.toString()
    ),
    {}
  );

  //Load the user entity
  context.User.userLoad(event.params.to.toString());
});

PoolContract_Swap_handler(({ event, context }) => {
  // Fetch the current liquidity pool from the loader
  let currentLiquidityPool = context.LiquidityPool.get(
    event.srcAddress.toString()
  );

  // Fetching the relevant liquidity pool user mapping
  const liquidityPoolUserMapping =
    context.LiquidityPoolUserMapping.poolUserMapping;

  // If the mapping doesn't exist yet, create the mapping and save in DB
  if (!liquidityPoolUserMapping) {
    let newLiquidityPoolUserMapping: LiquidityPoolUserMappingEntity = {
      id: getLiquidityPoolAndUserMappingId(
        event.srcAddress.toString(),
        event.params.to.toString()
      ),
      liquidityPool: event.srcAddress.toString(),
      user: event.params.sender.toString(),
    };

    context.LiquidityPoolUserMapping.set(newLiquidityPoolUserMapping);
  }

  // Fetching the relevant user entity
  let currentUser = context.User.user;

  // The pool entity should be created via PoolCreated event from the PoolFactory contract
  if (currentLiquidityPool) {
    // Get the tokens from the loader and update their pricing
    let token0Instance = context.LiquidityPool.getToken0(currentLiquidityPool);

    let token1Instance = context.LiquidityPool.getToken1(currentLiquidityPool);

    // Normalize swap amounts to 1e18
    let normalizedAmount0Total = normalizeTokenAmountTo1e18(
      event.params.amount0In + event.params.amount0Out,
      Number(token0Instance.decimals)
    );
    let normalizedAmount1Total = normalizeTokenAmountTo1e18(
      event.params.amount1In + event.params.amount1Out,
      Number(token1Instance.decimals)
    );

    // Calculate amounts in USD
    let normalizedAmount0TotalUsd = multiplyBase1e18(
      normalizedAmount0Total,
      token0Instance.pricePerUSD
    );
    let normalizedAmount1TotalUsd = multiplyBase1e18(
      normalizedAmount1Total,
      token1Instance.pricePerUSD
    );

    // Get the user id from the loader or initialize it from the event if user doesn't exist
    let existingUserId = currentUser
      ? currentUser.id
      : event.params.to.toString();
    let existingUserVolume = currentUser ? currentUser.totalSwapVolumeUSD : 0n;
    let existingUserNumberOfSwaps = currentUser
      ? currentUser.numberOfSwaps
      : 0n;

    // Create a new instance of UserEntity to be updated in the DB
    const userInstance: UserEntity = {
      id: existingUserId,
      totalSwapVolumeUSD:
        existingUserVolume +
        normalizedAmount0TotalUsd +
        normalizedAmount1TotalUsd,
      numberOfSwaps: existingUserNumberOfSwaps + 1n,
      lastUpdatedTimestamp: BigInt(event.blockTimestamp),
    };

    // Create a new instance of LiquidityPoolEntity to be updated in the DB
    const liquidityPoolInstance: LiquidityPoolEntity = {
      ...currentLiquidityPool,
      totalVolume0: currentLiquidityPool.totalVolume0 + normalizedAmount0Total,
      totalVolume1: currentLiquidityPool.totalVolume1 + normalizedAmount1Total,
      totalVolumeUSD:
        currentLiquidityPool.totalVolumeUSD +
        normalizedAmount0TotalUsd +
        normalizedAmount1TotalUsd,
      numberOfSwaps: currentLiquidityPool.numberOfSwaps + 1n,
      lastUpdatedTimestamp: BigInt(event.blockTimestamp),
    };

    // Update the LiquidityPoolEntity in the DB
    context.LiquidityPool.set(liquidityPoolInstance);

    // Update the UserEntity in the DB
    context.User.set(userInstance);
  }
});

PoolContract_Sync_loader(({ event, context }) => {
  // load the global state store
  context.StateStore.stateStoreLoad(STATE_STORE_ID, {
    loaders: { loadLatestEthPrice: true },
  });

  // Load the single liquidity pool from the loader to be updated
  context.LiquidityPool.singlePoolLoad(event.srcAddress.toString(), {
    loaders: {
      loadToken0: true,
      loadToken1: true,
    },
  });

  // Load stablecoin pools for weighted average ETH price calculation, only if pool is stablecoin pool
  const stableCoinPoolAddresses = isStablecoinPool(
    event.srcAddress.toString().toLowerCase(),
    event.chainId
  )
    ? CHAIN_CONSTANTS[event.chainId].stablecoinPoolAddresses
    : [];
  context.LiquidityPool.stablecoinPoolsLoad(stableCoinPoolAddresses, {});

  // Load all the whitelisted pools i.e. pools with at least one white listed tokens
  const maybeTokensWhitelisted = getTokensFromWhitelistedPool(event.chainId, event.srcAddress.toString());
  if (maybeTokensWhitelisted) { // only load here if tokens are in whitelisted pool.
    context.LiquidityPool.whitelistedPools0Load(getWhitelistedPoolIds(event.chainId, maybeTokensWhitelisted.token0), {});
    context.LiquidityPool.whitelistedPools1Load(getWhitelistedPoolIds(event.chainId, maybeTokensWhitelisted.token1), {});
  } else {
    context.LiquidityPool.whitelistedPools0Load([], {});
    context.LiquidityPool.whitelistedPools1Load([], {});
  }

  /// NOTE: only for regression validation. Should be removed once code is tested.
  if (isRegressionValidationMode) {
    context.LiquidityPool.whitelistedPoolsLoad(whitelistedPoolIdsOld, {});
  } else {
    context.LiquidityPool.whitelistedPoolsLoad([], {});
  }

  // Load all the whitelisted tokens to be potentially used in pricing
  context.Token.whitelistedTokensLoad(
    CHAIN_CONSTANTS[event.chainId].whitelistedTokenAddresses
  );
});

PoolContract_Sync_handler(({ event, context }) => {
  // Fetch the state store from the loader
  const { stateStore } = context.StateStore;
  if (!stateStore) {
    throw new Error(
      "Critical bug: stateStore is undefined. Make sure it is defined on pool creation."
    );
  }

  // Fetch the current liquidity pool from the loader
  let currentLiquidityPool = context.LiquidityPool.singlePool;

  // Get a list of all the whitelisted token entities
  let whitelistedTokensList = context.Token.whitelistedTokens.filter(
    (item) => !!item
  ) as TokenEntity[];

  // Get the LatestETHPrice object
  let latestEthPrice = context.StateStore.getLatestEthPrice(stateStore);

  // The pool entity should be created via PoolCreated event from the PoolFactory contract
  if (currentLiquidityPool) {
    // Get the tokens from the loader and update their pricing
    let token0Instance = context.LiquidityPool.getToken0(currentLiquidityPool);

    let token1Instance = context.LiquidityPool.getToken1(currentLiquidityPool);

    let token0Price = currentLiquidityPool.token0Price;
    let token1Price = currentLiquidityPool.token1Price;

    // Normalize reserve amounts to 1e18
    let normalizedReserve0 = normalizeTokenAmountTo1e18(
      event.params.reserve0,
      Number(token0Instance.decimals)
    );
    let normalizedReserve1 = normalizeTokenAmountTo1e18(
      event.params.reserve1,
      Number(token1Instance.decimals)
    );

    // Calculate relative token prices
    if (normalizedReserve0 != 0n && normalizedReserve1 != 0n) {
      token0Price = divideBase1e18(normalizedReserve1, normalizedReserve0);

      token1Price = divideBase1e18(normalizedReserve0, normalizedReserve1);
    }

    let relevantPoolEntitiesToken0 = context.LiquidityPool.whitelistedPools0.filter(
      (item): item is LiquidityPoolEntity => item !== undefined
    );
    let relevantPoolEntitiesToken1 = context.LiquidityPool.whitelistedPools1.filter(
      (item): item is LiquidityPoolEntity => item !== undefined
    );

    let { token0PricePerETH, token1PricePerETH } = findPricePerETH(
      currentLiquidityPool,
      context.LiquidityPool.getToken0,
      context.LiquidityPool.getToken1,
      whitelistedTokensList,
      relevantPoolEntitiesToken0,
      relevantPoolEntitiesToken1,
      event.chainId,
      token0Price,
      token1Price
    )

    if (isRegressionValidationMode) {
      // filter out the pools where the token is not present
      //// QUESTION: when is the token not present? If it isn't whitelisted? Is this just a sanity check? Should it sound an alarm is one is undefined/null
      let relevantPoolsList = context.LiquidityPool.whitelistedPools.filter(
        (item): item is LiquidityPoolEntity => item !== undefined
      );

      let token0PricePerETHOld = findPricePerETHOld(
        token0Instance.id,
        whitelistedTokensList,
        relevantPoolsList,
        event.chainId
      );

      let token1PricePerETHOld = findPricePerETHOld(
        token1Instance.id,
        whitelistedTokensList,
        relevantPoolsList,
        event.chainId
      );

      // If either token0PricePerETH or token1PricePerETH is 1e18, then the opposite token's pricePerETH is the relative price of the tokens in pool
      if (token0PricePerETHOld == TEN_TO_THE_18_BI) {
        token1PricePerETHOld = token1Price;
      }
      if (token1PricePerETHOld == TEN_TO_THE_18_BI) {
        token0PricePerETHOld = token0Price;
      }

      if (token0PricePerETHOld != token0PricePerETH) {
        throw new Error(
          `Regression: token0PricePerETHOld: ${token0PricePerETHOld} != token0PricePerETH: ${token0PricePerETH}`
        );
      }
      // else {
      //   console.log("The token0PricePerETH is the same");
      // }

      if (token1PricePerETHOld != token1PricePerETH) {
        throw new Error(
          `Regression: token1PricePerETHOld: ${token1PricePerETHOld} != token1PricePerETH: ${token1PricePerETH}`
        );
      }
      // else {
      //   console.log("The token0PricePerETH is the same");
      // }
    }

    let token0PricePerUSD, token1PricePerUSD;

    // Logic to either use relative pricing method of ETH price to price in USD or use PriceFetcher price
    if (
      event.blockNumber >=
      CHAIN_CONSTANTS[event.chainId].firstPriceFetchedBlockNumber
    ) {
      // Use price fetcher price
      token0PricePerUSD = token0Instance.pricePerUSD;
      token1PricePerUSD = token1Instance.pricePerUSD;
    } else {
      // Use relative pricing method
      token0PricePerUSD = multiplyBase1e18(
        token0PricePerETH,
        latestEthPrice.price
      );
      token1PricePerUSD = multiplyBase1e18(
        token1PricePerETH,
        latestEthPrice.price
      );
    }

    // Create a new instance of TokenEntity to be updated in the DB
    const newToken0Instance: TokenEntity = {
      ...token0Instance,
      chainID: BigInt(event.chainId),
      pricePerETH: token0PricePerETH,
      pricePerUSD: token0PricePerUSD,
      lastUpdatedTimestamp: BigInt(event.blockTimestamp),
    };
    const newToken1Instance: TokenEntity = {
      ...token1Instance,
      chainID: BigInt(event.chainId),
      pricePerETH: token1PricePerETH,
      pricePerUSD: token1PricePerUSD,
      lastUpdatedTimestamp: BigInt(event.blockTimestamp),
    };

    // Create a new instance of LiquidityPoolEntity to be updated in the DB
    const liquidityPoolInstance: LiquidityPoolEntity = {
      ...currentLiquidityPool,
      reserve0: normalizedReserve0,
      reserve1: normalizedReserve1,
      totalLiquidityETH:
        multiplyBase1e18(normalizedReserve0, newToken0Instance.pricePerETH) +
        multiplyBase1e18(normalizedReserve1, newToken1Instance.pricePerETH),
      totalLiquidityUSD:
        multiplyBase1e18(normalizedReserve0, newToken0Instance.pricePerUSD) +
        multiplyBase1e18(normalizedReserve1, newToken1Instance.pricePerUSD),
      token0Price,
      token1Price,
      lastUpdatedTimestamp: BigInt(event.blockTimestamp),
    };

    // Create a new instance of LiquidityPoolHourlySnapshotEntity to be updated in the DB
    const liquidityPoolHourlySnapshotInstance =
      getLiquidityPoolSnapshotByInterval(
        liquidityPoolInstance,
        SnapshotInterval.Hourly
      );

    // Create a new instance of LiquidityPoolDailySnapshotEntity to be updated in the DB
    const liquidityPoolDailySnapshotInstance =
      getLiquidityPoolSnapshotByInterval(
        liquidityPoolInstance,
        SnapshotInterval.Daily
      );

    // Create a new instance of LiquidityPoolWeeklySnapshotEntity to be updated in the DB
    const liquidityPoolWeeklySnapshotInstance =
      getLiquidityPoolSnapshotByInterval(
        liquidityPoolInstance,
        SnapshotInterval.Weekly
      );

    // Update the LiquidityPoolEntity in the DB
    context.LiquidityPool.set(liquidityPoolInstance);
    // Update the LiquidityPoolDailySnapshotEntity in the DB
    context.LiquidityPoolHourlySnapshot.set(
      liquidityPoolHourlySnapshotInstance
    );
    // Update the LiquidityPoolDailySnapshotEntity in the DB
    context.LiquidityPoolDailySnapshot.set(liquidityPoolDailySnapshotInstance);
    // Update the LiquidityPoolWeeklySnapshotEntity in the DB
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

    // Updating of ETH price if the pool is a stablecoin pool
    if (
      isStablecoinPool(event.srcAddress.toString().toLowerCase(), event.chainId)
    ) {
      // Filter out undefined values
      let stablecoinPoolsList = context.LiquidityPool.stablecoinPools.filter(
        (item): item is LiquidityPoolEntity => item !== undefined
      );

      // Overwrite stablecoin pool with latest data
      let poolIndex = stablecoinPoolsList.findIndex(
        (pool) => pool.id === liquidityPoolInstance.id
      );
      stablecoinPoolsList[poolIndex] = liquidityPoolInstance;

      // Calculate weighted average ETH price using stablecoin pools
      let ethPriceInUSD = calculateETHPriceInUSD(stablecoinPoolsList);

      // Creating LatestETHPriceEntity with the latest price
      let latestEthPriceInstance: LatestETHPriceEntity = {
        id: event.blockTimestamp.toString(),
        price: ethPriceInUSD,
      };

      // Creating a new instance of LatestETHPriceEntity to be updated in the DB
      context.LatestETHPrice.set(latestEthPriceInstance);

      // update latestETHPriceKey value with event.blockTimestamp.toString()
      context.StateStore.set({
        ...stateStore,
        latestEthPrice: latestEthPriceInstance.id,
      });
    }
  }
});

PriceFetcherContract_PriceFetched_loader(({ event, context }) => {
  // Load the single token from the loader to be updated
  context.Token.load(event.params.token.toString());
});

PriceFetcherContract_PriceFetched_handler(({ event, context }) => {
  // Fetch the current token from the loader
  let currentToken = context.Token.get(event.params.token.toString());

  // The token entity should be created via PoolCreated event from the PoolFactory contract
  if (currentToken) {
    // Create a new instance of TokenEntity to be updated in the DB
    const newTokenInstance: TokenEntity = {
      ...currentToken,
      pricePerUSD: event.params.price,
      lastUpdatedTimestamp: BigInt(event.blockTimestamp),
    };

    // Update the TokenEntity in the DB
    context.Token.set(newTokenInstance);
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

  if (isRegressionValidationMode) poolRewardAddressStoreOld.push(currentPoolRewardAddressMapping); /// kept to manually test there are no regressions.
  addRewardAddressDetails(event.chainId, currentPoolRewardAddressMapping);
});

VoterContract_DistributeReward_loader(({ event, context }) => {
  // retrieve the pool address from the gauge address
  let poolAddress = getPoolAddressByGaugeAddress(event.chainId, event.params.gauge);

  if (isRegressionValidationMode) {
    //// NOTE: below code should be deleted once it is manually determined that there aren't regressions.
    let poolAddressOld = getPoolAddressByGaugeAddressOld(event.params.gauge);
    if (poolAddress != poolAddressOld) console.log("poolAddress and poolAddressOld are the same:", poolAddress == poolAddressOld)
  }

  // If there is a pool address with the particular gauge address, load the pool
  if (poolAddress) {
    // Load the LiquidityPool entity to be updated,
    context.LiquidityPool.emissionSinglePoolLoad(poolAddress, {});

    // Load the reward token (VELO for Optimism and AERO for Base) for conversion of emissions amount into USD
    context.Token.emissionRewardTokenLoad(
      CHAIN_CONSTANTS[event.chainId].rewardToken.address
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
  let currentLiquidityPool = context.LiquidityPool.emissionSinglePool;

  // Dev note: Assumption here is that the GaugeCreated event has already been indexed and the Gauge entity has been created
  // Dev note: Assumption here is that the reward token (VELO for Optimism and AERO for Base) entity has already been created at this point
  if (currentLiquidityPool && rewardToken) {
    let normalizedEmissionsAmount = normalizeTokenAmountTo1e18(
      event.params.amount,
      Number(rewardToken.decimals)
    );

    let normalizedEmissionsAmountUsd = multiplyBase1e18(
      normalizedEmissionsAmount,
      rewardToken.pricePerUSD
    );
    // Create a new instance of GaugeEntity to be updated in the DB
    let newLiquidityPoolInstance: LiquidityPoolEntity = {
      ...currentLiquidityPool,
      totalEmissions:
        currentLiquidityPool.totalEmissions + normalizedEmissionsAmount,
      totalEmissionsUSD:
        currentLiquidityPool.totalEmissionsUSD + normalizedEmissionsAmountUsd,
      lastUpdatedTimestamp: BigInt(event.blockTimestamp),
    };

    // Update the LiquidityPoolEntity in the DB
    context.LiquidityPool.set(newLiquidityPoolInstance);

    // Update the RewardTokenEntity in the DB
    context.RewardToken.set(rewardToken);
  } else {
    // If there is no pool entity with the particular gauge address, log the error
    context.log.warn(
      `No pool entity or reward token found for the gauge address ${event.params.gauge.toString()}`
    );
  }
});

VotingRewardContract_NotifyReward_loader(({ event, context }) => {
  // retrieve the pool address from the gauge address
  let poolAddress = getPoolAddressByBribeVotingRewardAddress(event.chainId, event.srcAddress);

  if (isRegressionValidationMode) {
    //// NOTE: below code should be deleted once it is manually determined that there aren't regressions.
    let poolAddressOld = getPoolAddressByBribeVotingRewardAddressOld(event.srcAddress);
    if (poolAddress != poolAddressOld) console.log("poolAddress and poolAddressOld are the same:", poolAddress, poolAddressOld)
    assert(poolAddress == poolAddressOld, "poolAddress and poolAddressOld should be the same");
  }

  if (poolAddress) {
    // Load the LiquidityPool entity to be updated,
    context.LiquidityPool.bribeSinglePoolLoad(poolAddress, {});

    // Load the reward token (VELO for Optimism and AERO for Base) for conversion of emissions amount into USD
    context.Token.bribeRewardTokenLoad(event.params.reward);
  }
  else {
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
  let currentLiquidityPool = context.LiquidityPool.bribeSinglePool;

  // Dev note: Assumption here is that the GaugeCreated event has already been indexed and the Gauge entity has been created
  // Dev note: Assumption here is that the reward token (VELO for Optimism and AERO for Base) entity has already been created at this point
  if (currentLiquidityPool && rewardToken) {
    let normalizedBribesAmount = normalizeTokenAmountTo1e18(
      event.params.amount,
      Number(rewardToken.decimals)
    );

    // If the reward token does not have a price in USD, log
    if (rewardToken.pricePerUSD == 0n) {
      context.log.warn(
        `Reward token with address ${event.params.reward.toString()} does not have a USD price yet.`
      );
    }

    // Calculate the bribes amount in USD
    let normalizedBribesAmountUsd = multiplyBase1e18(
      normalizedBribesAmount,
      rewardToken.pricePerUSD
    );
    // Create a new instance of GaugeEntity to be updated in the DB
    let newLiquidityPoolInstance: LiquidityPoolEntity = {
      ...currentLiquidityPool,
      totalBribesUSD:
        currentLiquidityPool.totalBribesUSD + normalizedBribesAmountUsd,
      lastUpdatedTimestamp: BigInt(event.blockTimestamp),
    };

    // Update the LiquidityPoolEntity in the DB
    context.LiquidityPool.set(newLiquidityPoolInstance);

    // Update the RewardTokenEntity in the DB
    context.RewardToken.set(rewardToken);
  }
});
