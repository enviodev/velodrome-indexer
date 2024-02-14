import { poolRewardAddressMapping } from "./CustomTypes";
import {
  Cache,
  Entry,
  ShapeGuageToPool,
  ShapeBribeToPool,
  ShapeWhiteListedPoolIds,
  ShapePoolToTokens,
} from "./cache";
import { CacheCategory } from "./Constants";
import { Address } from "web3";

export const whitelistedPoolIdsManager = () => {
  /*
  NOTE: here the cache is to make sure this code is restart resistant, it is not for performance optimization (actually the cache will have a negative impact on performance)
  */
  type lookups = {
    whiteListedPoolIdsCache: Entry<ShapeWhiteListedPoolIds>;
    poolToTokensCache: Entry<ShapePoolToTokens>;
  };
  const cacheMap = new Map<string | number | bigint, lookups>();

  const getCache = (chainId: string | number | bigint): lookups => {
    const cache = cacheMap.get(chainId);
    if (!cache) {
      const cache = {
        whiteListedPoolIdsCache: Cache.init(
          CacheCategory.WhitelistedPoolIds,
          chainId
        ),
        poolToTokensCache: Cache.init(CacheCategory.PoolToTokens, chainId),
      };
      cacheMap.set(chainId, cache);
      return cache;
    } else {
      return cache;
    }
  };

  // TODO: change so whitelistedpoolsids cache only stores releveant pool ids.
  // It will only price against whitelisted tokens so only those are relevant to add.
  const addWhitelistedPoolId = (
    chainId: string | number | bigint,
    token0: Address,
    token1: Address,
    poolId: string
  ) => {
    const { whiteListedPoolIdsCache, poolToTokensCache } = getCache(chainId);

    // Read the existing array or initialize it as an empty array if undefined
    const poolIdsWithWhitelistedTokens0: string[] =
      whiteListedPoolIdsCache.read(token0.toLowerCase())
        ?.poolIdsWithWhitelistedTokens || [];
    // Push the poolId to the array if it isn't already present
    if (!poolIdsWithWhitelistedTokens0.includes(poolId)) {
      poolIdsWithWhitelistedTokens0.push(poolId);
      // Assuming you have a way to write/update the cache for token0
      whiteListedPoolIdsCache.add({
        [token0.toLowerCase()]: {
          poolIdsWithWhitelistedTokens: poolIdsWithWhitelistedTokens0,
        },
      });
    }

    // Repeat the process for token1
    const poolIdsWithWhitelistedTokens1: string[] =
      whiteListedPoolIdsCache.read(token1.toLowerCase())
        ?.poolIdsWithWhitelistedTokens || [];
    if (!poolIdsWithWhitelistedTokens1.includes(poolId)) {
      poolIdsWithWhitelistedTokens1.push(poolId);
      // Assuming you have a way to write/update the cache for token1
      whiteListedPoolIdsCache.add({
        [token1.toLowerCase()]: {
          poolIdsWithWhitelistedTokens: poolIdsWithWhitelistedTokens1,
        },
      });
    }

    poolToTokensCache.add({ [poolId.toLowerCase()]: { token0, token1 } });
  };

  const getWhitelistedPoolIds = (
    chainId: string | number | bigint,
    token: Address
  ): string[] => {
    const cache = getCache(chainId).whiteListedPoolIdsCache;
    return cache.read(token.toLowerCase())?.poolIdsWithWhitelistedTokens || [];
  };

  // Returns undefined currently for pools that aren't 'whitelisted'
  const getTokensFromWhitelistedPool = (
    chainId: string | number | bigint,
    poolId: string
  ): { token0: string; token1: string } | undefined => {
    const cache = getCache(chainId).poolToTokensCache;
    return cache.read(poolId.toLowerCase());
  };

  return {
    addWhitelistedPoolId,
    getWhitelistedPoolIds,
    getTokensFromWhitelistedPool,
  };
};

export const poolLookupStoreManager = () => {
  /*
  NOTE: here the cache is to make sure this code is restart resistant, it is not for performance optimization (actually the cache will have a negative impact on performance)
  */
  type lookups = {
    gaugeToPoolCache: Entry<ShapeGuageToPool>;
    bribeVotingToPoolCache: Entry<ShapeBribeToPool>;
  };
  const cacheMap = new Map<string | number | bigint, lookups>();

  const getCache = (chainId: string | number | bigint): lookups => {
    const cache = cacheMap.get(chainId);
    if (!cache) {
      const newCache = {
        gaugeToPoolCache: Cache.init(CacheCategory.GuageToPool, chainId),
        bribeVotingToPoolCache: Cache.init(CacheCategory.BribeToPool, chainId),
      };
      cacheMap.set(chainId, newCache);
      return newCache;
    } else {
      return cache;
    }
  };

  const addRewardAddressDetails = (
    chainId: string | number | bigint,
    details: poolRewardAddressMapping
  ) => {
    const { gaugeToPoolCache, bribeVotingToPoolCache } = getCache(chainId);
    gaugeToPoolCache.add({
      [details.gaugeAddress.toLowerCase()]: {
        poolAddress: details.poolAddress,
      },
    });
    bribeVotingToPoolCache.add({
      [details.bribeVotingRewardAddress.toLowerCase()]: {
        poolAddress: details.poolAddress,
      },
    });
  };

  const getPoolAddressByGaugeAddress = (
    chainId: string | number | bigint,
    gaugeAddress: string
  ): string | undefined => {
    const { gaugeToPoolCache } = getCache(chainId);
    const result = gaugeToPoolCache.read(gaugeAddress.toLowerCase());
    return result ? result.poolAddress : undefined;
  };

  const getPoolAddressByBribeVotingRewardAddress = (
    chainId: string | number | bigint,
    bribeVotingRewardAddress: string
  ): string | undefined => {
    const { bribeVotingToPoolCache } = getCache(chainId);
    const result = bribeVotingToPoolCache.read(
      bribeVotingRewardAddress.toLowerCase()
    );
    return result ? result.poolAddress : undefined;
  };

  return {
    getPoolAddressByBribeVotingRewardAddress,
    getPoolAddressByGaugeAddress,
    addRewardAddressDetails,
  };
};
