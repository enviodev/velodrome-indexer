import { MockDb } from "../../generated/src/TestHelpers.gen";
import { TEN_TO_THE_18_BI, TEN_TO_THE_6_BI, TokenIdByChain } from "../../src/Constants";

export function setupCommon() {

  const mockToken0Data = {
    id: TokenIdByChain("0x1111111111111111111111111111111111111111", 10),
    address: "0x1111111111111111111111111111111111111111",
    symbol: "USDT",
    name: "Tether USD",
    decimals: 18n,
    pricePerUSDNew: 1n * TEN_TO_THE_18_BI, // 1 USD
    chainId: 10,
  };

  const mockToken1Data = {
    id: TokenIdByChain("0x2222222222222222222222222222222222222222", 10),
    address: "0x2222222222222222222222222222222222222222",
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6n,
    pricePerUSDNew: 1n * TEN_TO_THE_18_BI, // 1 USD
    chainId: 10,
  };

  const mockLiquidityPoolData = {
    id: "0x3333333333333333333333333333333333333333",
    chainId: 10,
    token0_id: mockToken0Data.id,
    token1_id: mockToken1Data.id,
    totalVolume0: 0n,
    totalVolume1: 0n,
    totalVolumeUSD: 0n,
    numberOfSwaps: 0n,
    reserve0: 10000n * TEN_TO_THE_18_BI,
    reserve1: 20000n * TEN_TO_THE_6_BI,
  };

  return {
    mockToken0Data,
    mockToken1Data,
    mockLiquidityPoolData,
  };
}
