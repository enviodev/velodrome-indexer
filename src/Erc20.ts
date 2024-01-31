import { Web3 } from "web3";

import { CHAIN_CONSTANTS } from "./Constants";

import { Cache } from "./cache"
import { CacheCategory } from "./Constants";

// ERC20 Contract ABI
const contractABI = require("../abis/ERC20.json");

// Function to get ERC20 token details
export async function getErc20TokenDetails(
  contractAddress: string,
  chainId: number
): Promise<{ readonly name: string; readonly decimals: number; readonly symbol: string }> {
  const cache = Cache.init(CacheCategory.Token, chainId);
  const token = cache.read(contractAddress.toLowerCase());

  if (token) {
    return {
      decimals: Number(token.decimals),
      name: token.name,
      symbol: token.symbol,
    };
  }

  // RPC URL
  const rpcURL = CHAIN_CONSTANTS[chainId].rpcURL;

  // Create Web3 instance
  const web3 = new Web3(rpcURL);

  // Create ERC20 contract instance
  const erc20token = new web3.eth.Contract(contractABI, contractAddress);

  try {
    // Use Promise.all to execute all calls in parallel and wait for all of them to resolve
    const [name, decimals, symbol] = await Promise.all([
      erc20token.methods.name().call(),
      erc20token.methods.decimals().call(),
      erc20token.methods.symbol().call(),
    ]);

    // Return an object containing the name, decimals, and symbol
    const entry = {
      decimals: Number(decimals) || 0,
      name: name?.toString() || "",
      symbol: symbol?.toString() || "",
    } as const;

    cache.add({ [contractAddress.toLowerCase()]: entry as any });

    // throw 'test';
    return entry;

  } catch (err) {
    console.error("An error occurred", err);
    throw err; // or handle the error as needed
  }
}
