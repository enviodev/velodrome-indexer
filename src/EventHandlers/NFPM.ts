import {
    NFPM,
    NFPM_Transfer,
} from "generated";

import { getPricesLastUpdated, set_whitelisted_prices } from "../PriceOracle";
import { CHAIN_CONSTANTS } from "../Constants";

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

  const lastUpdated = getPricesLastUpdated(event.chainId);
  const blockDatetime = entity.timestamp;

  // Check if the oracle is available and deployed
  const oracleAvailable = CHAIN_CONSTANTS[event.chainId].oracle.startBlock < event.block.number;
  if (!oracleAvailable) return;

  // Only update the prices if the last update was more than updateDelta seconds ago.
  const timeDelta = CHAIN_CONSTANTS[event.chainId].oracle.updateDelta * 1000;

  if (!lastUpdated || (blockDatetime.getTime() - lastUpdated.getTime()) > timeDelta) {
    try {
      await set_whitelisted_prices(event.chainId, event.block.number, blockDatetime, context);
    } catch (error) {
      console.error("Error updating whitelisted prices:");
      console.error(error);
    }
  }
});
