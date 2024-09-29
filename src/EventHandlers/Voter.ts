import {
  Voter,
  Voter_GaugeCreated,
} from "generated";

import { LiquidityPoolNew } from "./../src/Types.gen";
import { normalizeTokenAmountTo1e18 } from "./../Helpers";
import { CHAIN_CONSTANTS } from "./../Constants";
import { poolLookupStoreManager } from "./../Store";
import { multiplyBase1e18 } from "./../Maths";

const {
  getPoolAddressByGaugeAddress,
  addRewardAddressDetails,
} = poolLookupStoreManager();

Voter.GaugeCreated.contractRegister(({ event, context }) => {
  context.addVotingReward(event.params.bribeVotingReward);
  context.addGauge(event.params.gauge);
});

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
          lastUpdatedTimestamp: new Date(event.block.timestamp * 1000),
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