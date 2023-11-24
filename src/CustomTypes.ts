// Token type
// TODO align this with the TokenEntity type in src/Types.gen.ts
export type Token = {
  address: string;
  symbol: string;
  decimals: number;
};

// Pool type
// TODO align this with the LiquidityPoolEntity type in src/Types.gen.ts
export type Pool = {
  address: string;
  token0: Token;
  token1: Token;
  name: string;
};

// Minimal pool type that will just be used for lookups
export type MinimalPool = {
  address: string;
  token0_address: string;
  token1_address: string;
};
