import { CHAIN_CONSTANTS } from "./Constants";

import { Cache, Entry, ShapeToken } from "./cache";
import { CacheCategory } from "./Constants";
import { ChainCacheMap } from "./GlobalStore";

// ERC20 Contract ABI
const contractABI = require("../abis/ERC20.json");

type ChainId = number;

export type Erc20TokenDetails = {
  readonly name: string;
  readonly decimals: number;
  readonly symbol: string;
};

type FetchArgs = {
  chainId: number;
  contractAddress: string;
};

const getErc20TokenDetailsFromClient = async ({
  chainId,
  contractAddress,
}: FetchArgs): Promise<Erc20TokenDetails> => {
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

    console.log(
      `[getErc20TokenDetails] Token details added to cache for address: ${contractAddress}`
    );

    return entry;
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

type TokenCache = Entry<ShapeToken>;
export const erc20TokenDetailsCache: ChainCacheMap<
  TokenCache,
  Erc20TokenDetails,
  FetchArgs
> = new ChainCacheMap({
  make: (chainId) => Cache.init(CacheCategory.Token, chainId),
  get: (cache, key) => {
    let c = cache.read(key);
    if (c) {
      return {
        name: c.name,
        symbol: c.symbol,
        decimals: c.decimals,
      };
    }
  },
  set: (cache, contractAddress, value) => {
    cache.add({ [contractAddress.toLowerCase()]: value });
  },
  fetchValue: getErc20TokenDetailsFromClient,
  argsToCacheKey: ({ contractAddress }) => contractAddress,
});
