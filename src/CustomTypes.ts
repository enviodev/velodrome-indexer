import { TokenEntity } from "./src/Types.gen";

// Token type to contain minimal information about a token
export type Token = {
  address: string;
  symbol: string;
};

export type TokenEntityMapping = {
  address: string;
  tokenInstance: TokenEntity | undefined;
};

// Pool type to contain minimal information about a pool
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
