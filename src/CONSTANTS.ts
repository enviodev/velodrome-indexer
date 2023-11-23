export const TEN_TO_THE_18_BI = BigInt(10 ** 18);

// Token type
type Token = {
  symbol: string;
  decimals: number;
};

// list of WHITELISTED tokens with their symbol and decimals to be used in pricing
export const WHITELISTED_TOKENS: { [address: string]: Token } = {
  "0x4200000000000000000000000000000000000006": {
    symbol: "WETH",
    decimals: 18,
  },
  "0x7F5c764cBc14f9669B88837ca1490cCa17c31607": {
    symbol: "USDC.e",
    decimals: 6,
  },
  "0x4200000000000000000000000000000000000042": {
    symbol: "OP",
    decimals: 18,
  },
  "0xc40f949f8a4e094d1b49a23ea9241d289b7b2819": {
    symbol: "LUSD",
    decimals: 18,
  },
};

// Pool type
type Pool = {
  token0: Token;
  token1: Token;
  name: string;
};

// Dictionary of stablecoin pools with their token0, token1 and name
export const STABLECOIN_POOLS: { [address: string]: Pool } = {
  "0x0493Bf8b6DBB159Ce2Db2E0E8403E753Abd1235b": {
    token0: WHITELISTED_TOKENS["0x4200000000000000000000000000000000000006"],
    token1: WHITELISTED_TOKENS["0x7f5c764cbc14f9669b88837ca1490cca17c31607"],
    name: "vAMM-WETH/USDC.e",
  },
  "0x6387765fFA609aB9A1dA1B16C455548Bfed7CbEA": {
    token0: WHITELISTED_TOKENS["0x4200000000000000000000000000000000000006"],
    token1: WHITELISTED_TOKENS["0xc40f949f8a4e094d1b49a23ea9241d289b7b2819"],
    name: "vAMM-WETH/LUSD",
  },
};

export const STABLECOIN_POOL_ADDRESSES = Object.keys(STABLECOIN_POOLS);
