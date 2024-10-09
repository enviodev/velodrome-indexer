import {
    NFPM,
    NFPM_Transfer,
    TokenPrice
} from "generated";

import { setPricesLastUpdated, getPricesLastUpdated, get_whitelisted_prices } from "../PriceOracle/controller";
import { PRICE_ORACLE } from "../Constants";

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

  const currentDatetime = entity.timestamp;


  type PriceOracleKeys = keyof typeof PRICE_ORACLE;

  // Check if the chainId is in the PRICE_ORACLE settings and has been deployed.
  if (!(event.chainId in PRICE_ORACLE)) {
    return;
  }

  // Check if the block number is greater than the start block of the price oracle.
  // This is just to ensure the price oracle starts at a "good" block and we aren't
  // wasting RPC calls. 
  let startBlock = PRICE_ORACLE[event.chainId as PriceOracleKeys].startBlock || Number.MAX_SAFE_INTEGER;
  if (event.block.number < startBlock) {
    return;
  }

  // Only update the prices if the last update was more than updateDelta seconds ago.
  const timeDelta =  PRICE_ORACLE[event.chainId as PriceOracleKeys].updateDelta * 1000;

  if (!lastUpdated || (currentDatetime.getTime() - lastUpdated.getTime()) > timeDelta) {
    let tokenData: any[] = [];
    try {
      tokenData = await get_whitelisted_prices(event.chainId);
    } catch (error) {
      console.error("Error fetching whitelisted prices:", error);
    }

    for (const token of tokenData) {
      if (token.price) {  
        const tokenPrice: TokenPrice = {
          id: `${event.chainId}_${token.address}_${event.block.number}`,
          name: token.symbol,
          address: token.address,
          price: token.price,
          chainID: event.chainId,
          lastUpdatedTimestamp: currentDatetime,
        };
        try {
          context.TokenPrice.set(tokenPrice);
        } catch (error) {
          console.error("Error setting token price:", error);
        }
      }
    }
    setPricesLastUpdated(event.chainId, currentDatetime); // Update the last datetime
  }
});
