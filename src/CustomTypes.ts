// Token type
// TODO align this with the TokenEntity type in src/Types.gen.ts
export type Token = {
  address: string;
  symbol: string;
};

// Pool type
// TODO align this with the LiquidityPoolEntity type in src/Types.gen.ts
export type Pool = {
  address: string;
  token0: Token;
  token1: Token;
  name: string;
};

export enum SnapshotInterval {
  Hourly = 3600,
  Daily = 86400,
  Weekly = 604800,
}

// Object type to store pool address and its corresponding reward addresses
export type poolRewardAddressMapping = {
  poolAddress: string;
  gaugeAddress: string;
  bribeVotingRewardAddress: string;
  feeVotingRewardAddress: string;
};
