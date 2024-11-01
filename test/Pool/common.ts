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
    totalVolumeUSD: 10n * TEN_TO_THE_18_BI,
    totalLiquidityUSD: 10n * TEN_TO_THE_18_BI,
    numberOfSwaps: 0n,
    reserve0: 10000n * TEN_TO_THE_18_BI,
    reserve1: 20000n * TEN_TO_THE_18_BI,
  };


  const mockCLPoolData = {
    id: "0x3333333333333333333333333333333333333333",
    chainId: 10,
    token0_id: mockToken0Data.id, 
    token1_id: mockToken1Data.id,
    token0_address: mockToken0Data.address,
    token1_address: mockToken1Data.address,
    isStable:  false,
    reserve0: 100n * TEN_TO_THE_18_BI,
    reserve1: 100n * TEN_TO_THE_18_BI,
    totalLiquidityUSD: 200n * TEN_TO_THE_18_BI,
    totalVolume0: 1n * TEN_TO_THE_18_BI,
    totalVolume1: 1n * TEN_TO_THE_18_BI,
    totalVolumeUSD: 10n * TEN_TO_THE_18_BI,
    totalFees0: 100n * 10n ** 18n,
    totalFees1: 200n * 10n ** 18n,
    totalFeesUSD: 300n * 10n ** 18n,
    numberOfSwaps: 1n,
    token0Price: 1n * TEN_TO_THE_18_BI,
    token1Price: 1n * TEN_TO_THE_18_BI,
    totalEmissions: 1n,
    totalEmissionsUSD: 1n * TEN_TO_THE_18_BI,
    totalBribesUSD: 1n * TEN_TO_THE_18_BI,
  };

  return {
    mockToken0Data,
    mockToken1Data,
    mockLiquidityPoolData,
    mockCLPoolData
  };
}
