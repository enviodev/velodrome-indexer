import { LiquidityPoolEntity } from "./src/Types.gen";

import {
  WHITELIST_TOKENS,
  TEN_TO_THE_18_BI,
  STABLECOIN_POOLS,
} from "./CONSTANTS";

let stablecoin_pool_addresses = Object.keys(STABLECOIN_POOLS);

export const normalizeTokenAmountTo1e18 = (
  token_address: string,
  amount: bigint
): bigint => {
  let token = WHITELIST_TOKENS[token_address];
  if (token) {
    return (amount * TEN_TO_THE_18_BI) / BigInt(10 ** token.decimals);
  } else {
    return amount;
  }
};

export const calculateETHPriceInUSD = (
  stablecoin_pools: LiquidityPoolEntity[]
): bigint => {
  let totalWeight = 0n;
  let weightedPriceSum = 0n;

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

export const isStablecoinPool = (pool_address: string): boolean => {
  return stablecoin_pool_addresses.some(
    (address) => address.toLowerCase() === pool_address
  );
};
