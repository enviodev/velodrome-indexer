import { Web3 } from "web3";

import { CHAIN_CONSTANTS } from "./Constants";

// ERC20 Contract ABI
const contractABI = require("../abis/ERC20.json");

// Function to get ERC20 token details
export async function getErc20TokenDetails(
  contractAddress: string,
  chainId: number
): Promise<{ tokenName: string; tokenDecimals: number; tokenSymbol: string }> {
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
    return {
      tokenName: String(name),
      tokenDecimals: Number(decimals),
      tokenSymbol: String(symbol),
    };
  } catch (err) {
    console.error("An error occurred", err);
    throw err; // or handle the error as needed
  }
}
