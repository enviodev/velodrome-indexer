import { TokenInfo, Pool } from "./CustomTypes";
import dotenv from "dotenv";
import optimismWhitelistedTokens from './constants/optimismWhitelistedTokens.json';
import baseWhitelistedTokens from './constants/baseWhitelistedTokens.json';

dotenv.config();

export const TEN_TO_THE_3_BI = BigInt(10 ** 3);
export const TEN_TO_THE_6_BI = BigInt(10 ** 6);
export const TEN_TO_THE_18_BI = BigInt(10 ** 18);

export const SECONDS_IN_AN_HOUR = BigInt(3600);
export const SECONDS_IN_A_DAY = BigInt(86400);
export const SECONDS_IN_A_WEEK = BigInt(604800);

// Convert imported JSON to TokenInfo type
export const OPTIMISM_WHITELISTED_TOKENS: TokenInfo[] = optimismWhitelistedTokens as TokenInfo[];
export const BASE_WHITELISTED_TOKENS: TokenInfo[] = baseWhitelistedTokens as TokenInfo[];

// Helper function to find a token by symbol
const findToken = (tokens: TokenInfo[], symbol: string): TokenInfo => {
  const token = tokens.find(t => t.symbol === symbol);
  if (!token) throw new Error(`Token ${symbol} not found`);
  return token;
};

// List of stablecoin pools with their token0, token1 and name
const OPTIMISM_STABLECOIN_POOLS: Pool[] = [
  {
    address: "0x0493Bf8b6DBB159Ce2Db2E0E8403E753Abd1235b",
    token0: findToken(OPTIMISM_WHITELISTED_TOKENS, "WETH"),
    token1: findToken(OPTIMISM_WHITELISTED_TOKENS, "USDC"),
    name: "vAMM-WETH/USDC.e",
  },
  {
    address: "0x6387765fFA609aB9A1dA1B16C455548Bfed7CbEA",
    token0: findToken(OPTIMISM_WHITELISTED_TOKENS, "WETH"),
    token1: findToken(OPTIMISM_WHITELISTED_TOKENS, "LUSD"),
    name: "vAMM-WETH/LUSD",
  },
];

const BASE_STABLECOIN_POOLS: Pool[] = [
  {
    address: "0xB4885Bc63399BF5518b994c1d0C153334Ee579D0",
    token0: findToken(BASE_WHITELISTED_TOKENS, "WETH"),
    token1: findToken(BASE_WHITELISTED_TOKENS, "USDbC"),
    name: "vAMM-WETH/USDbC",
  },
  {
    address: "0x9287C921f5d920cEeE0d07d7c58d476E46aCC640",
    token0: findToken(BASE_WHITELISTED_TOKENS, "WETH"),
    token1: findToken(BASE_WHITELISTED_TOKENS, "DAI"),
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
  oracle: {
    getAddress: (blockNumber: number) => string;
    startBlock: number;
    updateDelta: number;
  };
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
  eth: findToken(OPTIMISM_WHITELISTED_TOKENS, "WETH"),
  usdc: findToken(OPTIMISM_WHITELISTED_TOKENS, "USDC"),
  oracle: {
    getAddress: (blockNumber: number) => {
      return blockNumber < 124076662 ?
        "0x395942C2049604a314d39F370Dfb8D87AAC89e16" :
        "0x6a3af44e23395d2470f7c81331add6ede8597306";
    },
    startBlock: 107676013,
    updateDelta:  60 * 60 // 1 hour
  },
  rewardToken: findToken(OPTIMISM_WHITELISTED_TOKENS, "VELO"),
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
  eth: findToken(BASE_WHITELISTED_TOKENS, "WETH"),
  usdc: findToken(BASE_WHITELISTED_TOKENS, "USDC"),
  oracle: {
    getAddress: (blockNumber: number) => {
      return blockNumber < 18480097 ?
        "0xe58920a8c684CD3d6dCaC2a41b12998e4CB17EfE" :
        "0xcbf5b6abf55fb87271338097fdd03e9d82a9d63f";
    },
    startBlock: 3219857, 
    updateDelta: 60 * 60 // 1 hour
  },
  rewardToken: findToken(BASE_WHITELISTED_TOKENS, "AERO"),
  rpcURL: process.env.BASE_RPC_URL || "https://base.publicnode.com",
  stablecoinPools: BASE_STABLECOIN_POOLS,
  stablecoinPoolAddresses: BASE_STABLECOIN_POOLS.map((pool) => pool.address),
  testingPoolAddresses: BASE_TESTING_POOL_ADDRESSES,
  whitelistedTokens: BASE_WHITELISTED_TOKENS,
  whitelistedTokenAddresses: BASE_WHITELISTED_TOKENS.map(
    (token) => token.address
  ),
};

export const TokenIdByChain = (address: string, chainId: number) => `${address.toLowerCase()}-${chainId}`;

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