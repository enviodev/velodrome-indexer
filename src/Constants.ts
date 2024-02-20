import { Token, Pool } from "./CustomTypes";
// import { LatestETHPriceEntity, StateStoreEntity } from "./src/Types.gen";

export const TEN_TO_THE_3_BI = BigInt(10 ** 3);
export const TEN_TO_THE_6_BI = BigInt(10 ** 6);
export const TEN_TO_THE_18_BI = BigInt(10 ** 18);

export const SECONDS_IN_AN_HOUR = BigInt(3600);
export const SECONDS_IN_A_DAY = BigInt(86400);
export const SECONDS_IN_A_WEEK = BigInt(604800);

export const STATE_STORE_ID = "STATE";

// export const INITIAL_ETH_PRICE: LatestETHPriceEntity = {
//   id: "1687468854", // Using Timestamp of first price minus 1 second
//   price: 1869671494767075821464n, // Using the first calculated ETH price as initial price - an hour delay from the timestamp where ETH price was calculated
// };
// export const DEFAULT_STATE_STORE: StateStoreEntity = {
//   id: STATE_STORE_ID,
//   latestEthPrice: INITIAL_ETH_PRICE.id,
// };

// Hardcoded WETH, USDC and OP token addresses with decimals
export const WETH: Token = {
  address: "0x4200000000000000000000000000000000000006",
  symbol: "WETH",
};

// TODO change this name to usdc.e and import native usdc from base
export const USDC: Token = {
  address: "0x7F5c764cBc14f9669B88837ca1490cCa17c31607",
  symbol: "USDC.e",
};

export const NATIVE_USDC: Token = {
  address: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
  symbol: "USDC",
};

const USDC_BASE: Token = {
  address: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
  symbol: "USDC",
};

export const OP: Token = {
  address: "0x4200000000000000000000000000000000000042",
  symbol: "OP",
};

const LUSD: Token = {
  address: "0xc40f949f8a4e094d1b49a23ea9241d289b7b2819",
  symbol: "LUSD",
};

export const VELO: Token = {
  address: "0x9560e827aF36c94D2Ac33a39bCE1Fe78631088Db",
  symbol: "VELO",
};

const USDbC: Token = {
  address: "0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA",
  symbol: "USCbC",
};

// NB issue!! DAI address on base, Lyra address on optimism!!
const DAI: Token = {
  address: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb",
  symbol: "DAI",
};

const AERO: Token = {
  address: "0x940181a94A35A4569E4529A3CDfB74e38FD98631",
  symbol: "AERO",
};

const DOLA: Token = {
  address: "0x4621b7A9c75199271F773Ebd9A499dbd165c3191",
  symbol: "DOLA",
};
// list of WHITELISTED tokens with their symbol and decimals to be used in pricing
const OPTIMISM_WHITELISTED_TOKENS: Token[] = [WETH, USDC, VELO, OP, LUSD];

const BASE_WHITELISTED_TOKENS: Token[] = [WETH, USDbC, USDC_BASE, DAI, DOLA];

// List of stablecoin pools with their token0, token1 and name
export const PRICING_POOLS: Pool[] = [
  {
    address: "0x0493Bf8b6DBB159Ce2Db2E0E8403E753Abd1235b",
    token0: WETH,
    token1: USDC,
    name: "vAMM-WETH/USDC.e",
  },
  {
    address: "0x8134A2fDC127549480865fB8E5A9E8A8a95a54c5",
    token0: USDC,
    token1: VELO,
    name: "Volatile AMM - USDC.e/VELO",
  },
  {
    address: "0x0df083de449F75691fc5A36477a6f3284C269108",
    token0: OP, // these fields aren't being used currently.
    token1: USDC,
    name: "Volatile AMM - OP/USDC.e",
  },
];

export const PRICING_POOLS_ADDRESSES: string[] = PRICING_POOLS.map(
  (pool) => pool.address
);

// Very carefully check these addresses don't get created cross chain.
// Or add more defenses.
const USD_TOKENS: Token[] = [USDC, USDbC, USDC_BASE, NATIVE_USDC];

// update list.
export const USD_TOKENS_ADDRESSES: string[] = USD_TOKENS.map(
  (token) => token.address
);

const TOKENS_PRICED_IN_USD: Token[] = [WETH, OP, VELO];

// update list.
export const TOKENS_PRICED_IN_USD_ADDRESSES: string[] =
  TOKENS_PRICED_IN_USD.map((token) => token.address);
// Need to create a list of whitelisted tokens and all their known addresses.
// I.e. WETH is a token for pricing, the WETH token across both base and optimism.

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
  eth: Token;
  usdc: Token;
  firstPriceFetchedBlockNumber: number;
  rewardToken: Token;
  rpcURL: string;
  stablecoinPools: Pool[];
  stablecoinPoolAddresses: string[];
  testingPoolAddresses: string[];
  whitelistedTokens: Token[];
  whitelistedTokenAddresses: string[];
};

// Constants for Optimism
const OPTIMISM_CONSTANTS: chainConstants = {
  eth: WETH,
  usdc: USDC,
  firstPriceFetchedBlockNumber: 106247807,
  rewardToken: VELO,
  rpcURL: "https://rpc.ankr.com/optimism",
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
  usdc: USDbC,
  firstPriceFetchedBlockNumber: 3347620,
  rewardToken: AERO,
  rpcURL: "https://base.publicnode.com",
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
