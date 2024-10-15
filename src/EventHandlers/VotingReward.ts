import {
  VotingReward,
  VotingReward_Withdraw,
  VotingReward_Deposit,
  VotingReward_NotifyReward,
} from "generated";

import { LiquidityPoolNew } from "./../src/Types.gen";
import { normalizeTokenAmountTo1e18 } from "./../Helpers";
import { multiplyBase1e18 } from "./../Maths";
import { poolLookupStoreManager } from "./../Store";
import { TokenIdByChain } from "../Constants";

//// global state!
const { getPoolAddressByBribeVotingRewardAddress } = poolLookupStoreManager();

VotingReward.NotifyReward.handlerWithLoader({
  loader: async ({ event, context }) => {
    const poolAddress = getPoolAddressByBribeVotingRewardAddress(
      event.chainId,
      event.srcAddress
    );

    if (!poolAddress) {
      context.log.warn(
        `No pool address found for the bribe voting address ${event.srcAddress.toString()}`
      );
      return null;
    }

    const [currentLiquidityPool, rewardToken] = await Promise.all([
      context.LiquidityPoolNew.get(poolAddress),
      context.Token.get(TokenIdByChain(event.params.reward, event.chainId)),
    ]);

    return { currentLiquidityPool, rewardToken };
  },
  handler: async ({ event, context, loaderReturn }) => {
    const entity: VotingReward_NotifyReward = {
      id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
      from: event.params.from,
      reward: event.params.reward,
      epoch: event.params.epoch,
      amount: event.params.amount,
      timestamp: new Date(event.block.timestamp * 1000),
      sourceAddress: event.srcAddress,
      chainId: event.chainId,
    };

    context.VotingReward_NotifyReward.set(entity);

    if (loaderReturn) {
      const { currentLiquidityPool, rewardToken } = loaderReturn;

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
          lastUpdatedTimestamp: new Date(event.block.timestamp * 1000),
        };

        // Update the LiquidityPoolEntity in the DB
        context.LiquidityPoolNew.set(newLiquidityPoolInstance);
      }
    }
  },
});

VotingReward.Deposit.handler(async ({ event, context }) => {
  const entity: VotingReward_Deposit = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    from: event.params.from,
    tokenId: event.params.tokenId,
    amount: event.params.amount,
    timestamp: new Date(event.block.timestamp * 1000), // Convert to Date
    sourceAddress: event.srcAddress,
    chainId: event.chainId,
  };

  context.VotingReward_Deposit.set(entity);
});

VotingReward.Withdraw.handler(async ({ event, context }) => {
  const entity: VotingReward_Withdraw = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    from: event.params.from,
    tokenId: event.params.tokenId,
    amount: event.params.amount,
    timestamp: new Date(event.block.timestamp * 1000), // Convert to Date
    sourceAddress: event.srcAddress,
    chainId: event.chainId,
  };

  context.VotingReward_Withdraw.set(entity);
});
