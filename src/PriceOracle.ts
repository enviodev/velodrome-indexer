import {
  OPTIMISM_WHITELISTED_TOKENS,
  BASE_WHITELISTED_TOKENS,
  CHAIN_CONSTANTS,
  TokenIdByChain,
  CacheCategory,
  toChecksumAddress,
  TokenIdByBlock,
  getPriceOracleContract
} from "./Constants";
import { Token, TokenPriceSnapshot } from "./src/Types.gen";
import { Cache, ShapePricesList } from "./cache";
import { createHash } from "crypto";


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
  const contract = getPriceOracleContract(chainId, blockNumber);
  const numAddrs = addrs.length - 1;
  try {
    const prices: string[] = await contract.methods
      .getManyRatesWithConnectors(numAddrs, addrs)
      .call({}, blockNumber);
    return prices;
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
    CHAIN_CONSTANTS[chainId].oracle.startBlock || Number.MAX_SAFE_INTEGER;

  if (blockNumber < startBlock) return;

  // Skip if already updated recently
  const lastUpdated = getPricesLastUpdated(chainId);
  const timeDelta = CHAIN_CONSTANTS[chainId].oracle.updateDelta * 1000;
  const tokensNeedUpdate =
    !lastUpdated || blockDatetime.getTime() - lastUpdated.getTime() > timeDelta;

  if (!tokensNeedUpdate) return;

  // Get token data for chain
  const tokenData =
    chainId === 10 ? OPTIMISM_WHITELISTED_TOKENS : BASE_WHITELISTED_TOKENS;

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
        name: token.symbol,
        address: toChecksumAddress(token.address),
        pricePerUSDNew: BigInt(price),
        chainId: chainId,
        lastUpdatedTimestamp: blockDatetime,
    };
    context.TokenPriceSnapshot.set(tokenPrice);
  }

  setPricesLastUpdated(chainId, blockDatetime);
}
