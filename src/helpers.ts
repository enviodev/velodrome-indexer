import { WHITELIST_TOKENS, TEN_TO_THE_18_BI } from "./CONSTANTS";

export let normalizeTokenAmountTo1e18 = (
  token_address: string,
  amount: bigint
): bigint => {
  let token = WHITELIST_TOKENS[token_address];
  if (token) {
    return (amount * TEN_TO_THE_18_BI) / BigInt(10 ** token.decimals);
  } else {
    return amount;
  }
};
