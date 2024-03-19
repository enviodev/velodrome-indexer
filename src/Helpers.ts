import { TokenEntity } from "./src/Types.gen";

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

export const absBigInt = (value: bigint): bigint =>
  value < 0n ? value * -1n : value;

export const trimAfterDashAndLowercase = (input: string): string => {
  return input.split("-")[0].toLowerCase();
};

// Function to return the liquidityPool and User mapping id
// export const getLiquidityPoolAndUserMappingId = (
//   liquidityPoolId: string,
//   userId: string
// ): string => {
//   return liquidityPoolId + "-" + userId;
// };

// Helper function to get generate the pool name given token0 and token1 symbols and isStable boolean
export function generatePoolName(
  token0Symbol: string,
  token1Symbol: string,
  isStable: boolean
): string {
  const poolType = isStable ? "Stable" : "Volatile";
  return `${poolType} AMM - ${token0Symbol}/${token1Symbol}`;
}
