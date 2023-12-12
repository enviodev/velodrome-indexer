import { Token, Pool } from "./CustomTypes";
import { LatestETHPriceEntity, StateStoreEntity } from "./src/Types.gen";

export const TEN_TO_THE_18_BI = BigInt(10 ** 18);

// Hardcoded WETH, USDC and OP token addresses with decimals
export const WETH: Token = {
  address: "0x4200000000000000000000000000000000000006",
  symbol: "WETH",
  decimals: 18,
};

const USDC: Token = {
  address: "0x7F5c764cBc14f9669B88837ca1490cCa17c31607",
  symbol: "USDC.e",
  decimals: 6,
};

const OP: Token = {
  address: "0x4200000000000000000000000000000000000042",
  symbol: "OP",
  decimals: 18,
};

const LUSD: Token = {
  address: "0xc40f949f8a4e094d1b49a23ea9241d289b7b2819",
  symbol: "LUSD",
  decimals: 18,
};

export const VELO: Token = {
  address: "0x9560e827aF36c94D2Ac33a39bCE1Fe78631088Db",
  symbol: "VELO",
  decimals: 18,
};

// list of WHITELISTED tokens with their symbol and decimals to be used in pricing
export const WHITELISTED_TOKENS: Token[] = [WETH, USDC, OP, LUSD];

// List of all WHITELISTED tokens addresses
export const WHITELISTED_TOKENS_ADDRESSES = WHITELISTED_TOKENS.map(
  (token) => token.address
);

// List of stablecoin pools with their token0, token1 and name
export const STABLECOIN_POOLS: Pool[] = [
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

// List of all stablecoin pool addresses
export const STABLECOIN_POOL_ADDRESSES = STABLECOIN_POOLS.map(
  (pool) => pool.address
);

// List of pool addresses for testing
export const TESTING_POOL_ADDRESSES: string[] = [
  "0x0493Bf8b6DBB159Ce2Db2E0E8403E753Abd1235b",
  "0xd25711EdfBf747efCE181442Cc1D8F5F8fc8a0D3",
  "0xe9581d0F1A628B038fC8B2a7F5A7d904f0e2f937",
  "0x0df083de449F75691fc5A36477a6f3284C269108",
  "0x8134A2fDC127549480865fB8E5A9E8A8a95a54c5",
  "0x58e6433A6903886E440Ddf519eCC573c4046a6b2",
];

export const STATE_STORE_ID = "STATE";

export const INITIAL_ETH_PRICE: LatestETHPriceEntity = {
  id: "INITIAL PRICE",
  price: 0n, // should maybe hardcode this to ~1,889.79 USD since that was the price around the time of the first pool creation
};
export const DEFAULT_STATE_STORE: StateStoreEntity = {
  id: STATE_STORE_ID,
  latestEthPrice: INITIAL_ETH_PRICE.id,
  poolsWithWhitelistedTokens: [],
};
