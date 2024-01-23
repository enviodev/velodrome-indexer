export let whitelistedPoolIds: string[] = [];

type poolRewardAddressMapping = {
    poolAddress: string;
    gaugeAddress: string;
    bribeVotingRewardAddress: string;
    feeVotingRewardAddress: string;
}

export let poolRewardAddressStore: poolRewardAddressMapping[] = [];

export function getPoolAddressByGaugeAddress(gaugeAddress: string): string | null {
    const mapping = poolRewardAddressStore.find(mapping => mapping.gaugeAddress === gaugeAddress);
    return mapping ? mapping.poolAddress : null;
}