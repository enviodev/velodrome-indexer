import { Token, Pool } from "./CustomTypes";

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
