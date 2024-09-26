import { Token } from "./src/Types.gen";

// Token type to contain minimal information about a token
export type TokenInfo = {
  address: string;
  symbol: string;
};

export type TokenEntityMapping = {
  address: string;
  tokenInstance: Token | undefined;
};

// Pool type to contain minimal information about a pool
export type Pool = {
  address: string;
  token0: TokenInfo;
  token1: TokenInfo;
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
  // feeVotingRewardAddress: string; // value not used
};
