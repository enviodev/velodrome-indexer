import { Web3 } from "web3";

import { CHAIN_CONSTANTS } from "./Constants";

import { Cache } from "./cache";
import { CacheCategory } from "./Constants";

// ERC20 Contract ABI
const contractABI = require("../abis/ERC20.json");

// Function to get ERC20 token details
export async function getErc20TokenDetails(
  contractAddress: string,
  chainId: number
): Promise<{
  readonly name: string;
  readonly decimals: number;
  readonly symbol: string;
}> {
  // console.log(
  //   `[getErc20TokenDetails] Starting for address: ${contractAddress}, chainId: ${chainId}`
  // );

  const cache = Cache.init(CacheCategory.Token, chainId);
  const token = cache.read(contractAddress.toLowerCase());

  if (token) {
    // console.log(
    //   `[getErc20TokenDetails] Cache hit for address: ${contractAddress}`
    // );
    return {
      decimals: Number(token.decimals),
      name: token.name,
      symbol: token.symbol,
    };
  }

  console.log(
    `[getErc20TokenDetails] Cache miss for address: ${contractAddress}`
  );

  const rpcURL = CHAIN_CONSTANTS[chainId].rpcURL;
  console.log(`[getErc20TokenDetails] Using RPC URL: ${rpcURL}`);

  const web3 = new Web3(rpcURL);
  const erc20token = new web3.eth.Contract(contractABI, contractAddress);

  try {
    console.log(
      `[getErc20TokenDetails] Fetching token details for address: ${contractAddress}`
    );

    const [name, decimals, symbol] = await Promise.all([
      erc20token.methods
        .name()
        .call()
        .catch((e) => {
          console.error(
            `[getErc20TokenDetails] Error fetching name: ${e.message}`
          );
          return "";
        }),
      erc20token.methods
        .decimals()
        .call()
        .catch((e) => {
          console.error(
            `[getErc20TokenDetails] Error fetching decimals: ${e.message}`
          );
          return 0;
        }),
      erc20token.methods
        .symbol()
        .call()
        .catch((e) => {
          console.error(
            `[getErc20TokenDetails] Error fetching symbol: ${e.message}`
          );
          return "";
        }),
    ]);

    console.log(
      `[getErc20TokenDetails] Token details fetched: name=${name}, decimals=${decimals}, symbol=${symbol}`
    );

    const entry = {
      decimals: Number(decimals) || 0,
      name: name?.toString() || "",
      symbol: symbol?.toString() || "",
    } as const;

    cache.add({ [contractAddress.toLowerCase()]: entry as any });
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
}
