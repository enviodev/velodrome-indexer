import {
    NFPM,
    NFPM_Transfer,
    NFPM_PositionData 
} from "generated";
import { getNFTPositionInfo } from "../models/NonFungiblePositionManager";

/**
 * @title NonfungiblePositionManager
 * @notice This contract manages non-fungible tokens (NFTs) that represent positions in a liquidity pool.
 * It extends the ERC721 standard, allowing these positions to be transferred and managed as NFTs.
 * The contract provides functionalities for minting, increasing, and decreasing liquidity, as well as collecting fees.
 */

/**
 * @title NFPM Transfer
 * @event Transfer
 * @notice Emitted when an NFT is transferred, including when a new NFT is minted.
 * @param {address} from - The address of the previous owner of the token. For minting, this is the zero address.
 * @param {address} to - The address of the new owner of the token.
 * @param {uint256} tokenId - The ID of the token being transferred.
 */
NFPM.Transfer.handler(async ({ event, context }) => {
  const entity: NFPM_Transfer = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    transactionHash: event.transaction.hash,
    from: event.params.from,
    to: event.params.to,
    tokenId: event.params.tokenId,
    timestamp: new Date(event.block.timestamp * 1000),
    chainId: event.chainId,
  };

  context.NFPM_Transfer.set(entity);

  // Check if the transfer is a mint
  if (event.params.from === "0x0000000000000000000000000000000000000000") {
    try {
      const positionData = await getNFTPositionInfo(event.params.tokenId, event.chainId);
      context.NFPM_PositionData.set({
        id: `${event.chainId}_${event.params.tokenId}`,
        transactionHash: event.transaction.hash,
        sourceAddress: event.srcAddress,
        timestamp: new Date(event.block.timestamp * 1000),
        chainId: event.chainId,
        ...positionData
      });
    } catch (error) {
      console.log(`[getNFPMPositionDetails] Fetching token details for index: ${event.params.tokenId}`);
    }
  }
});
