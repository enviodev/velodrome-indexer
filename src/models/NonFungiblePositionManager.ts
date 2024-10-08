import { Web3 } from "web3";

import { CHAIN_CONSTANTS } from "./../Constants";

const contractABI = require("../../abis/NonFungiblePositionManager.json");

type PositionData = {
    nonce: bigint; // uint96, represented as a BigInt
    operator: string; // Ethereum address
    token0: string; // Ethereum address
    token1: string; // Ethereum address
    tickSpacing: number; // int24, represented as a number
    tickLower: number; // int24, represented as a number
    tickUpper: number; // int24, represented as a number
    liquidity: bigint; // uint128, represented as a BigInt
    feeGrowthInside0LastX128: bigint; // uint256, represented as a BigInt
    feeGrowthInside1LastX128: bigint; // uint256, represented as a BigInt
    tokensOwed0: bigint; // uint128, represented as a BigInt
    tokensOwed1: bigint; // uint128, represented as a BigInt
  };

/**
 * Retrieves the position information for a given NFT token ID on a specified blockchain.
 *
 * @param {bigint} tokenId - The unique identifier of the NFT token.
 * @param {number} chainId - The identifier of the blockchain network.
 * @returns {Promise<PositionData>} A promise that resolves to the position data of the NFT.
 *
 * @throws {Error} If the chainId is invalid or if the contract call fails.
 *
 */
export async function getNFTPositionInfo(
  tokenId: bigint,
  chainId: number
): Promise<PositionData> {
  const rpcURL = CHAIN_CONSTANTS[chainId].rpcURL;
  const web3 = new Web3(rpcURL);

  const contractAddress = CHAIN_CONSTANTS[chainId].nonFungiblePositionManager;

  const contract = new web3.eth.Contract(contractABI, contractAddress);

  const position: unknown = await contract.methods.positions(tokenId.toString()).call();
  const positionData = position as PositionData;
  return positionData;
}
