type ChainId = number;
export class ChainCacheMap<Cache, T, Args> {
  cacheMap: Map<ChainId, Cache>;
  asyncPromises: Map<string, Promise<T>>;
  makeCache;
  getFromCache;
  setToCache;
  fetchValue;
  argsToString;

  constructor(deps: {
    make: (chainId: ChainId) => Cache;
    get: (cache: Cache, key: string) => T | undefined;
    set: (cache: Cache, key: string, value: T) => void;
    fetchValue: (args: Args) => Promise<T>;
    argsToCacheKey: (args: Args) => string;
  }) {
    this.cacheMap = new Map();
    this.asyncPromises = new Map();
    this.makeCache = deps.make;
    this.getFromCache = deps.get;
    this.setToCache = deps.set;
    this.fetchValue = deps.fetchValue;
    this.argsToString = deps.argsToCacheKey;
  }

  async get(chainId: ChainId, args: Args): Promise<T> {
    let key = this.argsToString(args);
    let cache: Cache;
    if (this.cacheMap.has(chainId)) {
      cache = this.cacheMap.get(chainId)!;
    } else {
      cache = this.makeCache(chainId);
      this.cacheMap.set(chainId, cache);
    }

    let value: T;
    let lookupVal = this.getFromCache(cache, key);

    if (lookupVal) {
      value = lookupVal;
    } else {
      let prom: Promise<T>;
      let lookupPromise = this.asyncPromises.get(key);
      if (lookupPromise) {
        prom = lookupPromise;
      } else {
        prom = this.fetchValue(args);
        this.asyncPromises.set(key, prom);
        prom.finally(() => this.asyncPromises.delete(key));
      }
      value = await prom;
    }

    return value;
  }
}
