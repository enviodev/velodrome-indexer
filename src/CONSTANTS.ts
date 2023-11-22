export const TEN_TO_THE_18_BI = BigInt(10 ^ 18);

type Token = {
  symbol: string;
  decimals: number;
};

export const WHITELIST_TOKENS: { [address: string]: Token } = {
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
  "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58": {
    symbol: "USDT",
    decimals: 6,
  },
  "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1": {
    symbol: "USDC.e",
    decimals: 6,
  },
  "0x1F32b1c2345538c0c6f582fCB022739c4A194Ebb": {
    symbol: "wstETH",
    decimals: 18,
  },
};
