import { poolRewardAddressMapping } from "./CustomTypes";

// Object to store all the pool addresses with whitelist tokens
export let whitelistedPoolIds: string[] = [];

// Object to store all the pool addresses with reward contract addresses
export let poolRewardAddressStoreOld: poolRewardAddressMapping[] = [];

export const poolRewardAddressStoreManager = () => {
  let guageToPoolMapping: { [key: string]: string } = {};
  let bribeVotingToPoolMapping: { [key: string]: string } = {};

  let addRewardAddressDetails = (details: poolRewardAddressMapping) => {
    guageToPoolMapping[details.gaugeAddress.toLowerCase()] = details.poolAddress;
    bribeVotingToPoolMapping[details.bribeVotingRewardAddress.toLowerCase()] = details.poolAddress;
  }

  // Helper function to get the pool address from the bribe voting reward address
  function getPoolAddressByGaugeAddress(
    gaugeAddress: string
  ): string | undefined {
    return guageToPoolMapping[gaugeAddress.toLowerCase()];
  }

  // Helper function to get the pool address from the gauge address
  function getPoolAddressByBribeVotingRewardAddress(
    bribeVotingRewardAddress: string
  ): string | null {
    return bribeVotingToPoolMapping[bribeVotingRewardAddress.toLowerCase()];
  }

  return { getPoolAddressByGaugeAddress, getPoolAddressByBribeVotingRewardAddress, addRewardAddressDetails };
}
