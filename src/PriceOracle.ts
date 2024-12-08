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
  if (blockTimestamp - token.lastUpdatedTimestamp.getTime() < ONE_HOUR_MS) {
    return token;
  }

  const tokenPriceData = await getTokenPriceData(token.address, blockNumber, chainId);
  const updatedToken: Token = {
    ...token,
    pricePerUSDNew: tokenPriceData.pricePerUSDNew,
    decimals: tokenPriceData.decimals,
    lastUpdatedTimestamp: new Date(blockTimestamp * 1000)
  };
  context.Token.set(updatedToken);
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

  const WETH_ADDRESS = CHAIN_CONSTANTS[chainId].eth.address;
  const USDC_ADDRESS = CHAIN_CONSTANTS[chainId].usdc.address;

  let tokenPrice: bigint = 0n;
  let tokenDecimals: bigint = 0n;

  try {
    const prices = await read_prices([tokenAddress, WETH_ADDRESS, USDC_ADDRESS], chainId, blockNumber);
    tokenPrice = BigInt(prices[0]);
    tokenDecimals = BigInt(tokenDetails.decimals);
  } catch (error) {
    console.error("Error fetching token price", error);
  }
  return { pricePerUSDNew: tokenPrice, decimals: tokenDecimals };
  
}


/**
 * Hashes a list of addresses using MD5.
 * @param {string[]} addresses - The list of addresses to hash.
 * @returns {string} The MD5 hash of the addresses list.
 */
function hashAddresses(addresses: string[]): string {
  return createHash("md5").update(addresses.join(",")).digest("hex");
}

let pricesLastUpdated: { [chainId: number]: Date } = {};
export function setPricesLastUpdated(chainId: number, date: Date) {
  pricesLastUpdated[chainId] = date;
}

export function getPricesLastUpdated(chainId: number): Date | null {
  return pricesLastUpdated[chainId] || null;
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
  addrs: string[],
  chainId: number,
  blockNumber: number
): Promise<string[]> {

  const ethClient = CHAIN_CONSTANTS[chainId].eth_client;
  const numAddrs = addrs.length - 1;

  try {
    const { result } = await ethClient.simulateContract({
      address: CHAIN_CONSTANTS[chainId].oracle.getAddress(blockNumber) as `0x${string}`,
      abi: PriceOracleABI,
      functionName: 'getManyRatesWithConnectors',
      args: [numAddrs, addrs],
      blockNumber: BigInt(blockNumber),
    });
    return result;
  } catch (error) {
    return addrs.map(() => "-1");
  }
}

/**
 * Fetches the prices of whitelisted tokens for a given blockchain network.
 *
 * This function retrieves the list of whitelisted tokens based on the provided
 * chain ID, fetches their current prices from a price oracle, and updates the
 * context with token information including their addresses, symbols, units, and prices.
 *
 * @param {number} chainId - The ID of the blockchain network to fetch prices for.
 *                           Use 10 for the Optimism network, or any other value
 *                           for the base network.
 * @param {number} blockNumber - The block number to fetch prices for.
 * @param {Date} blockDatetime - The datetime of the block to use for updating timestamps.
 * @param {any} context - The context object to interact with the Token and TokenPrice entities.
 * @returns {Promise<void>} A promise that resolves when the operation is complete.
 *
 * @throws {Error} Throws an error if the price fetching process fails.
 */
export async function set_whitelisted_prices(
  chainId: number,
  blockNumber: number,
  blockDatetime: Date,
  context: any
): Promise<void> {
  // Skip if not yet available
  let startBlock =
    CHAIN_CONSTANTS[chainId].oracle.startBlock;

  if (blockNumber < startBlock) return;

  // Skip if already updated recently
  const lastUpdated = getPricesLastUpdated(chainId);
  const timeDelta = CHAIN_CONSTANTS[chainId].oracle.updateDelta * 1000;
  const tokensNeedUpdate =
    !lastUpdated || blockDatetime.getTime() - lastUpdated.getTime() > timeDelta;

  if (!tokensNeedUpdate) return;

  // Get token data for chain
  const tokenData = CHAIN_CONSTANTS[chainId].whitelistedTokens;

  // Get prices from oracle and filter if token is not created yet
  const addresses = tokenData
    .filter((token) => token.createdBlock <= blockNumber)
    .map((token) => toChecksumAddress(token.address));

  if (addresses.length === 0) return; 

  const tokenPriceCache = Cache.init(CacheCategory.TokenPrices, chainId);

  // Check cache for existing prices list by hashing list of addresses.
  // If there is any new addresses, we will need to fetch new prices.
  const addressHash: string = hashAddresses(addresses);
  const cacheKey = `${chainId}_${addressHash}_${blockNumber}`;

  let cache = tokenPriceCache.read(cacheKey);
  let prices: ShapePricesList = cache?.prices;

  // If prices aren't cached, fetch and cache prices.
  if (!prices) {
    prices = await read_prices(addresses, chainId, blockNumber);
    tokenPriceCache.add({ [cacheKey]: { prices: prices } as any });
  }

  const pricesByAddress = new Map<string, string>();

  prices.forEach((price, index) => {
    let p = !price || price === "-1" ? "0": price; // Clean price of undefined and -1 values
    pricesByAddress.set(addresses[index], p);
  });

  pricesByAddress.set(toChecksumAddress(CHAIN_CONSTANTS[chainId].usdc.address), "1");

  for (const token of tokenData) {
    const price = pricesByAddress.get(toChecksumAddress(token.address)) || 0;
    
    // Get or create Token entity
    let tokenEntity: Token = await context.Token.get(TokenIdByChain(token.address, chainId));
    if (!tokenEntity) {
        // Create a new token entity if it doesn't exist
        tokenEntity = {
            id: TokenIdByChain(token.address, chainId),
            address: toChecksumAddress(token.address),
            symbol: token.symbol,
            name: token.symbol, // Using symbol as name, update if you have a separate name field
            chainId: chainId,
            decimals: BigInt(token.decimals),
            pricePerUSDNew: BigInt(price),
            lastUpdatedTimestamp: blockDatetime,
            isWhitelisted: false,
        };
    }

    // Update Token entity
    const updatedToken: Token = {
        ...tokenEntity,
        pricePerUSDNew: BigInt(price),
        lastUpdatedTimestamp: blockDatetime
    };

    context.Token.set(updatedToken);

    // Create new TokenPrice entity
    const tokenPrice: TokenPriceSnapshot = {
        id: TokenIdByBlock(token.address, chainId, blockNumber),
        address: toChecksumAddress(token.address),
        pricePerUSDNew: BigInt(price),
        chainId: chainId,
        lastUpdatedTimestamp: blockDatetime,
    };

    context.TokenPriceSnapshot.set(tokenPrice);
  }

  setPricesLastUpdated(chainId, blockDatetime);
}
