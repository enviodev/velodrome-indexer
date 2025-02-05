import { CHAIN_CONSTANTS } from "./Constants";

import { Cache, Entry, ShapeToken } from "./cache";
import { CacheCategory } from "./Constants";

// ERC20 Contract ABI
const contractABI = require("../abis/ERC20.json");

type TokenCache = Entry<ShapeToken>;
type ChainId = number;

const cacheMap = new Map<ChainId, TokenCache>();

const getCache = (chainId: ChainId): TokenCache => {
  const cache = cacheMap.get(chainId);
  if (!cache) {
    const newCache = Cache.init(CacheCategory.Token, chainId);
    cacheMap.set(chainId, newCache);
    return newCache;
  } else {
    return cache;
  }
};

export type Erc20TokenDetails = {
  readonly name: string;
  readonly decimals: bigint;
  readonly symbol: string;
};

const getErc20TokenDetailsFromClient = async (
  chainId: ChainId,
  contractAddress: string
): Promise<Erc20TokenDetails> => {
  const ethClient = CHAIN_CONSTANTS[chainId].eth_client;

  try {
    console.log(
      `[getErc20TokenDetails] Fetching token details for address: ${contractAddress}`
    );

    const [nameResult, decimalsResult, symbolResult] = await Promise.all([
      ethClient.simulateContract({
        address: contractAddress as `0x${string}`,
        abi: contractABI,
        functionName: "name",
        args: [],
      }),
      ethClient.simulateContract({
        address: contractAddress as `0x${string}`,
        abi: contractABI,
        functionName: "decimals",
        args: [],
      }),
      ethClient.simulateContract({
        address: contractAddress as `0x${string}`,
        abi: contractABI,
        functionName: "symbol",
        args: [],
      }),
    ]);

    const name = nameResult.result;
    const decimals = decimalsResult.result;
    const symbol = symbolResult.result;

    console.log(
      `[getErc20TokenDetails] Token details fetched: name=${name}, decimals=${decimals}, symbol=${symbol}`
    );

    const entry = {
      decimals: Number(decimals) || 0,
      name: name?.toString() || "",
      symbol: symbol?.toString() || "",
    } as const;

    const cache = getCache(chainId);
    cache.add({ [contractAddress.toLowerCase()]: entry as any });
    console.log(
      `[getErc20TokenDetails] Token details added to cache for address: ${contractAddress}`
    );

    return { ...entry, decimals: BigInt(entry.decimals) };
  } catch (err) {
    console.error(
      `[getErc20TokenDetails] Error fetching token details for address: ${contractAddress}`,
      err
    );
    if (err instanceof Error) {
      console.error(`[getErc20TokenDetails] Error stack trace:`, err.stack);
    } else {
      console.error(`[getErc20TokenDetails] Error:`, err);
    }
    // Don't leak RPC URL
    // console.error(`[getErc20TokenDetails] RPC URL used:`, rpcURL);
    console.error(
      `[getErc20TokenDetails] Contract ABI:`,
      JSON.stringify(contractABI)
    );
    throw err;
  }
};

const promiseCache = new Map<string, Promise<Erc20TokenDetails>>();

/**
 * Deduplicates the same RPC call to get ERC20 token details
 * by caching the promise and returning the same promise if it has already been called
 * this means that multiple calls in the loader function will not action the same RPC call
 */
const getDeduplicatedErc20TokenDetailsFromRpc = (
  chainId: number,
  contractAddress: string
) => {
  const promiseCacheKey = `${chainId}-${contractAddress}`;

  if (promiseCache.has(promiseCacheKey)) {
    return promiseCache.get(promiseCacheKey)!;
  } else {
    const promise = getErc20TokenDetailsFromClient(chainId, contractAddress);
    promiseCache.set(promiseCacheKey, promise);
    promise.finally(() => {
      //cleanup the promise cache to avoid memory leaks since this the actual values will be cached persistently
      promiseCache.delete(promiseCacheKey);
    });
    return promise;
  }
};

// Function to get ERC20 token details
export async function getErc20TokenDetails(
  contractAddress: string,
  chainId: number
): Promise<Erc20TokenDetails> {
  // console.log(
  //   `[getErc20TokenDetails] Starting for address: ${contractAddress}, chainId: ${chainId}`
  // );

  const cache = getCache(chainId);
  const token = cache.read(contractAddress.toLowerCase());

  if (token) {
    // console.log(
    //   `[getErc20TokenDetails] Cache hit for address: ${contractAddress}`
    // );
    return {
      decimals: BigInt(token.decimals),
      name: token.name,
      symbol: token.symbol,
    };
  }

  console.log(
    `[getErc20TokenDetails] Cache miss for address: ${contractAddress}`
  );

  return await getDeduplicatedErc20TokenDetailsFromRpc(
    chainId,
    contractAddress
  );
}
