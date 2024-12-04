import {
  Voter,
  Voter_GaugeCreated,
  Voter_Voted,
  Voter_WhitelistToken,
  Voter_DistributeReward,
} from "generated";

import { Token } from "generated/src/Types.gen";
import { normalizeTokenAmountTo1e18 } from "../../Helpers";
import { CHAIN_CONSTANTS, toChecksumAddress, TokenIdByChain } from "../../Constants";
import { poolLookupStoreManager } from "../../Store";
import { multiplyBase1e18 } from "../../Maths";
import { updateLiquidityPoolAggregator } from "../../Aggregators/LiquidityPoolAggregator";
import { getErc20TokenDetails } from "../../Erc20";
import { getIsAlive, getTokensDeposited } from "./common";

const { getPoolAddressByGaugeAddress, addRewardAddressDetails } =
  poolLookupStoreManager();

Voter.Voted.handler(async ({ event, context }) => {
  const entity: Voter_Voted = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    sender: event.params.sender,
    pool: event.params.pool,
    tokenId: event.params.tokenId,
    weight: event.params.weight,
    totalWeight: event.params.totalWeight,
    timestamp: new Date(event.block.timestamp * 1000),
    chainId: event.chainId,
  };

  context.Voter_Voted.set(entity);
});

Voter.GaugeCreated.contractRegister(
  ({ event, context }) => {
    context.addVotingReward(event.params.bribeVotingReward);
    context.addGauge(event.params.gauge);
  },
  { preRegisterDynamicContracts: true }
);

Voter.GaugeCreated.handler(async ({ event, context }) => {
  const entity: Voter_GaugeCreated = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    poolFactory: event.params.poolFactory,
    votingRewardsFactory: event.params.votingRewardsFactory,
    gaugeFactory: event.params.gaugeFactory,
    pool: event.params.pool,
    bribeVotingReward: event.params.bribeVotingReward,
    feeVotingReward: event.params.feeVotingReward,
    gauge: event.params.gauge,
    creator: event.params.creator,
    timestamp: new Date(event.block.timestamp * 1000), // Convert to Date
    chainId: event.chainId,
  };

  context.Voter_GaugeCreated.set(entity);

  // The pool entity should be created via PoolCreated event from the PoolFactory contract
  // Store pool details in poolRewardAddressStore
  let currentPoolRewardAddressMapping = {
    poolAddress: toChecksumAddress(event.params.pool),
    gaugeAddress: toChecksumAddress(event.params.gauge),
    bribeVotingRewardAddress: toChecksumAddress(event.params.bribeVotingReward),
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

    const rewardTokenInfo = CHAIN_CONSTANTS[event.chainId].rewardToken(event.block.number);
    const rewardTokenAddress = rewardTokenInfo.address;

    const promisePool = poolAddress
      ? context.LiquidityPoolAggregator.get(poolAddress)
      : null;

    if (!poolAddress) {
      context.log.warn(
        `No pool address found for the gauge address ${event.params.gauge.toString()} on chain ${event.chainId}`
      );
    }

    const [currentLiquidityPool, rewardToken] = await Promise.all([
      promisePool,
      context.Token.get(
        TokenIdByChain(
          rewardTokenAddress,
          event.chainId
        )
      ),
    ]);

    return { currentLiquidityPool, rewardToken };
  },
  handler: async ({ event, context, loaderReturn }) => {

    if (loaderReturn && loaderReturn.rewardToken) {
      const { currentLiquidityPool, rewardToken } = loaderReturn;

      const isAlive = await getIsAlive(event.srcAddress, event.params.gauge, event.block.number, event.chainId);
      const tokensDeposited = await getTokensDeposited(rewardToken.address, event.params.gauge, event.block.number, event.chainId);

      // Dev note: Assumption here is that the GaugeCreated event has already been indexed and the Gauge entity has been created
      // Dev note: Assumption here is that the reward token (VELO for Optimism and AERO for Base) entity has already been created at this point
      if (currentLiquidityPool && rewardToken) {
        let normalizedEmissionsAmount = normalizeTokenAmountTo1e18(
          event.params.amount,
          Number(rewardToken.decimals)
        );

        let normalizedVotesDepositedAmount = normalizeTokenAmountTo1e18(
          BigInt(tokensDeposited.toString()),
          Number(rewardToken.decimals)
        );

        // If the reward token does not have a price in USD, log
        if (rewardToken.pricePerUSDNew == 0n) {
          context.log.warn(
            `Reward token with ID ${rewardToken.id.toString()} does not have a USD price yet on chain ${event.chainId}`
          );
        }

        let normalizedEmissionsAmountUsd = multiplyBase1e18(
          normalizedEmissionsAmount,
          rewardToken.pricePerUSDNew
        );

        let normalizedVotesDepositedAmountUsd = multiplyBase1e18(
          normalizedVotesDepositedAmount,
          rewardToken.pricePerUSDNew
        );

        // Create a new instance of LiquidityPoolEntity to be updated in the DB
        let lpDiff = {
          totalVotesDeposited: tokensDeposited,
          totalVotesDepositedUSD: normalizedVotesDepositedAmountUsd,
          totalEmissions:
            currentLiquidityPool.totalEmissions + normalizedEmissionsAmount,
          totalEmissionsUSD:
            currentLiquidityPool.totalEmissionsUSD +
            normalizedEmissionsAmountUsd,
          lastUpdatedTimestamp: new Date(event.block.timestamp * 1000),
          gaugeAddress: event.params.gauge,
          gaugeIsAlive: isAlive,
        };

        // Update the LiquidityPoolEntity in the DB
        updateLiquidityPoolAggregator(
          lpDiff,
          currentLiquidityPool,
          new Date(event.block.timestamp * 1000),
          context
        );
      } else {
        // If there is no pool entity with the particular gauge address, log the error
        context.log.warn(
          `No pool entity or reward token found for the gauge address ${event.params.gauge.toString()} on chain ${event.chainId}`
        );
      }

      const entity: Voter_DistributeReward = {
        id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
        sender: event.params.sender,
        gauge: event.params.gauge,
        amount: BigInt(event.params.amount),
        pool: currentLiquidityPool?.id || "",
        tokensDeposited: BigInt(tokensDeposited.toString()),
        timestamp: new Date(event.block.timestamp * 1000),
        chainId: event.chainId,
      };

      context.Voter_DistributeReward.set(entity);
    }

  },
});

/**
 * Handles the WhitelistToken event for the Voter contract.
 *
 * This handler is triggered when a WhitelistToken event is emitted by the Voter contract.
 * It creates a new Voter_WhitelistToken entity and stores it in the context.
 *
 * The Voter_WhitelistToken entity contains the following fields:
 * - id: A unique identifier for the event, composed of the chain ID, block number, and log index.
 * - whitelister: The address of the entity that performed the whitelisting.
 * - token: The address of the token being whitelisted.
 * - isWhitelisted: A boolean indicating whether the token is whitelisted.
 * - timestamp: The timestamp of the block in which the event was emitted, converted to a Date object.
 * - chainId: The ID of the blockchain network where the event occurred.
 *
 * @param {Object} event - The event object containing details of the WhitelistToken event.
 * @param {Object} context - The context object used to interact with the data store.
 */
Voter.WhitelistToken.handlerWithLoader({
  loader: async ({ event, context }) => {
    const token = await context.Token.get(
      TokenIdByChain(event.params.token, event.chainId)
    );
    return { token };
  },
  handler: async ({ event, context, loaderReturn }) => {
    const entity: Voter_WhitelistToken = {
      id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
      whitelister: event.params.whitelister,
      token: event.params.token,
      isWhitelisted: event.params._bool,
      timestamp: new Date(event.block.timestamp * 1000),
      chainId: event.chainId,
    };

    context.Voter_WhitelistToken.set(entity);

    // Update the Token entity in the DB, either by updating the existing one or creating a new one
    if (loaderReturn && loaderReturn.token) {
      const { token } = loaderReturn;
      const updatedToken: Token = {
        ...token,
        isWhitelisted: event.params._bool,
      };

      context.Token.set(updatedToken as Token);
      return;
    } else {
      try {
        const tokenDetails = await getErc20TokenDetails(
          event.params.token,
          event.chainId
        );
        const updatedToken: Token = {
          id: TokenIdByChain(event.params.token, event.chainId),
          name: tokenDetails.name,
          symbol: tokenDetails.symbol,
          pricePerUSDNew: 0n,
          address: event.params.token,
          chainId: event.chainId,
          decimals: BigInt(tokenDetails.decimals),
          isWhitelisted: event.params._bool,
          lastUpdatedTimestamp: new Date(event.block.timestamp * 1000),
        };
        context.Token.set(updatedToken);
      } catch (error) {
        context.log.error(`Error in whitelist token event fetching token details for ${event.params.token} on chain ${event.chainId}: ${error}`);
      }
    }
  },
});
