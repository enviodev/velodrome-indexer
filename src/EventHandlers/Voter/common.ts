import { CHAIN_CONSTANTS, toChecksumAddress, TokenIdByChain } from "../../Constants";

import Web3 from "web3";
import ERC20GaugeABI from "../../../abis/ERC20.json";
import VoterABI from "../../../abis/VoterABI.json";
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
export async function getTokensDeposited(rewardTokenAddress: string, gaugeAddress: string, blockNumber: number, eventChainId: number): Promise<BigInt> {
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
export async function getIsAlive(voterAddress: string, gaugeAddress: string, blockNumber: number, eventChainId: number): Promise<boolean> {
    const rpcURL = CHAIN_CONSTANTS[eventChainId].rpcURL;
    const web3 = new Web3(rpcURL);
    const contract = new web3.eth.Contract(VoterABI, voterAddress);
    const isAlive: boolean = await contract.methods.isAlive(gaugeAddress).call({}, blockNumber);
    return isAlive;
}