import {
  Voter,
  Voter_GaugeCreated,
  Voter_Voted,
  Voter_WhitelistToken,
  Voter_DistributeReward,
} from "generated";

import { Token } from "./../src/Types.gen";
import { normalizeTokenAmountTo1e18 } from "./../Helpers";
import { CHAIN_CONSTANTS, toChecksumAddress, TokenIdByChain } from "./../Constants";
import { poolLookupStoreManager } from "./../Store";
import { multiplyBase1e18 } from "./../Maths";
import { updateLiquidityPoolAggregator } from "../Aggregators/LiquidityPoolAggregator";
import { getErc20TokenDetails } from "../Erc20";
import Web3 from "web3";
import ERC20GaugeABI from "../../abis/ERC20.json";
import VoterABI from "../../abis/VoterABI.json";

const { getPoolAddressByGaugeAddress, addRewardAddressDetails } =
  poolLookupStoreManager();

/**
 * Fetches the historical balance of reward tokens deposited in a gauge contract at a specific block.
 * 
 * @param rewardTokenAddress - The Ethereum address of the reward token contract (ERC20)
 * @param gaugeAddress - The Ethereum address of the gauge contract where tokens are deposited
 * @param blockNumber - The block number to query the balance at
 * @param eventChainId - The chain ID of the network where the contracts exist
 * @returns A promise that resolves to a BigInt representing the number of tokens deposited
 * @throws Will throw an error if the RPC call fails or if the contract interaction fails
 * @remarks Returns 0 if the balance call fails or returns undefined
 */
async function getTokensDeposited(rewardTokenAddress: string, gaugeAddress: string, blockNumber: number, eventChainId: number): Promise<BigInt> {
    const rpcURL = CHAIN_CONSTANTS[eventChainId].rpcURL;
    const web3 = new Web3(rpcURL);
    const contract = new web3.eth.Contract(ERC20GaugeABI, rewardTokenAddress);
    const tokensDeposited = await contract.methods.balanceOf(gaugeAddress).call({}, blockNumber);
    return BigInt(tokensDeposited?.toString() || '0');
}

/**
 * Checks if a gauge contract is still active by calling its isAlive() method at a specific block.
 * 
 * @param voterAddress - The Ethereum address of the voter contract
 * @param gaugeAddress - The Ethereum address of the gauge contract to check
 * @param blockNumber - The block number to query the status at
 * @param eventChainId - The chain ID of the network where the contracts exist
 * @returns A promise that resolves to a boolean indicating if the gauge is active (true) or inactive (false)
 * @throws Will throw an error if the RPC call fails or if the contract interaction fails
 */
async function getIsAlive(voterAddress: string, gaugeAddress: string, blockNumber: number, eventChainId: number): Promise<boolean> {
    const rpcURL = CHAIN_CONSTANTS[eventChainId].rpcURL;
    const web3 = new Web3(rpcURL);
    const contract = new web3.eth.Contract(VoterABI, voterAddress);
    const isAlive: boolean = await contract.methods.isAlive(gaugeAddress).call({}, blockNumber);
    return isAlive;
}

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

    let tokensDeposited: BigInt = 0n;

    const rewardTokenInfo = CHAIN_CONSTANTS[event.chainId].rewardToken(event.block.number);
    const rewardTokenAddress = rewardTokenInfo.address;

    let isAlive: boolean = false;

    try {
      isAlive = await getIsAlive(event.srcAddress, event.params.gauge, event.block.number, event.chainId);
    } catch (error) {
      context.log.warn(`Error getting isAlive for gauge ${event.params.gauge}: ${error}`);
    }

    try {
      tokensDeposited = await getTokensDeposited(rewardTokenAddress, event.params.gauge, event.block.number, event.chainId);
    } catch (error) {
      context.log.warn(`Error getting tokens deposited for gauge ${event.params.gauge}: ${error}`);
    }

    const promisePool = poolAddress
      ? context.LiquidityPoolAggregator.get(poolAddress)
      : null;

    if (!poolAddress) {
      context.log.warn(
        `No pool address found for the gauge address ${event.params.gauge.toString()}`
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

    return { currentLiquidityPool, rewardToken, tokensDeposited, isAlive };
  },
  handler: async ({ event, context, loaderReturn }) => {

    if (loaderReturn) {
      const { isAlive, currentLiquidityPool, rewardToken, tokensDeposited } = loaderReturn;

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
            `Reward token with ID ${rewardToken.id.toString()} does not have a USD price yet.`
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
          `No pool entity or reward token found for the gauge address ${event.params.gauge.toString()}`
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
    }
  },
});
