import { LiquidityPoolEntity, TokenEntity } from "./src/Types.gen";

import {
  WHITELISTED_TOKENS,
  TEN_TO_THE_18_BI,
  STABLECOIN_POOL_ADDRESSES,
  WETH,
} from "./Constants";

import { multiplyBase1e18 } from "./Maths";

// Helper function to normalize token amounts to 1e18
export const normalizeTokenAmountTo1e18 = (
  token_address: string,
  amount: bigint
): bigint => {
  let token = WHITELISTED_TOKENS.find(
    (token) => token.address.toLowerCase() === token_address.toLowerCase()
  );
  if (token) {
    return (amount * TEN_TO_THE_18_BI) / BigInt(10 ** token.decimals);
  } else {
    return amount;
  }
};

// Function to calculate the price of ETH as the weighted average of ETH price from the stablecoin vs ETH pools
export const calculateETHPriceInUSD = (
  stablecoin_pools: LiquidityPoolEntity[]
): bigint => {
  let totalWeight = 0n;
  let weightedPriceSum = 0n;

  // TODO check that each stablecoin pool has sufficient liquidity for it to be used in the calculation
  for (let pool of stablecoin_pools) {
    // Use token0 price of pool as ETH price
    // assumption is that all stablecoin pools are token0 = ETH, token1 = stablecoin
    const ethPrice = pool.token0Price;

    // Use reserve0 as weight numerator
    const weight = pool.reserve0;

    // Calculate weighted average of ETH price
    weightedPriceSum += ethPrice * weight;

    // Sum weight denominator
    totalWeight += weight;
  }

  let ethPriceInUSD = totalWeight > 0n ? weightedPriceSum / totalWeight : 0n;

  return ethPriceInUSD;
};

// Helper function to check if a pool is a stablecoin pool
export const isStablecoinPool = (pool_address: string): boolean => {
  return STABLECOIN_POOL_ADDRESSES.some(
    (address) => address.toLowerCase() === pool_address
  );
};

// Helper function to extract a subset of LiquidityPool entities from a list of LiquidityPool entities with whitelisted tokens
const extractRelevantLiquidityPoolEntities = (
  token_address: string,
  liquidityPoolEntities: LiquidityPoolEntity[]
): LiquidityPoolEntity[] => {
  // Create a list to store the relevant liquidity pool entities
  let relevantLiquidityPoolEntities: LiquidityPoolEntity[] = [];

  // Search through the liquidity pool entities and add the relevant ones to the list
  for (let pool of liquidityPoolEntities) {
    if (
      pool.token0.toLowerCase() === token_address.toLowerCase() ||
      pool.token1.toLowerCase() === token_address.toLowerCase()
    ) {
      relevantLiquidityPoolEntities.push(pool);
    }
  }

  return relevantLiquidityPoolEntities;
};

// Helper function to return pricePerETH given token address and LiquidityPool entities
export const findPricePerETH = (
  token_address: string,
  whitelisted_tokens_list: TokenEntity[],
  liquidityPoolEntities: LiquidityPoolEntity[]
): bigint => {
  // Case 1: token is ETH
  if (token_address.toLowerCase() === WETH.address.toLowerCase()) {
    return TEN_TO_THE_18_BI;
  }
  // Case 2: token is not ETH
  else {
    let relevant_liquidity_pool_entities = extractRelevantLiquidityPoolEntities(
      token_address,
      liquidityPoolEntities
    );
    // If the token is not WETH, then run through the pricing pools to price the token
    for (let pool of relevant_liquidity_pool_entities) {
      if (pool.token0 == token_address) {
        // load whitelist token
        let whitelisted_token_instance = whitelisted_tokens_list.find(
          (token) => token.id === pool.token1
        );
        if (whitelisted_token_instance) {
          return multiplyBase1e18(
            pool.token0Price,
            whitelisted_token_instance.pricePerETH
          );
        }
      } else if (pool.token1 == token_address) {
        // load whitelist token
        let whitelisted_token_instance = whitelisted_tokens_list.find(
          (token) => token.id === pool.token0
        );
        if (whitelisted_token_instance) {
          return multiplyBase1e18(
            pool.token1Price,
            whitelisted_token_instance.pricePerETH
          );
        }
      }
    }
    return 0n;
  }
};
