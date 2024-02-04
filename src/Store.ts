import { poolRewardAddressMapping } from "./CustomTypes";
import { Cache, Entry, ShapeGuageToPool, ShapeBribeToPool } from './cache';
import { CacheCategory } from './Constants';

// Object to store all the pool addresses with whitelist tokens
export let whitelistedPoolIds: string[] = [];

// Object to store all the pool addresses with reward contract addresses
export let poolRewardAddressStoreOld: poolRewardAddressMapping[] = [];

export const poolRewardAddressStoreManager = () => {
  /*
  NOTE: here the cache is to make sure this code is restart resistant, it is not for performance optimization (actually the cache will have a negative impact on performance)
  */
  const cacheMap = new Map<string | number | bigint, { gaugeToPoolCache: Entry<ShapeGuageToPool>; bribeVotingToPoolCache: any }>();

  const getCache = (chainId: string | number | bigint): {
    gaugeToPoolCache: Entry<ShapeGuageToPool>,
    bribeVotingToPoolCache: Entry<ShapeGuageToPool>,
  } => {
    const cache = cacheMap.get(chainId);
    if (!cache) {
      const gaugeToPoolCache = Cache.init(CacheCategory.GuageToPool, chainId);
      const bribeVotingToPoolCache = Cache.init(CacheCategory.BribeToPool, chainId);
      cacheMap.set(chainId, { gaugeToPoolCache, bribeVotingToPoolCache });
      return { gaugeToPoolCache, bribeVotingToPoolCache };
    } else {
      return cache;
    }
  };

  let addRewardAddressDetails = (chainId: string | number | bigint, details: poolRewardAddressMapping) => {
    const { gaugeToPoolCache, bribeVotingToPoolCache } = getCache(chainId);
    gaugeToPoolCache.add({ [details.gaugeAddress.toLowerCase()]: { poolAddress: details.poolAddress } });
    bribeVotingToPoolCache.add({ [details.bribeVotingRewardAddress.toLowerCase()]: { poolAddress: details.poolAddress } });
  };

  function getPoolAddressByGaugeAddress(chainId: string | number | bigint, gaugeAddress: string): string | undefined {
    const { gaugeToPoolCache } = getCache(chainId);
    const result = gaugeToPoolCache.read(gaugeAddress.toLowerCase());
    return result ? result.poolAddress : undefined;
  }

  function getPoolAddressByBribeVotingRewardAddress(chainId: string | number | bigint, bribeVotingRewardAddress: string): string | null {
    const { bribeVotingToPoolCache } = getCache(chainId);
    const result = bribeVotingToPoolCache.read(bribeVotingRewardAddress.toLowerCase());
    return result ? result.poolAddress : null;
  }

  return { getPoolAddressByGaugeAddress, getPoolAddressByBribeVotingRewardAddress, addRewardAddressDetails };
};
