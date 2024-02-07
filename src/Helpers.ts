import {
  LiquidityPoolEntity,
  TokenEntity,
  liquidityPoolEntity,
} from "./src/Types.gen";

import { TEN_TO_THE_18_BI, CHAIN_CONSTANTS } from "./Constants";

import { multiplyBase1e18 } from "./Maths";

import { Address } from "web3";

// Helper function to normalize token amounts to 1e18
export const normalizeTokenAmountTo1e18 = (
  amount: bigint,
  tokenDecimals: number
): bigint => {
  if (tokenDecimals != 0) {
    return (amount * TEN_TO_THE_18_BI) / BigInt(10 ** tokenDecimals);
  } else {
    return amount;
  }
};

// Function to calculate the price of ETH as the weighted average of ETH price from the stablecoin vs ETH pools
export const calculateETHPriceInUSD = (
  stablecoinPools: LiquidityPoolEntity[]
): bigint => {
  let totalWeight = 0n;
  let weightedPriceSum = 0n;

  for (let pool of stablecoinPools) {
    // Skip pools with insufficient liquidity (i.e. 2 ETH) to avoid skewing the price
    if (pool.reserve0 < 2n * TEN_TO_THE_18_BI) {
      continue;
    }
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
export const isStablecoinPool = (
  poolAddress: string,
  chainId: number
): boolean => {
  return CHAIN_CONSTANTS[chainId].stablecoinPoolAddresses.some(
    (address) => address.toLowerCase() === poolAddress
  );
};

// Helper function to extract a subset of LiquidityPool entities from a list of LiquidityPool entities with whitelisted tokens
const extractRelevantLiquidityPoolEntities = (
  tokenAddress: string,
  liquidityPoolEntities: LiquidityPoolEntity[]
): LiquidityPoolEntity[] => {
  // Create a list to store the relevant liquidity pool entities
  let relevantLiquidityPoolEntities: LiquidityPoolEntity[] = [];

  // Search through the liquidity pool entities and add the relevant ones to the list
  for (let pool of liquidityPoolEntities) {
    if (
      pool.token0.toLowerCase() === tokenAddress.toLowerCase() ||
      pool.token1.toLowerCase() === tokenAddress.toLowerCase()
    ) {
      relevantLiquidityPoolEntities.push(pool);
    }
  }

  return relevantLiquidityPoolEntities;
};

const calculatePrice = (
  relevantLiquidityPoolEntities: liquidityPoolEntity[],
  tokenAddress: Address,
  whitelistedTokensList: TokenEntity[]
) => {
  // If the token is not WETH, then run through the pricing pools to price the token
  for (let pool of relevantLiquidityPoolEntities) {
    if (pool.token0 == tokenAddress) {
      // load whitelist token
      let whitelistedTokenInstance = whitelistedTokensList.find(
        (token) => token.id === pool.token1
      );
      // Second condition is to prevent relative pricing against a token that has a zero price against ETH i.e. not yet been priced
      if (
        whitelistedTokenInstance &&
        whitelistedTokenInstance.pricePerETH !== 0n
      ) {
        return multiplyBase1e18(
          pool.token0Price,
          whitelistedTokenInstance.pricePerETH
        );
      }
    } else if (pool.token1 == tokenAddress) {
      // load whitelist token
      let whitelistedTokenInstance = whitelistedTokensList.find(
        (token) => token.id === pool.token0
      );
      // Second condition is to prevent relative pricing against a token that has a zero price against ETH i.e. not yet been priced
      if (
        whitelistedTokenInstance &&
        whitelistedTokenInstance.pricePerETH !== 0n
      ) {
        return multiplyBase1e18(
          pool.token1Price,
          whitelistedTokenInstance.pricePerETH
        );
      }
    } else {
      throw "Token not part of pools it is meant to be part of.";
    }
  }
  return 0n;
};

export const findPricePerETH = (
  token0Entity: TokenEntity,
  token1Entity: TokenEntity,
  whitelistedTokensList: TokenEntity[],
  liquidityPoolEntities0: LiquidityPoolEntity[],
  liquidityPoolEntities1: LiquidityPoolEntity[],
  chainId: number,
  relativeTokenPrice0: bigint,
  relativeTokenPrice1: bigint
): { token0PricePerETH: bigint; token1PricePerETH: bigint } => {
  // Case 1: token is ETH
  if (
    token0Entity.id.toLowerCase() ===
    CHAIN_CONSTANTS[chainId].eth.address.toLowerCase()
  ) {
    return {
      token0PricePerETH: TEN_TO_THE_18_BI,
      token1PricePerETH: relativeTokenPrice1,
    };
  } else if (
    token1Entity.id.toLowerCase() ===
    CHAIN_CONSTANTS[chainId].eth.address.toLowerCase()
  ) {
    return {
      token0PricePerETH: relativeTokenPrice0,
      token1PricePerETH: TEN_TO_THE_18_BI,
    };
  }
  // Case 2: both tokens are not ETH
  else {
    let token0PricePerETH = calculatePrice(
      liquidityPoolEntities0,
      token0Entity.id,
      whitelistedTokensList
    );
    let token1PricePerETH = calculatePrice(
      liquidityPoolEntities1,
      token1Entity.id,
      whitelistedTokensList
    );

    // if there are no relevant pools to price against, price against the other token in the pool
    if (
      liquidityPoolEntities0.length === 0 &&
      liquidityPoolEntities1.length > 0
    ) {
      token0PricePerETH = multiplyBase1e18(
        relativeTokenPrice0,
        token1PricePerETH
      );
    } else if (
      liquidityPoolEntities1.length === 0 &&
      liquidityPoolEntities0.length > 0
    ) {
      token1PricePerETH = multiplyBase1e18(
        relativeTokenPrice1,
        token0PricePerETH
      );
    }

    return {
      token0PricePerETH,
      token1PricePerETH,
    };
  }
};

// Helper function to return pricePerETH given token address and LiquidityPool entities
export const findPricePerETHOld = (
  tokenAddress: string,
  whitelistedTokensList: TokenEntity[],
  liquidityPoolEntities: LiquidityPoolEntity[],
  chainId: number
): bigint => {
  // Case 1: token is ETH
  if (
    tokenAddress.toLowerCase() ===
    CHAIN_CONSTANTS[chainId].eth.address.toLowerCase()
  ) {
    return TEN_TO_THE_18_BI;
  }
  // Case 2: token is not ETH
  else {
    let relevantLiquidityPoolEntities = extractRelevantLiquidityPoolEntities(
      tokenAddress,
      liquidityPoolEntities
    );
    // If the token is not WETH, then run through the pricing pools to price the token, use the first price that matches
    for (let pool of relevantLiquidityPoolEntities) {
      if (pool.token0 == tokenAddress) {
        // load whitelist token
        let whitelistedTokenInstance = whitelistedTokensList.find(
          (token) => token.id === pool.token1
        );
        if (whitelistedTokenInstance) {
          return multiplyBase1e18(
            pool.token0Price,
            whitelistedTokenInstance.pricePerETH
          );
        }
      } else if (pool.token1 == tokenAddress) {
        // load whitelist token
        let whitelistedTokenInstance = whitelistedTokensList.find(
          (token) => token.id === pool.token0
        );
        if (whitelistedTokenInstance) {
          return multiplyBase1e18(
            pool.token1Price,
            whitelistedTokenInstance.pricePerETH
          );
        }
      }
    }
    return 0n;
  }
};

// Function to return the liquidityPool and User mapping id
export const getLiquidityPoolAndUserMappingId = (
  liquidityPoolId: string,
  userId: string
): string => {
  return liquidityPoolId + "-" + userId;
};

// Helper function to get generate the pool name given token0 and token1 symbols and isStable boolean
export function generatePoolName(
  token0Symbol: string,
  token1Symbol: string,
  isStable: boolean
): string {
  const poolType = isStable ? "Stable" : "Volatile";
  return `${poolType} AMM - ${token0Symbol}/${token1Symbol}`;
}
