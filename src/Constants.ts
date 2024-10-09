import { TokenInfo, Pool } from "./CustomTypes";
import dotenv from "dotenv";

dotenv.config();

export const TEN_TO_THE_3_BI = BigInt(10 ** 3);
export const TEN_TO_THE_6_BI = BigInt(10 ** 6);
export const TEN_TO_THE_18_BI = BigInt(10 ** 18);

export const SECONDS_IN_AN_HOUR = BigInt(3600);
export const SECONDS_IN_A_DAY = BigInt(86400);
export const SECONDS_IN_A_WEEK = BigInt(604800);

export type PriceOracleKeys = keyof typeof PRICE_ORACLE;

export const PRICE_ORACLE = {
  10: {
    startBlock: 120445435,
    updateDelta:  60 * 60 // 1 hour
  },
  8453: {
    startBlock: 20250164, 
    updateDelta: 60 * 60 // 1 hour
  }
};

// export const STATE_STORE_ID = "STATE";

// Hardcoded WETH, USDC and OP token addresses with decimals
export const WETH: TokenInfo = {
  address: "0x4200000000000000000000000000000000000006",
  symbol: "WETH",
  unit: "ether"
};

// TODO change this name to usdc.e and import native usdc from base
export const USDC: TokenInfo = {
  address: "0x7F5c764cBc14f9669B88837ca1490cCa17c31607",
  symbol: "USDC.e",
  unit: "ether"
};

export const NATIVE_USDC: TokenInfo = {
  address: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
  symbol: "USDC",
  unit: "ether"
};

export const NATIVE_USDC_BASE: TokenInfo = {
  address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  symbol: "USDC",
  unit: "ether"
};

const USDC_BASE: TokenInfo = {
  address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  symbol: "USDC",
  unit: "ether"
};

export const OP: TokenInfo = {
  address: "0x4200000000000000000000000000000000000042",
  symbol: "OP",
  unit: "ether"
};

// beware not checksummed.
const LUSD: TokenInfo = {
  address: "0xc40f949f8a4e094d1b49a23ea9241d289b7b2819",
  symbol: "LUSD",
  unit: "ether"
};

export const VELO: TokenInfo = {
  address: "0x9560e827aF36c94D2Ac33a39bCE1Fe78631088Db",
  symbol: "VELO",
  unit: "ether"
};

const USDbC: TokenInfo = {
  address: "0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA",
  symbol: "USCbC",
  unit: "ether"
};

// NB issue!! DAI address on base, Lyra address on optimism!!
const DAI: TokenInfo = {
  address: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb",
  symbol: "DAI",
  unit: "ether"
};

const AERO: TokenInfo = {
  address: "0x940181a94A35A4569E4529A3CDfB74e38FD98631",
  symbol: "AERO",
  unit: "ether"
};

const DOLA: TokenInfo = {
  address: "0x4621b7A9c75199271F773Ebd9A499dbd165c3191",
  symbol: "DOLA",
  unit: "ether"
};
// list of WHITELISTED tokens with their symbol and decimals to be used in pricing
export const OPTIMISM_WHITELISTED_TOKENS: TokenInfo[] = [
  VELO,
  OP,
  LUSD,
  WETH,
  USDC,
  NATIVE_USDC
];

export const BASE_WHITELISTED_TOKENS: TokenInfo[] = [
  USDbC,
  DAI,
  DOLA,
  WETH,
  USDC_BASE,
  NATIVE_USDC_BASE
];

// List of stablecoin pools with their token0, token1 and name
const OPTIMISM_STABLECOIN_POOLS: Pool[] = [
  {
    address: "0x0493Bf8b6DBB159Ce2Db2E0E8403E753Abd1235b",
    token0: WETH,
    token1: USDC,
    name: "vAMM-WETH/USDC.e",
  },
  {
    address: "0x6387765fFA609aB9A1dA1B16C455548Bfed7CbEA",
    token0: WETH,
    token1: LUSD,
    name: "vAMM-WETH/LUSD",
  },
];

const BASE_STABLECOIN_POOLS: Pool[] = [
  {
    address: "0xB4885Bc63399BF5518b994c1d0C153334Ee579D0",
    token0: WETH,
    token1: USDbC,
    name: "vAMM-WETH/USDbC",
  },
  {
    address: "0x9287C921f5d920cEeE0d07d7c58d476E46aCC640",
    token0: WETH,
    token1: DAI,
    name: "vAMM-WETH/DAI",
  },
];

// List of pool addresses for testing
const OPTIMISM_TESTING_POOL_ADDRESSES: string[] = [
  "0x0493Bf8b6DBB159Ce2Db2E0E8403E753Abd1235b",
  "0xd25711EdfBf747efCE181442Cc1D8F5F8fc8a0D3",
  "0xe9581d0F1A628B038fC8B2a7F5A7d904f0e2f937",
  "0x0df083de449F75691fc5A36477a6f3284C269108",
  "0x8134A2fDC127549480865fB8E5A9E8A8a95a54c5",
  "0x58e6433A6903886E440Ddf519eCC573c4046a6b2",
  "0xB4885Bc63399BF5518b994c1d0C153334Ee579D0",
];

const BASE_TESTING_POOL_ADDRESSES: string[] = [
  "0xB4885Bc63399BF5518b994c1d0C153334Ee579D0", // vAMM-WETH/USDbC
  "0x9287C921f5d920cEeE0d07d7c58d476E46aCC640", // vAMM-WETH/DAI
  "0x0B25c51637c43decd6CC1C1e3da4518D54ddb528", // sAMM-DOLA/USDbC
];

// Object containing all the constants for a chain
type chainConstants = {
  eth: TokenInfo;
  usdc: TokenInfo;
  firstPriceFetchedBlockNumber: number;
  priceOracle: string;
  rewardToken: TokenInfo;
  rpcURL: string;
  stablecoinPools: Pool[];
  stablecoinPoolAddresses: string[];
  testingPoolAddresses: string[];
  whitelistedTokens: TokenInfo[];
  whitelistedTokenAddresses: string[];
};

// Constants for Optimism
const OPTIMISM_CONSTANTS: chainConstants = {
  eth: WETH,
  usdc: NATIVE_USDC,
  firstPriceFetchedBlockNumber: 106247807,
  priceOracle: "0x6a3af44e23395d2470f7c81331add6ede8597306",
  rewardToken: VELO,
  rpcURL: process.env.OPTIMISM_RPC_URL || "https://rpc.ankr.com/optimism",
  stablecoinPools: OPTIMISM_STABLECOIN_POOLS,
  stablecoinPoolAddresses: OPTIMISM_STABLECOIN_POOLS.map(
    (pool) => pool.address
  ),
  testingPoolAddresses: OPTIMISM_TESTING_POOL_ADDRESSES,
  whitelistedTokens: OPTIMISM_WHITELISTED_TOKENS,
  whitelistedTokenAddresses: OPTIMISM_WHITELISTED_TOKENS.map(
    (token) => token.address
  ),
};

// Constants for Base
const BASE_CONSTANTS: chainConstants = {
  eth: WETH,
  usdc: NATIVE_USDC_BASE,
  firstPriceFetchedBlockNumber: 3347620,
  priceOracle: "0xcbf5b6abf55fb87271338097fdd03e9d82a9d63f",
  rewardToken: AERO,
  rpcURL: process.env.BASE_RPC_URL || "https://base.publicnode.com",
  stablecoinPools: BASE_STABLECOIN_POOLS,
  stablecoinPoolAddresses: BASE_STABLECOIN_POOLS.map((pool) => pool.address),
  testingPoolAddresses: BASE_TESTING_POOL_ADDRESSES,
  whitelistedTokens: BASE_WHITELISTED_TOKENS,
  whitelistedTokenAddresses: BASE_WHITELISTED_TOKENS.map(
    (token) => token.address
  ),
};

// Key is chain ID
export const CHAIN_CONSTANTS: Record<number, chainConstants> = {
  10: OPTIMISM_CONSTANTS,
  8453: BASE_CONSTANTS,
};

export const CacheCategory = {
  Token: "token",
  GuageToPool: "guageToPool",
  BribeToPool: "bribeToPool",
  WhitelistedPoolIds: "whitelistedPoolIds",
  PoolToTokens: "poolToTokens",
} as const;

export type CacheCategory = (typeof CacheCategory)[keyof typeof CacheCategory];
