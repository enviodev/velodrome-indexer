import {
  CHAIN_CONSTANTS,
  TokenIdByChain,
  CacheCategory,
  toChecksumAddress,
  TokenIdByBlock,
} from "./Constants";
import { Token, TokenPriceSnapshot } from "./src/Types.gen";
import { Cache, ShapePricesList } from "./cache";
import { createHash } from "crypto";
import { getErc20TokenDetails } from "./Erc20";
import PriceOracleABI from "../abis/VeloPriceOracleABI.json";
import SpotPriceAggregatorABI from "../abis/SpotPriceAggregator.json";
import { PriceOracleType, TEN_TO_THE_18_BI } from "./Constants";
export interface TokenPriceData {
  pricePerUSDNew: bigint;
  decimals: bigint;
}

export async function createTokenEntity(tokenAddress: string, chainId: number, blockNumber: number, context: any) {
  const blockDatetime = new Date(blockNumber * 1000);
  const tokenDetails = await getErc20TokenDetails(tokenAddress, chainId);

  const tokenEntity: Token = {
      id: TokenIdByChain(tokenAddress, chainId),
      address: toChecksumAddress(tokenAddress),
      symbol: tokenDetails.symbol,
      name: tokenDetails.symbol, // Using symbol as name, update if you have a separate name field
      chainId: chainId,
      decimals: BigInt(tokenDetails.decimals),
      pricePerUSDNew: BigInt(0),
      lastUpdatedTimestamp: blockDatetime,
      isWhitelisted: false,
  };

  context.Token.set(tokenEntity);
  return tokenEntity;
}

const ONE_HOUR_MS = 60 * 60 * 1000; // 1 hour in milliseconds

/**
 * Refreshes a token's price data if the update interval has passed.
 * 
 * This function checks if enough time has passed since the last update (1 hour),
 * and if so, fetches new price data for the token. The token entity is updated
 * in the database with the new price and timestamp.
 * 
 * @param {Token} token - The token entity to refresh
 * @param {number} blockNumber - The block number to fetch price data from
 * @param {number} blockTimestamp - The timestamp of the block in seconds
 * @param {number} chainId - The chain ID where the token exists
 * @param {any} context - The database context for updating entities
 * @returns {Promise<Token>} The updated token entity
 */
export async function refreshTokenPrice(
  token: Token,
  blockNumber: number,
  blockTimestamp: number,
  chainId: number,
  context: any
): Promise<Token> {

  const blockTimestampMs = blockTimestamp * 1000;

  if (blockTimestampMs - token.lastUpdatedTimestamp.getTime() < ONE_HOUR_MS) {
    return token;
  }

  const tokenPriceData = await getTokenPriceData(token.address, blockNumber, chainId);
  const currentPrice = tokenPriceData.pricePerUSDNew;
  const updatedToken: Token = {
    ...token,
    pricePerUSDNew: currentPrice,
    decimals: tokenPriceData.decimals,
    lastUpdatedTimestamp: new Date(blockTimestampMs)
  };
  context.Token.set(updatedToken);

  // Create new TokenPrice entity
  const tokenPrice: TokenPriceSnapshot = {
      id: TokenIdByBlock(token.address, chainId, blockNumber),
      address: toChecksumAddress(token.address),
      pricePerUSDNew: currentPrice,
      chainId: chainId,
      isWhitelisted: token.isWhitelisted,
      lastUpdatedTimestamp: new Date(blockTimestampMs),
  };

  context.TokenPriceSnapshot.set(tokenPrice);
  return updatedToken;
}

/**
 * Fetches current price data for a specific token.
 * 
 * Retrieves the token's price and decimals by:
 * 1. Getting token details from the contract
 * 2. Fetching price data from the price oracle
 * 3. Converting the price to the appropriate format
 * 
 * @param {string} tokenAddress - The token's contract address
 * @param {number} blockNumber - The block number to fetch price data from
 * @param {number} chainId - The chain ID where the token exists
 * @returns {Promise<TokenPriceData>} Object containing the token's price and decimals
 * @throws {Error} If there's an error fetching the token price
 */
export async function getTokenPriceData(
  tokenAddress: string,
  blockNumber: number,
  chainId: number
): Promise<TokenPriceData> {
  const tokenDetails = await getErc20TokenDetails(
    tokenAddress,
    chainId
  );

  const WETH_ADDRESS = CHAIN_CONSTANTS[chainId].weth;
  const USDC_ADDRESS = CHAIN_CONSTANTS[chainId].usdc;
  const SYSTEM_TOKEN_ADDRESS = CHAIN_CONSTANTS[chainId].rewardToken(blockNumber);

  const USDTokenDetails = await getErc20TokenDetails(
    USDC_ADDRESS,
    chainId
  );

  if(tokenAddress === USDC_ADDRESS) {
    return { pricePerUSDNew: TEN_TO_THE_18_BI, decimals: BigInt(tokenDetails.decimals) };
  }

  const connectors = CHAIN_CONSTANTS[chainId].oracle.priceConnectors
    .filter((connector) => connector.createdBlock <= blockNumber)
    .map((connector) => connector.address)
    .filter((connector) => connector !== tokenAddress)
    .filter((connector) => connector !== WETH_ADDRESS)
    .filter((connector) => connector !== USDC_ADDRESS)
    .filter((connector) => connector !== SYSTEM_TOKEN_ADDRESS);

  let pricePerUSDNew: bigint = 0n;
  let decimals: bigint = 0n;

  const ORACLE_DEPLOYED = CHAIN_CONSTANTS[chainId].oracle.startBlock <= blockNumber;

  if (ORACLE_DEPLOYED) {
    try {
      const priceData = await read_prices(
        tokenAddress,
        USDC_ADDRESS, 
        SYSTEM_TOKEN_ADDRESS,
        WETH_ADDRESS,
        connectors,
      chainId, blockNumber);
      if (priceData.priceOracleType === PriceOracleType.V3) {
        // Convert to 18 decimals.
        pricePerUSDNew = priceData.pricePerUSDNew * TEN_TO_THE_18_BI / (10n ** BigInt(USDTokenDetails.decimals));
      } else {
        pricePerUSDNew = priceData.pricePerUSDNew;
      }
      decimals = BigInt(tokenDetails.decimals);
    } catch (error) {
      console.error("Error fetching token price", error);
    }
  }
  return { pricePerUSDNew, decimals };
}

/**
 * Reads the prices of specified tokens from a price oracle contract.
 *
 * This function interacts with a blockchain price oracle to fetch the current
 * prices of a list of token addresses. It returns them as an array of strings.
 *
 * @note: See https://github.com/ethzoomer/optimism-prices for underlying smart contract
 * implementation.
 *
 * @param {string[]} addrs - An array of token addresses for which to fetch prices.
 * @param {number} chainId - The ID of the blockchain network where the price oracle
 *                           contract is deployed.
 * @param {number} blockNumber - The block number to fetch prices for.
 * @returns {Promise<string[]>} A promise that resolves to an array of token prices
 *                              as strings.
 *
 * @throws {Error} Throws an error if the price fetching process fails or if there
 *                 is an issue with the contract call.
 */
export async function read_prices(
  tokenAddress: string,
  usdcAddress: string,
  systemTokenAddress: string,
  wethAddress: string,
  connectors: string[],
  chainId: number,
  blockNumber: number
): Promise<{ pricePerUSDNew: bigint, priceOracleType: PriceOracleType }> {

  const ethClient = CHAIN_CONSTANTS[chainId].eth_client;
  const priceOracleType = CHAIN_CONSTANTS[chainId].oracle.getType(blockNumber);
  const priceOracleAddress = CHAIN_CONSTANTS[chainId].oracle.getAddress(priceOracleType);

  try {
    if (priceOracleType === PriceOracleType.V3) {
      const tokenAddressArray = [
        ...connectors,
        systemTokenAddress, 
        wethAddress,
        usdcAddress
      ]; 
      const { result } = await ethClient.simulateContract({
        address: priceOracleAddress as `0x${string}`,
        abi: SpotPriceAggregatorABI,
        functionName: 'getManyRatesWithCustomConnectors',
        args: [[tokenAddress], usdcAddress, false, tokenAddressArray, 10],
        blockNumber: BigInt(blockNumber),
      });
      return { pricePerUSDNew: BigInt(result[0]), priceOracleType };
    } else {
      const tokenAddressArray = [
        tokenAddress,
        ...connectors,
        systemTokenAddress, 
        wethAddress,
        usdcAddress
      ]; 
      const { result } = await ethClient.simulateContract({
        address: priceOracleAddress as `0x${string}`,
        abi: PriceOracleABI,
        functionName: 'getManyRatesWithConnectors',
        args: [1, tokenAddressArray], // return 1 price
        blockNumber: BigInt(blockNumber),
      });
      return { pricePerUSDNew: BigInt(result[0]), priceOracleType };
    }
  } catch (error) {
    return { pricePerUSDNew: 0n, priceOracleType: PriceOracleType.V2 };
  }
}