import { Web3 } from "web3";

import { CHAIN_CONSTANTS } from "./Constants";

// ERC20 Contract ABI
const contractABI = require("../abis/ERC20.json");

export async function getDecimals(
  contractAddress: string,
  chainId: number
): Promise<number> {
  // RPC URL
  const rpcURL = CHAIN_CONSTANTS[chainId].rpcURL;

  // Create Web3 instance
  const web3 = new Web3(rpcURL);

  // Create ERC20 contract instance
  const erc20token = new web3.eth.Contract(contractABI, contractAddress);

  try {
    // Get decimals
    const decimals = await erc20token.methods.decimals().call();
    return Number(decimals);
  } catch (err) {
    console.error("An error occurred", err);
    throw err; // or handle the error as needed
  }
}

export async function getName(
  contractAddress: string,
  chainId: number
): Promise<string> {
  // RPC URL
  const rpcURL = CHAIN_CONSTANTS[chainId].rpcURL;

  // Create Web3 instance
  const web3 = new Web3(rpcURL);

  // Create ERC20 contract instance
  const erc20token = new web3.eth.Contract(contractABI, contractAddress);

  try {
    // Get name
    const name = await erc20token.methods.name().call();
    return String(name);
  } catch (err) {
    console.error("An error occurred", err);
    throw err; // or handle the error as needed
  }
}

export async function getSymbol(
  contractAddress: string,
  chainId: number
): Promise<string> {
  // RPC URL
  const rpcURL = CHAIN_CONSTANTS[chainId].rpcURL;

  // Create Web3 instance
  const web3 = new Web3(rpcURL);

  // Create ERC20 contract instance
  const erc20token = new web3.eth.Contract(contractABI, contractAddress);

  try {
    // Get symbol
    const symbol = await erc20token.methods.symbol().call();
    return String(symbol);
  } catch (err) {
    console.error("An error occurred", err);
    throw err; // or handle the error as needed
  }
}
