import { MinimalPool } from "./CustomTypes";

// This is only to be used in pricing - therefore only need to have the pools with whitelisted tokens in them
export let poolsWithWhitelistedTokens: MinimalPool[] = [];

// Key that will store the latest update timestamp for ETH price entity
let latestETHPriceKey: string = "";

// Function to update latestETHPriceKey
export const updateLatestETHPriceKey = (key: string) => {
  latestETHPriceKey = key;
};

// Function to retrieve latestETHPriceKey
export const getLatestETHPriceKey = () => {
  return latestETHPriceKey;
};
