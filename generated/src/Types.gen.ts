/* TypeScript file generated from Types.res by genType. */
/* eslint-disable import/first */


import type {BigInt_t as Ethers_BigInt_t} from '../src/bindings/Ethers.gen';

import type {Json_t as Js_Json_t} from '../src/Js.shim';

import type {Nullable as $$nullable} from './bindings/OpaqueTypes';

import type {ethAddress as Ethers_ethAddress} from '../src/bindings/Ethers.gen';

import type {userLogger as Logs_userLogger} from './Logs.gen';

// tslint:disable-next-line:interface-over-type-literal
export type id = string;
export type Id = id;

// tslint:disable-next-line:interface-over-type-literal
export type nullable<a> = $$nullable<a>;

// tslint:disable-next-line:interface-over-type-literal
export type gaugeLoaderConfig = { readonly loadPool?: liquidityPoolLoaderConfig };

// tslint:disable-next-line:interface-over-type-literal
export type latestETHPriceLoaderConfig = boolean;

// tslint:disable-next-line:interface-over-type-literal
export type liquidityPoolLoaderConfig = { readonly loadToken0?: tokenLoaderConfig; readonly loadToken1?: tokenLoaderConfig };

// tslint:disable-next-line:interface-over-type-literal
export type liquidityPoolUserMappingLoaderConfig = { readonly loadLiquidityPool?: liquidityPoolLoaderConfig; readonly loadUser?: userLoaderConfig };

// tslint:disable-next-line:interface-over-type-literal
export type stateStoreLoaderConfig = { readonly loadLatestEthPrice?: latestETHPriceLoaderConfig };

// tslint:disable-next-line:interface-over-type-literal
export type tokenLoaderConfig = boolean;

// tslint:disable-next-line:interface-over-type-literal
export type userLoaderConfig = boolean;

// tslint:disable-next-line:interface-over-type-literal
export type entityRead = 
    { tag: "GaugeRead"; value: [id, gaugeLoaderConfig] }
  | { tag: "LatestETHPriceRead"; value: id }
  | { tag: "LiquidityPoolRead"; value: [id, liquidityPoolLoaderConfig] }
  | { tag: "LiquidityPoolDailySnapshotRead"; value: id }
  | { tag: "LiquidityPoolHourlySnapshotRead"; value: id }
  | { tag: "LiquidityPoolUserMappingRead"; value: [id, liquidityPoolUserMappingLoaderConfig] }
  | { tag: "LiquidityPoolWeeklySnapshotRead"; value: id }
  | { tag: "StateStoreRead"; value: [id, stateStoreLoaderConfig] }
  | { tag: "TokenRead"; value: id }
  | { tag: "TokenDailySnapshotRead"; value: id }
  | { tag: "TokenHourlySnapshotRead"; value: id }
  | { tag: "TokenWeeklySnapshotRead"; value: id }
  | { tag: "UserRead"; value: id };

// tslint:disable-next-line:interface-over-type-literal
export type rawEventsEntity = {
  readonly chain_id: number; 
  readonly event_id: string; 
  readonly block_number: number; 
  readonly log_index: number; 
  readonly transaction_index: number; 
  readonly transaction_hash: string; 
  readonly src_address: Ethers_ethAddress; 
  readonly block_hash: string; 
  readonly block_timestamp: number; 
  readonly event_type: Js_Json_t; 
  readonly params: string
};

// tslint:disable-next-line:interface-over-type-literal
export type dynamicContractRegistryEntity = {
  readonly chain_id: number; 
  readonly event_id: Ethers_BigInt_t; 
  readonly contract_address: Ethers_ethAddress; 
  readonly contract_type: string
};

// tslint:disable-next-line:interface-over-type-literal
export type gaugeEntity = {
  readonly id: id; 
  readonly chainID: Ethers_BigInt_t; 
  readonly pool: id; 
  readonly totalEmissions: Ethers_BigInt_t; 
  readonly totalEmissionsUSD: Ethers_BigInt_t; 
  readonly lastUpdatedTimestamp: Ethers_BigInt_t
};
export type GaugeEntity = gaugeEntity;

// tslint:disable-next-line:interface-over-type-literal
export type latestETHPriceEntity = { readonly id: id; readonly price: Ethers_BigInt_t };
export type LatestETHPriceEntity = latestETHPriceEntity;

// tslint:disable-next-line:interface-over-type-literal
export type liquidityPoolEntity = {
  readonly id: id; 
  readonly chainID: Ethers_BigInt_t; 
  readonly token0: id; 
  readonly token1: id; 
  readonly isStable: boolean; 
  readonly reserve0: Ethers_BigInt_t; 
  readonly reserve1: Ethers_BigInt_t; 
  readonly totalLiquidityETH: Ethers_BigInt_t; 
  readonly totalLiquidityUSD: Ethers_BigInt_t; 
  readonly totalVolume0: Ethers_BigInt_t; 
  readonly totalVolume1: Ethers_BigInt_t; 
  readonly totalVolumeUSD: Ethers_BigInt_t; 
  readonly totalFees0: Ethers_BigInt_t; 
  readonly totalFees1: Ethers_BigInt_t; 
  readonly totalFeesUSD: Ethers_BigInt_t; 
  readonly numberOfSwaps: Ethers_BigInt_t; 
  readonly token0Price: Ethers_BigInt_t; 
  readonly token1Price: Ethers_BigInt_t; 
  readonly lastUpdatedTimestamp: Ethers_BigInt_t
};
export type LiquidityPoolEntity = liquidityPoolEntity;

// tslint:disable-next-line:interface-over-type-literal
export type liquidityPoolDailySnapshotEntity = {
  readonly id: id; 
  readonly chainID: Ethers_BigInt_t; 
  readonly pool: string; 
  readonly reserve0: Ethers_BigInt_t; 
  readonly reserve1: Ethers_BigInt_t; 
  readonly totalLiquidityETH: Ethers_BigInt_t; 
  readonly totalLiquidityUSD: Ethers_BigInt_t; 
  readonly totalVolume0: Ethers_BigInt_t; 
  readonly totalVolume1: Ethers_BigInt_t; 
  readonly totalVolumeUSD: Ethers_BigInt_t; 
  readonly totalFees0: Ethers_BigInt_t; 
  readonly totalFees1: Ethers_BigInt_t; 
  readonly totalFeesUSD: Ethers_BigInt_t; 
  readonly numberOfSwaps: Ethers_BigInt_t; 
  readonly token0Price: Ethers_BigInt_t; 
  readonly token1Price: Ethers_BigInt_t; 
  readonly lastUpdatedTimestamp: Ethers_BigInt_t
};
export type LiquidityPoolDailySnapshotEntity = liquidityPoolDailySnapshotEntity;

// tslint:disable-next-line:interface-over-type-literal
export type liquidityPoolHourlySnapshotEntity = {
  readonly id: id; 
  readonly chainID: Ethers_BigInt_t; 
  readonly pool: string; 
  readonly reserve0: Ethers_BigInt_t; 
  readonly reserve1: Ethers_BigInt_t; 
  readonly totalLiquidityETH: Ethers_BigInt_t; 
  readonly totalLiquidityUSD: Ethers_BigInt_t; 
  readonly totalVolume0: Ethers_BigInt_t; 
  readonly totalVolume1: Ethers_BigInt_t; 
  readonly totalVolumeUSD: Ethers_BigInt_t; 
  readonly totalFees0: Ethers_BigInt_t; 
  readonly totalFees1: Ethers_BigInt_t; 
  readonly totalFeesUSD: Ethers_BigInt_t; 
  readonly numberOfSwaps: Ethers_BigInt_t; 
  readonly token0Price: Ethers_BigInt_t; 
  readonly token1Price: Ethers_BigInt_t; 
  readonly lastUpdatedTimestamp: Ethers_BigInt_t
};
export type LiquidityPoolHourlySnapshotEntity = liquidityPoolHourlySnapshotEntity;

// tslint:disable-next-line:interface-over-type-literal
export type liquidityPoolUserMappingEntity = {
  readonly id: id; 
  readonly liquidityPool: id; 
  readonly user: id
};
export type LiquidityPoolUserMappingEntity = liquidityPoolUserMappingEntity;

// tslint:disable-next-line:interface-over-type-literal
export type liquidityPoolWeeklySnapshotEntity = {
  readonly id: id; 
  readonly chainID: Ethers_BigInt_t; 
  readonly pool: string; 
  readonly reserve0: Ethers_BigInt_t; 
  readonly reserve1: Ethers_BigInt_t; 
  readonly totalLiquidityETH: Ethers_BigInt_t; 
  readonly totalLiquidityUSD: Ethers_BigInt_t; 
  readonly totalVolume0: Ethers_BigInt_t; 
  readonly totalVolume1: Ethers_BigInt_t; 
  readonly totalVolumeUSD: Ethers_BigInt_t; 
  readonly totalFees0: Ethers_BigInt_t; 
  readonly totalFees1: Ethers_BigInt_t; 
  readonly totalFeesUSD: Ethers_BigInt_t; 
  readonly numberOfSwaps: Ethers_BigInt_t; 
  readonly token0Price: Ethers_BigInt_t; 
  readonly token1Price: Ethers_BigInt_t; 
  readonly lastUpdatedTimestamp: Ethers_BigInt_t
};
export type LiquidityPoolWeeklySnapshotEntity = liquidityPoolWeeklySnapshotEntity;

// tslint:disable-next-line:interface-over-type-literal
export type stateStoreEntity = { readonly id: id; readonly latestEthPrice: id };
export type StateStoreEntity = stateStoreEntity;

// tslint:disable-next-line:interface-over-type-literal
export type tokenEntity = {
  readonly id: id; 
  readonly chainID: Ethers_BigInt_t; 
  readonly pricePerETH: Ethers_BigInt_t; 
  readonly pricePerUSD: Ethers_BigInt_t; 
  readonly lastUpdatedTimestamp: Ethers_BigInt_t
};
export type TokenEntity = tokenEntity;

// tslint:disable-next-line:interface-over-type-literal
export type tokenDailySnapshotEntity = {
  readonly id: id; 
  readonly chainID: Ethers_BigInt_t; 
  readonly token: string; 
  readonly pricePerETH: Ethers_BigInt_t; 
  readonly pricePerUSD: Ethers_BigInt_t; 
  readonly lastUpdatedTimestamp: Ethers_BigInt_t
};
export type TokenDailySnapshotEntity = tokenDailySnapshotEntity;

// tslint:disable-next-line:interface-over-type-literal
export type tokenHourlySnapshotEntity = {
  readonly id: id; 
  readonly chainID: Ethers_BigInt_t; 
  readonly token: string; 
  readonly pricePerETH: Ethers_BigInt_t; 
  readonly pricePerUSD: Ethers_BigInt_t; 
  readonly lastUpdatedTimestamp: Ethers_BigInt_t
};
export type TokenHourlySnapshotEntity = tokenHourlySnapshotEntity;

// tslint:disable-next-line:interface-over-type-literal
export type tokenWeeklySnapshotEntity = {
  readonly id: id; 
  readonly chainID: Ethers_BigInt_t; 
  readonly token: string; 
  readonly pricePerETH: Ethers_BigInt_t; 
  readonly pricePerUSD: Ethers_BigInt_t; 
  readonly lastUpdatedTimestamp: Ethers_BigInt_t
};
export type TokenWeeklySnapshotEntity = tokenWeeklySnapshotEntity;

// tslint:disable-next-line:interface-over-type-literal
export type userEntity = {
  readonly id: id; 
  readonly numberOfSwaps: Ethers_BigInt_t; 
  readonly totalSwapVolumeUSD: Ethers_BigInt_t; 
  readonly lastUpdatedTimestamp: Ethers_BigInt_t
};
export type UserEntity = userEntity;

// tslint:disable-next-line:interface-over-type-literal
export type dbOp = "Read" | "Set" | "Delete";

// tslint:disable-next-line:interface-over-type-literal
export type inMemoryStoreRow<a> = { readonly dbOp: dbOp; readonly entity: a };

// tslint:disable-next-line:interface-over-type-literal
export type eventLog<a> = {
  readonly params: a; 
  readonly chainId: number; 
  readonly blockNumber: number; 
  readonly blockTimestamp: number; 
  readonly blockHash: string; 
  readonly srcAddress: Ethers_ethAddress; 
  readonly transactionHash: string; 
  readonly transactionIndex: number; 
  readonly logIndex: number
};
export type EventLog<a> = eventLog<a>;

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_FeesEvent_eventArgs = {
  readonly sender: Ethers_ethAddress; 
  readonly amount0: Ethers_BigInt_t; 
  readonly amount1: Ethers_BigInt_t
};

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_FeesEvent_log = eventLog<PoolContract_FeesEvent_eventArgs>;
export type PoolContract_Fees_EventLog = PoolContract_FeesEvent_log;

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_FeesEvent_gaugeEntityHandlerContext = {
  readonly getPool: (_1:gaugeEntity) => liquidityPoolEntity; 
  readonly set: (_1:gaugeEntity) => void; 
  readonly delete: (_1:id) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_FeesEvent_gaugeEntityHandlerContextAsync = {
  readonly getPool: (_1:gaugeEntity) => Promise<liquidityPoolEntity>; 
  readonly set: (_1:gaugeEntity) => void; 
  readonly delete: (_1:id) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_FeesEvent_latestETHPriceEntityHandlerContext = { readonly set: (_1:latestETHPriceEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_FeesEvent_latestETHPriceEntityHandlerContextAsync = { readonly set: (_1:latestETHPriceEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_FeesEvent_liquidityPoolEntityHandlerContext = {
  readonly get: (_1:id) => (undefined | liquidityPoolEntity); 
  readonly getToken0: (_1:liquidityPoolEntity) => tokenEntity; 
  readonly getToken1: (_1:liquidityPoolEntity) => tokenEntity; 
  readonly set: (_1:liquidityPoolEntity) => void; 
  readonly delete: (_1:id) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_FeesEvent_liquidityPoolEntityHandlerContextAsync = {
  readonly get: (_1:id) => Promise<(undefined | liquidityPoolEntity)>; 
  readonly getToken0: (_1:liquidityPoolEntity) => Promise<tokenEntity>; 
  readonly getToken1: (_1:liquidityPoolEntity) => Promise<tokenEntity>; 
  readonly set: (_1:liquidityPoolEntity) => void; 
  readonly delete: (_1:id) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_FeesEvent_liquidityPoolDailySnapshotEntityHandlerContext = { readonly set: (_1:liquidityPoolDailySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_FeesEvent_liquidityPoolDailySnapshotEntityHandlerContextAsync = { readonly set: (_1:liquidityPoolDailySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_FeesEvent_liquidityPoolHourlySnapshotEntityHandlerContext = { readonly set: (_1:liquidityPoolHourlySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_FeesEvent_liquidityPoolHourlySnapshotEntityHandlerContextAsync = { readonly set: (_1:liquidityPoolHourlySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_FeesEvent_liquidityPoolUserMappingEntityHandlerContext = {
  readonly getLiquidityPool: (_1:liquidityPoolUserMappingEntity) => liquidityPoolEntity; 
  readonly getUser: (_1:liquidityPoolUserMappingEntity) => userEntity; 
  readonly set: (_1:liquidityPoolUserMappingEntity) => void; 
  readonly delete: (_1:id) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_FeesEvent_liquidityPoolUserMappingEntityHandlerContextAsync = {
  readonly getLiquidityPool: (_1:liquidityPoolUserMappingEntity) => Promise<liquidityPoolEntity>; 
  readonly getUser: (_1:liquidityPoolUserMappingEntity) => Promise<userEntity>; 
  readonly set: (_1:liquidityPoolUserMappingEntity) => void; 
  readonly delete: (_1:id) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_FeesEvent_liquidityPoolWeeklySnapshotEntityHandlerContext = { readonly set: (_1:liquidityPoolWeeklySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_FeesEvent_liquidityPoolWeeklySnapshotEntityHandlerContextAsync = { readonly set: (_1:liquidityPoolWeeklySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_FeesEvent_stateStoreEntityHandlerContext = {
  readonly getLatestEthPrice: (_1:stateStoreEntity) => latestETHPriceEntity; 
  readonly set: (_1:stateStoreEntity) => void; 
  readonly delete: (_1:id) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_FeesEvent_stateStoreEntityHandlerContextAsync = {
  readonly getLatestEthPrice: (_1:stateStoreEntity) => Promise<latestETHPriceEntity>; 
  readonly set: (_1:stateStoreEntity) => void; 
  readonly delete: (_1:id) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_FeesEvent_tokenEntityHandlerContext = { readonly set: (_1:tokenEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_FeesEvent_tokenEntityHandlerContextAsync = { readonly set: (_1:tokenEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_FeesEvent_tokenDailySnapshotEntityHandlerContext = { readonly set: (_1:tokenDailySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_FeesEvent_tokenDailySnapshotEntityHandlerContextAsync = { readonly set: (_1:tokenDailySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_FeesEvent_tokenHourlySnapshotEntityHandlerContext = { readonly set: (_1:tokenHourlySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_FeesEvent_tokenHourlySnapshotEntityHandlerContextAsync = { readonly set: (_1:tokenHourlySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_FeesEvent_tokenWeeklySnapshotEntityHandlerContext = { readonly set: (_1:tokenWeeklySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_FeesEvent_tokenWeeklySnapshotEntityHandlerContextAsync = { readonly set: (_1:tokenWeeklySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_FeesEvent_userEntityHandlerContext = { readonly set: (_1:userEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_FeesEvent_userEntityHandlerContextAsync = { readonly set: (_1:userEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_FeesEvent_handlerContext = {
  readonly log: Logs_userLogger; 
  readonly Gauge: PoolContract_FeesEvent_gaugeEntityHandlerContext; 
  readonly LatestETHPrice: PoolContract_FeesEvent_latestETHPriceEntityHandlerContext; 
  readonly LiquidityPool: PoolContract_FeesEvent_liquidityPoolEntityHandlerContext; 
  readonly LiquidityPoolDailySnapshot: PoolContract_FeesEvent_liquidityPoolDailySnapshotEntityHandlerContext; 
  readonly LiquidityPoolHourlySnapshot: PoolContract_FeesEvent_liquidityPoolHourlySnapshotEntityHandlerContext; 
  readonly LiquidityPoolUserMapping: PoolContract_FeesEvent_liquidityPoolUserMappingEntityHandlerContext; 
  readonly LiquidityPoolWeeklySnapshot: PoolContract_FeesEvent_liquidityPoolWeeklySnapshotEntityHandlerContext; 
  readonly StateStore: PoolContract_FeesEvent_stateStoreEntityHandlerContext; 
  readonly Token: PoolContract_FeesEvent_tokenEntityHandlerContext; 
  readonly TokenDailySnapshot: PoolContract_FeesEvent_tokenDailySnapshotEntityHandlerContext; 
  readonly TokenHourlySnapshot: PoolContract_FeesEvent_tokenHourlySnapshotEntityHandlerContext; 
  readonly TokenWeeklySnapshot: PoolContract_FeesEvent_tokenWeeklySnapshotEntityHandlerContext; 
  readonly User: PoolContract_FeesEvent_userEntityHandlerContext
};

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_FeesEvent_handlerContextAsync = {
  readonly log: Logs_userLogger; 
  readonly Gauge: PoolContract_FeesEvent_gaugeEntityHandlerContextAsync; 
  readonly LatestETHPrice: PoolContract_FeesEvent_latestETHPriceEntityHandlerContextAsync; 
  readonly LiquidityPool: PoolContract_FeesEvent_liquidityPoolEntityHandlerContextAsync; 
  readonly LiquidityPoolDailySnapshot: PoolContract_FeesEvent_liquidityPoolDailySnapshotEntityHandlerContextAsync; 
  readonly LiquidityPoolHourlySnapshot: PoolContract_FeesEvent_liquidityPoolHourlySnapshotEntityHandlerContextAsync; 
  readonly LiquidityPoolUserMapping: PoolContract_FeesEvent_liquidityPoolUserMappingEntityHandlerContextAsync; 
  readonly LiquidityPoolWeeklySnapshot: PoolContract_FeesEvent_liquidityPoolWeeklySnapshotEntityHandlerContextAsync; 
  readonly StateStore: PoolContract_FeesEvent_stateStoreEntityHandlerContextAsync; 
  readonly Token: PoolContract_FeesEvent_tokenEntityHandlerContextAsync; 
  readonly TokenDailySnapshot: PoolContract_FeesEvent_tokenDailySnapshotEntityHandlerContextAsync; 
  readonly TokenHourlySnapshot: PoolContract_FeesEvent_tokenHourlySnapshotEntityHandlerContextAsync; 
  readonly TokenWeeklySnapshot: PoolContract_FeesEvent_tokenWeeklySnapshotEntityHandlerContextAsync; 
  readonly User: PoolContract_FeesEvent_userEntityHandlerContextAsync
};

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_FeesEvent_liquidityPoolEntityLoaderContext = { readonly load: (_1:id, _2:{ readonly loaders?: liquidityPoolLoaderConfig }) => void };

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_FeesEvent_contractRegistrations = {
  readonly addPool: (_1:Ethers_ethAddress) => void; 
  readonly addPoolFactory: (_1:Ethers_ethAddress) => void; 
  readonly addVoter: (_1:Ethers_ethAddress) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_FeesEvent_loaderContext = {
  readonly log: Logs_userLogger; 
  readonly contractRegistration: PoolContract_FeesEvent_contractRegistrations; 
  readonly LiquidityPool: PoolContract_FeesEvent_liquidityPoolEntityLoaderContext
};

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_SwapEvent_eventArgs = {
  readonly sender: Ethers_ethAddress; 
  readonly to: Ethers_ethAddress; 
  readonly amount0In: Ethers_BigInt_t; 
  readonly amount1In: Ethers_BigInt_t; 
  readonly amount0Out: Ethers_BigInt_t; 
  readonly amount1Out: Ethers_BigInt_t
};

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_SwapEvent_log = eventLog<PoolContract_SwapEvent_eventArgs>;
export type PoolContract_Swap_EventLog = PoolContract_SwapEvent_log;

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_SwapEvent_gaugeEntityHandlerContext = {
  readonly getPool: (_1:gaugeEntity) => liquidityPoolEntity; 
  readonly set: (_1:gaugeEntity) => void; 
  readonly delete: (_1:id) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_SwapEvent_gaugeEntityHandlerContextAsync = {
  readonly getPool: (_1:gaugeEntity) => Promise<liquidityPoolEntity>; 
  readonly set: (_1:gaugeEntity) => void; 
  readonly delete: (_1:id) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_SwapEvent_latestETHPriceEntityHandlerContext = { readonly set: (_1:latestETHPriceEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_SwapEvent_latestETHPriceEntityHandlerContextAsync = { readonly set: (_1:latestETHPriceEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_SwapEvent_liquidityPoolEntityHandlerContext = {
  readonly get: (_1:id) => (undefined | liquidityPoolEntity); 
  readonly getToken0: (_1:liquidityPoolEntity) => tokenEntity; 
  readonly getToken1: (_1:liquidityPoolEntity) => tokenEntity; 
  readonly set: (_1:liquidityPoolEntity) => void; 
  readonly delete: (_1:id) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_SwapEvent_liquidityPoolEntityHandlerContextAsync = {
  readonly get: (_1:id) => Promise<(undefined | liquidityPoolEntity)>; 
  readonly getToken0: (_1:liquidityPoolEntity) => Promise<tokenEntity>; 
  readonly getToken1: (_1:liquidityPoolEntity) => Promise<tokenEntity>; 
  readonly set: (_1:liquidityPoolEntity) => void; 
  readonly delete: (_1:id) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_SwapEvent_liquidityPoolDailySnapshotEntityHandlerContext = { readonly set: (_1:liquidityPoolDailySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_SwapEvent_liquidityPoolDailySnapshotEntityHandlerContextAsync = { readonly set: (_1:liquidityPoolDailySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_SwapEvent_liquidityPoolHourlySnapshotEntityHandlerContext = { readonly set: (_1:liquidityPoolHourlySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_SwapEvent_liquidityPoolHourlySnapshotEntityHandlerContextAsync = { readonly set: (_1:liquidityPoolHourlySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_SwapEvent_liquidityPoolUserMappingEntityHandlerContext = {
  readonly get: (_1:id) => (undefined | liquidityPoolUserMappingEntity); 
  readonly getLiquidityPool: (_1:liquidityPoolUserMappingEntity) => liquidityPoolEntity; 
  readonly getUser: (_1:liquidityPoolUserMappingEntity) => userEntity; 
  readonly set: (_1:liquidityPoolUserMappingEntity) => void; 
  readonly delete: (_1:id) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_SwapEvent_liquidityPoolUserMappingEntityHandlerContextAsync = {
  readonly get: (_1:id) => Promise<(undefined | liquidityPoolUserMappingEntity)>; 
  readonly getLiquidityPool: (_1:liquidityPoolUserMappingEntity) => Promise<liquidityPoolEntity>; 
  readonly getUser: (_1:liquidityPoolUserMappingEntity) => Promise<userEntity>; 
  readonly set: (_1:liquidityPoolUserMappingEntity) => void; 
  readonly delete: (_1:id) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_SwapEvent_liquidityPoolWeeklySnapshotEntityHandlerContext = { readonly set: (_1:liquidityPoolWeeklySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_SwapEvent_liquidityPoolWeeklySnapshotEntityHandlerContextAsync = { readonly set: (_1:liquidityPoolWeeklySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_SwapEvent_stateStoreEntityHandlerContext = {
  readonly getLatestEthPrice: (_1:stateStoreEntity) => latestETHPriceEntity; 
  readonly set: (_1:stateStoreEntity) => void; 
  readonly delete: (_1:id) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_SwapEvent_stateStoreEntityHandlerContextAsync = {
  readonly getLatestEthPrice: (_1:stateStoreEntity) => Promise<latestETHPriceEntity>; 
  readonly set: (_1:stateStoreEntity) => void; 
  readonly delete: (_1:id) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_SwapEvent_tokenEntityHandlerContext = { readonly set: (_1:tokenEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_SwapEvent_tokenEntityHandlerContextAsync = { readonly set: (_1:tokenEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_SwapEvent_tokenDailySnapshotEntityHandlerContext = { readonly set: (_1:tokenDailySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_SwapEvent_tokenDailySnapshotEntityHandlerContextAsync = { readonly set: (_1:tokenDailySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_SwapEvent_tokenHourlySnapshotEntityHandlerContext = { readonly set: (_1:tokenHourlySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_SwapEvent_tokenHourlySnapshotEntityHandlerContextAsync = { readonly set: (_1:tokenHourlySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_SwapEvent_tokenWeeklySnapshotEntityHandlerContext = { readonly set: (_1:tokenWeeklySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_SwapEvent_tokenWeeklySnapshotEntityHandlerContextAsync = { readonly set: (_1:tokenWeeklySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_SwapEvent_userEntityHandlerContext = {
  readonly user: (undefined | userEntity); 
  readonly get: (_1:id) => (undefined | userEntity); 
  readonly set: (_1:userEntity) => void; 
  readonly delete: (_1:id) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_SwapEvent_userEntityHandlerContextAsync = {
  readonly user: (undefined | userEntity); 
  readonly get: (_1:id) => Promise<(undefined | userEntity)>; 
  readonly set: (_1:userEntity) => void; 
  readonly delete: (_1:id) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_SwapEvent_handlerContext = {
  readonly log: Logs_userLogger; 
  readonly Gauge: PoolContract_SwapEvent_gaugeEntityHandlerContext; 
  readonly LatestETHPrice: PoolContract_SwapEvent_latestETHPriceEntityHandlerContext; 
  readonly LiquidityPool: PoolContract_SwapEvent_liquidityPoolEntityHandlerContext; 
  readonly LiquidityPoolDailySnapshot: PoolContract_SwapEvent_liquidityPoolDailySnapshotEntityHandlerContext; 
  readonly LiquidityPoolHourlySnapshot: PoolContract_SwapEvent_liquidityPoolHourlySnapshotEntityHandlerContext; 
  readonly LiquidityPoolUserMapping: PoolContract_SwapEvent_liquidityPoolUserMappingEntityHandlerContext; 
  readonly LiquidityPoolWeeklySnapshot: PoolContract_SwapEvent_liquidityPoolWeeklySnapshotEntityHandlerContext; 
  readonly StateStore: PoolContract_SwapEvent_stateStoreEntityHandlerContext; 
  readonly Token: PoolContract_SwapEvent_tokenEntityHandlerContext; 
  readonly TokenDailySnapshot: PoolContract_SwapEvent_tokenDailySnapshotEntityHandlerContext; 
  readonly TokenHourlySnapshot: PoolContract_SwapEvent_tokenHourlySnapshotEntityHandlerContext; 
  readonly TokenWeeklySnapshot: PoolContract_SwapEvent_tokenWeeklySnapshotEntityHandlerContext; 
  readonly User: PoolContract_SwapEvent_userEntityHandlerContext
};

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_SwapEvent_handlerContextAsync = {
  readonly log: Logs_userLogger; 
  readonly Gauge: PoolContract_SwapEvent_gaugeEntityHandlerContextAsync; 
  readonly LatestETHPrice: PoolContract_SwapEvent_latestETHPriceEntityHandlerContextAsync; 
  readonly LiquidityPool: PoolContract_SwapEvent_liquidityPoolEntityHandlerContextAsync; 
  readonly LiquidityPoolDailySnapshot: PoolContract_SwapEvent_liquidityPoolDailySnapshotEntityHandlerContextAsync; 
  readonly LiquidityPoolHourlySnapshot: PoolContract_SwapEvent_liquidityPoolHourlySnapshotEntityHandlerContextAsync; 
  readonly LiquidityPoolUserMapping: PoolContract_SwapEvent_liquidityPoolUserMappingEntityHandlerContextAsync; 
  readonly LiquidityPoolWeeklySnapshot: PoolContract_SwapEvent_liquidityPoolWeeklySnapshotEntityHandlerContextAsync; 
  readonly StateStore: PoolContract_SwapEvent_stateStoreEntityHandlerContextAsync; 
  readonly Token: PoolContract_SwapEvent_tokenEntityHandlerContextAsync; 
  readonly TokenDailySnapshot: PoolContract_SwapEvent_tokenDailySnapshotEntityHandlerContextAsync; 
  readonly TokenHourlySnapshot: PoolContract_SwapEvent_tokenHourlySnapshotEntityHandlerContextAsync; 
  readonly TokenWeeklySnapshot: PoolContract_SwapEvent_tokenWeeklySnapshotEntityHandlerContextAsync; 
  readonly User: PoolContract_SwapEvent_userEntityHandlerContextAsync
};

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_SwapEvent_liquidityPoolEntityLoaderContext = { readonly load: (_1:id, _2:{ readonly loaders?: liquidityPoolLoaderConfig }) => void };

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_SwapEvent_liquidityPoolUserMappingEntityLoaderContext = { readonly load: (_1:id, _2:{ readonly loaders?: liquidityPoolUserMappingLoaderConfig }) => void };

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_SwapEvent_userEntityLoaderContext = { readonly userLoad: (_1:id) => void; readonly load: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_SwapEvent_contractRegistrations = {
  readonly addPool: (_1:Ethers_ethAddress) => void; 
  readonly addPoolFactory: (_1:Ethers_ethAddress) => void; 
  readonly addVoter: (_1:Ethers_ethAddress) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_SwapEvent_loaderContext = {
  readonly log: Logs_userLogger; 
  readonly contractRegistration: PoolContract_SwapEvent_contractRegistrations; 
  readonly LiquidityPool: PoolContract_SwapEvent_liquidityPoolEntityLoaderContext; 
  readonly LiquidityPoolUserMapping: PoolContract_SwapEvent_liquidityPoolUserMappingEntityLoaderContext; 
  readonly User: PoolContract_SwapEvent_userEntityLoaderContext
};

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_SyncEvent_eventArgs = { readonly reserve0: Ethers_BigInt_t; readonly reserve1: Ethers_BigInt_t };

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_SyncEvent_log = eventLog<PoolContract_SyncEvent_eventArgs>;
export type PoolContract_Sync_EventLog = PoolContract_SyncEvent_log;

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_SyncEvent_gaugeEntityHandlerContext = {
  readonly getPool: (_1:gaugeEntity) => liquidityPoolEntity; 
  readonly set: (_1:gaugeEntity) => void; 
  readonly delete: (_1:id) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_SyncEvent_gaugeEntityHandlerContextAsync = {
  readonly getPool: (_1:gaugeEntity) => Promise<liquidityPoolEntity>; 
  readonly set: (_1:gaugeEntity) => void; 
  readonly delete: (_1:id) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_SyncEvent_latestETHPriceEntityHandlerContext = { readonly set: (_1:latestETHPriceEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_SyncEvent_latestETHPriceEntityHandlerContextAsync = { readonly set: (_1:latestETHPriceEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_SyncEvent_liquidityPoolEntityHandlerContext = {
  readonly singlePool: (undefined | liquidityPoolEntity); 
  readonly stablecoinPools: Array<(undefined | liquidityPoolEntity)>; 
  readonly whitelistedPools: Array<(undefined | liquidityPoolEntity)>; 
  readonly get: (_1:id) => (undefined | liquidityPoolEntity); 
  readonly getToken0: (_1:liquidityPoolEntity) => tokenEntity; 
  readonly getToken1: (_1:liquidityPoolEntity) => tokenEntity; 
  readonly set: (_1:liquidityPoolEntity) => void; 
  readonly delete: (_1:id) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_SyncEvent_liquidityPoolEntityHandlerContextAsync = {
  readonly singlePool: (undefined | liquidityPoolEntity); 
  readonly stablecoinPools: Array<(undefined | liquidityPoolEntity)>; 
  readonly whitelistedPools: Array<(undefined | liquidityPoolEntity)>; 
  readonly get: (_1:id) => Promise<(undefined | liquidityPoolEntity)>; 
  readonly getToken0: (_1:liquidityPoolEntity) => Promise<tokenEntity>; 
  readonly getToken1: (_1:liquidityPoolEntity) => Promise<tokenEntity>; 
  readonly set: (_1:liquidityPoolEntity) => void; 
  readonly delete: (_1:id) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_SyncEvent_liquidityPoolDailySnapshotEntityHandlerContext = { readonly set: (_1:liquidityPoolDailySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_SyncEvent_liquidityPoolDailySnapshotEntityHandlerContextAsync = { readonly set: (_1:liquidityPoolDailySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_SyncEvent_liquidityPoolHourlySnapshotEntityHandlerContext = { readonly set: (_1:liquidityPoolHourlySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_SyncEvent_liquidityPoolHourlySnapshotEntityHandlerContextAsync = { readonly set: (_1:liquidityPoolHourlySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_SyncEvent_liquidityPoolUserMappingEntityHandlerContext = {
  readonly getLiquidityPool: (_1:liquidityPoolUserMappingEntity) => liquidityPoolEntity; 
  readonly getUser: (_1:liquidityPoolUserMappingEntity) => userEntity; 
  readonly set: (_1:liquidityPoolUserMappingEntity) => void; 
  readonly delete: (_1:id) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_SyncEvent_liquidityPoolUserMappingEntityHandlerContextAsync = {
  readonly getLiquidityPool: (_1:liquidityPoolUserMappingEntity) => Promise<liquidityPoolEntity>; 
  readonly getUser: (_1:liquidityPoolUserMappingEntity) => Promise<userEntity>; 
  readonly set: (_1:liquidityPoolUserMappingEntity) => void; 
  readonly delete: (_1:id) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_SyncEvent_liquidityPoolWeeklySnapshotEntityHandlerContext = { readonly set: (_1:liquidityPoolWeeklySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_SyncEvent_liquidityPoolWeeklySnapshotEntityHandlerContextAsync = { readonly set: (_1:liquidityPoolWeeklySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_SyncEvent_stateStoreEntityHandlerContext = {
  readonly stateStore: (undefined | stateStoreEntity); 
  readonly get: (_1:id) => (undefined | stateStoreEntity); 
  readonly getLatestEthPrice: (_1:stateStoreEntity) => latestETHPriceEntity; 
  readonly set: (_1:stateStoreEntity) => void; 
  readonly delete: (_1:id) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_SyncEvent_stateStoreEntityHandlerContextAsync = {
  readonly stateStore: (undefined | stateStoreEntity); 
  readonly get: (_1:id) => Promise<(undefined | stateStoreEntity)>; 
  readonly getLatestEthPrice: (_1:stateStoreEntity) => Promise<latestETHPriceEntity>; 
  readonly set: (_1:stateStoreEntity) => void; 
  readonly delete: (_1:id) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_SyncEvent_tokenEntityHandlerContext = {
  readonly whitelistedTokens: Array<(undefined | tokenEntity)>; 
  readonly get: (_1:id) => (undefined | tokenEntity); 
  readonly set: (_1:tokenEntity) => void; 
  readonly delete: (_1:id) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_SyncEvent_tokenEntityHandlerContextAsync = {
  readonly whitelistedTokens: Array<(undefined | tokenEntity)>; 
  readonly get: (_1:id) => Promise<(undefined | tokenEntity)>; 
  readonly set: (_1:tokenEntity) => void; 
  readonly delete: (_1:id) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_SyncEvent_tokenDailySnapshotEntityHandlerContext = { readonly set: (_1:tokenDailySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_SyncEvent_tokenDailySnapshotEntityHandlerContextAsync = { readonly set: (_1:tokenDailySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_SyncEvent_tokenHourlySnapshotEntityHandlerContext = { readonly set: (_1:tokenHourlySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_SyncEvent_tokenHourlySnapshotEntityHandlerContextAsync = { readonly set: (_1:tokenHourlySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_SyncEvent_tokenWeeklySnapshotEntityHandlerContext = { readonly set: (_1:tokenWeeklySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_SyncEvent_tokenWeeklySnapshotEntityHandlerContextAsync = { readonly set: (_1:tokenWeeklySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_SyncEvent_userEntityHandlerContext = { readonly set: (_1:userEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_SyncEvent_userEntityHandlerContextAsync = { readonly set: (_1:userEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_SyncEvent_handlerContext = {
  readonly log: Logs_userLogger; 
  readonly Gauge: PoolContract_SyncEvent_gaugeEntityHandlerContext; 
  readonly LatestETHPrice: PoolContract_SyncEvent_latestETHPriceEntityHandlerContext; 
  readonly LiquidityPool: PoolContract_SyncEvent_liquidityPoolEntityHandlerContext; 
  readonly LiquidityPoolDailySnapshot: PoolContract_SyncEvent_liquidityPoolDailySnapshotEntityHandlerContext; 
  readonly LiquidityPoolHourlySnapshot: PoolContract_SyncEvent_liquidityPoolHourlySnapshotEntityHandlerContext; 
  readonly LiquidityPoolUserMapping: PoolContract_SyncEvent_liquidityPoolUserMappingEntityHandlerContext; 
  readonly LiquidityPoolWeeklySnapshot: PoolContract_SyncEvent_liquidityPoolWeeklySnapshotEntityHandlerContext; 
  readonly StateStore: PoolContract_SyncEvent_stateStoreEntityHandlerContext; 
  readonly Token: PoolContract_SyncEvent_tokenEntityHandlerContext; 
  readonly TokenDailySnapshot: PoolContract_SyncEvent_tokenDailySnapshotEntityHandlerContext; 
  readonly TokenHourlySnapshot: PoolContract_SyncEvent_tokenHourlySnapshotEntityHandlerContext; 
  readonly TokenWeeklySnapshot: PoolContract_SyncEvent_tokenWeeklySnapshotEntityHandlerContext; 
  readonly User: PoolContract_SyncEvent_userEntityHandlerContext
};

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_SyncEvent_handlerContextAsync = {
  readonly log: Logs_userLogger; 
  readonly Gauge: PoolContract_SyncEvent_gaugeEntityHandlerContextAsync; 
  readonly LatestETHPrice: PoolContract_SyncEvent_latestETHPriceEntityHandlerContextAsync; 
  readonly LiquidityPool: PoolContract_SyncEvent_liquidityPoolEntityHandlerContextAsync; 
  readonly LiquidityPoolDailySnapshot: PoolContract_SyncEvent_liquidityPoolDailySnapshotEntityHandlerContextAsync; 
  readonly LiquidityPoolHourlySnapshot: PoolContract_SyncEvent_liquidityPoolHourlySnapshotEntityHandlerContextAsync; 
  readonly LiquidityPoolUserMapping: PoolContract_SyncEvent_liquidityPoolUserMappingEntityHandlerContextAsync; 
  readonly LiquidityPoolWeeklySnapshot: PoolContract_SyncEvent_liquidityPoolWeeklySnapshotEntityHandlerContextAsync; 
  readonly StateStore: PoolContract_SyncEvent_stateStoreEntityHandlerContextAsync; 
  readonly Token: PoolContract_SyncEvent_tokenEntityHandlerContextAsync; 
  readonly TokenDailySnapshot: PoolContract_SyncEvent_tokenDailySnapshotEntityHandlerContextAsync; 
  readonly TokenHourlySnapshot: PoolContract_SyncEvent_tokenHourlySnapshotEntityHandlerContextAsync; 
  readonly TokenWeeklySnapshot: PoolContract_SyncEvent_tokenWeeklySnapshotEntityHandlerContextAsync; 
  readonly User: PoolContract_SyncEvent_userEntityHandlerContextAsync
};

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_SyncEvent_stateStoreEntityLoaderContext = { readonly stateStoreLoad: (_1:id, _2:{ readonly loaders?: stateStoreLoaderConfig }) => void; readonly load: (_1:id, _2:{ readonly loaders?: stateStoreLoaderConfig }) => void };

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_SyncEvent_liquidityPoolEntityLoaderContext = {
  readonly singlePoolLoad: (_1:id, _2:{
    readonly loaders?: liquidityPoolLoaderConfig
  }) => void; 
  readonly stablecoinPoolsLoad: (_1:id[], _2:{
    readonly loaders?: liquidityPoolLoaderConfig
  }) => void; 
  readonly whitelistedPoolsLoad: (_1:id[], _2:{
    readonly loaders?: liquidityPoolLoaderConfig
  }) => void; 
  readonly load: (_1:id, _2:{
    readonly loaders?: liquidityPoolLoaderConfig
  }) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_SyncEvent_tokenEntityLoaderContext = { readonly whitelistedTokensLoad: (_1:id[]) => void; readonly load: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_SyncEvent_contractRegistrations = {
  readonly addPool: (_1:Ethers_ethAddress) => void; 
  readonly addPoolFactory: (_1:Ethers_ethAddress) => void; 
  readonly addVoter: (_1:Ethers_ethAddress) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_SyncEvent_loaderContext = {
  readonly log: Logs_userLogger; 
  readonly contractRegistration: PoolContract_SyncEvent_contractRegistrations; 
  readonly StateStore: PoolContract_SyncEvent_stateStoreEntityLoaderContext; 
  readonly LiquidityPool: PoolContract_SyncEvent_liquidityPoolEntityLoaderContext; 
  readonly Token: PoolContract_SyncEvent_tokenEntityLoaderContext
};

// tslint:disable-next-line:interface-over-type-literal
export type PoolFactoryContract_PoolCreatedEvent_eventArgs = {
  readonly token0: Ethers_ethAddress; 
  readonly token1: Ethers_ethAddress; 
  readonly stable: boolean; 
  readonly pool: Ethers_ethAddress; 
  readonly unnamed: Ethers_BigInt_t
};

// tslint:disable-next-line:interface-over-type-literal
export type PoolFactoryContract_PoolCreatedEvent_log = eventLog<PoolFactoryContract_PoolCreatedEvent_eventArgs>;
export type PoolFactoryContract_PoolCreated_EventLog = PoolFactoryContract_PoolCreatedEvent_log;

// tslint:disable-next-line:interface-over-type-literal
export type PoolFactoryContract_PoolCreatedEvent_gaugeEntityHandlerContext = {
  readonly getPool: (_1:gaugeEntity) => liquidityPoolEntity; 
  readonly set: (_1:gaugeEntity) => void; 
  readonly delete: (_1:id) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type PoolFactoryContract_PoolCreatedEvent_gaugeEntityHandlerContextAsync = {
  readonly getPool: (_1:gaugeEntity) => Promise<liquidityPoolEntity>; 
  readonly set: (_1:gaugeEntity) => void; 
  readonly delete: (_1:id) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type PoolFactoryContract_PoolCreatedEvent_latestETHPriceEntityHandlerContext = { readonly set: (_1:latestETHPriceEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type PoolFactoryContract_PoolCreatedEvent_latestETHPriceEntityHandlerContextAsync = { readonly set: (_1:latestETHPriceEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type PoolFactoryContract_PoolCreatedEvent_liquidityPoolEntityHandlerContext = {
  readonly getToken0: (_1:liquidityPoolEntity) => tokenEntity; 
  readonly getToken1: (_1:liquidityPoolEntity) => tokenEntity; 
  readonly set: (_1:liquidityPoolEntity) => void; 
  readonly delete: (_1:id) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type PoolFactoryContract_PoolCreatedEvent_liquidityPoolEntityHandlerContextAsync = {
  readonly getToken0: (_1:liquidityPoolEntity) => Promise<tokenEntity>; 
  readonly getToken1: (_1:liquidityPoolEntity) => Promise<tokenEntity>; 
  readonly set: (_1:liquidityPoolEntity) => void; 
  readonly delete: (_1:id) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type PoolFactoryContract_PoolCreatedEvent_liquidityPoolDailySnapshotEntityHandlerContext = { readonly set: (_1:liquidityPoolDailySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type PoolFactoryContract_PoolCreatedEvent_liquidityPoolDailySnapshotEntityHandlerContextAsync = { readonly set: (_1:liquidityPoolDailySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type PoolFactoryContract_PoolCreatedEvent_liquidityPoolHourlySnapshotEntityHandlerContext = { readonly set: (_1:liquidityPoolHourlySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type PoolFactoryContract_PoolCreatedEvent_liquidityPoolHourlySnapshotEntityHandlerContextAsync = { readonly set: (_1:liquidityPoolHourlySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type PoolFactoryContract_PoolCreatedEvent_liquidityPoolUserMappingEntityHandlerContext = {
  readonly getLiquidityPool: (_1:liquidityPoolUserMappingEntity) => liquidityPoolEntity; 
  readonly getUser: (_1:liquidityPoolUserMappingEntity) => userEntity; 
  readonly set: (_1:liquidityPoolUserMappingEntity) => void; 
  readonly delete: (_1:id) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type PoolFactoryContract_PoolCreatedEvent_liquidityPoolUserMappingEntityHandlerContextAsync = {
  readonly getLiquidityPool: (_1:liquidityPoolUserMappingEntity) => Promise<liquidityPoolEntity>; 
  readonly getUser: (_1:liquidityPoolUserMappingEntity) => Promise<userEntity>; 
  readonly set: (_1:liquidityPoolUserMappingEntity) => void; 
  readonly delete: (_1:id) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type PoolFactoryContract_PoolCreatedEvent_liquidityPoolWeeklySnapshotEntityHandlerContext = { readonly set: (_1:liquidityPoolWeeklySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type PoolFactoryContract_PoolCreatedEvent_liquidityPoolWeeklySnapshotEntityHandlerContextAsync = { readonly set: (_1:liquidityPoolWeeklySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type PoolFactoryContract_PoolCreatedEvent_stateStoreEntityHandlerContext = {
  readonly stateStore: (undefined | stateStoreEntity); 
  readonly get: (_1:id) => (undefined | stateStoreEntity); 
  readonly getLatestEthPrice: (_1:stateStoreEntity) => latestETHPriceEntity; 
  readonly set: (_1:stateStoreEntity) => void; 
  readonly delete: (_1:id) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type PoolFactoryContract_PoolCreatedEvent_stateStoreEntityHandlerContextAsync = {
  readonly stateStore: (undefined | stateStoreEntity); 
  readonly get: (_1:id) => Promise<(undefined | stateStoreEntity)>; 
  readonly getLatestEthPrice: (_1:stateStoreEntity) => Promise<latestETHPriceEntity>; 
  readonly set: (_1:stateStoreEntity) => void; 
  readonly delete: (_1:id) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type PoolFactoryContract_PoolCreatedEvent_tokenEntityHandlerContext = { readonly set: (_1:tokenEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type PoolFactoryContract_PoolCreatedEvent_tokenEntityHandlerContextAsync = { readonly set: (_1:tokenEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type PoolFactoryContract_PoolCreatedEvent_tokenDailySnapshotEntityHandlerContext = { readonly set: (_1:tokenDailySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type PoolFactoryContract_PoolCreatedEvent_tokenDailySnapshotEntityHandlerContextAsync = { readonly set: (_1:tokenDailySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type PoolFactoryContract_PoolCreatedEvent_tokenHourlySnapshotEntityHandlerContext = { readonly set: (_1:tokenHourlySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type PoolFactoryContract_PoolCreatedEvent_tokenHourlySnapshotEntityHandlerContextAsync = { readonly set: (_1:tokenHourlySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type PoolFactoryContract_PoolCreatedEvent_tokenWeeklySnapshotEntityHandlerContext = { readonly set: (_1:tokenWeeklySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type PoolFactoryContract_PoolCreatedEvent_tokenWeeklySnapshotEntityHandlerContextAsync = { readonly set: (_1:tokenWeeklySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type PoolFactoryContract_PoolCreatedEvent_userEntityHandlerContext = { readonly set: (_1:userEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type PoolFactoryContract_PoolCreatedEvent_userEntityHandlerContextAsync = { readonly set: (_1:userEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type PoolFactoryContract_PoolCreatedEvent_handlerContext = {
  readonly log: Logs_userLogger; 
  readonly Gauge: PoolFactoryContract_PoolCreatedEvent_gaugeEntityHandlerContext; 
  readonly LatestETHPrice: PoolFactoryContract_PoolCreatedEvent_latestETHPriceEntityHandlerContext; 
  readonly LiquidityPool: PoolFactoryContract_PoolCreatedEvent_liquidityPoolEntityHandlerContext; 
  readonly LiquidityPoolDailySnapshot: PoolFactoryContract_PoolCreatedEvent_liquidityPoolDailySnapshotEntityHandlerContext; 
  readonly LiquidityPoolHourlySnapshot: PoolFactoryContract_PoolCreatedEvent_liquidityPoolHourlySnapshotEntityHandlerContext; 
  readonly LiquidityPoolUserMapping: PoolFactoryContract_PoolCreatedEvent_liquidityPoolUserMappingEntityHandlerContext; 
  readonly LiquidityPoolWeeklySnapshot: PoolFactoryContract_PoolCreatedEvent_liquidityPoolWeeklySnapshotEntityHandlerContext; 
  readonly StateStore: PoolFactoryContract_PoolCreatedEvent_stateStoreEntityHandlerContext; 
  readonly Token: PoolFactoryContract_PoolCreatedEvent_tokenEntityHandlerContext; 
  readonly TokenDailySnapshot: PoolFactoryContract_PoolCreatedEvent_tokenDailySnapshotEntityHandlerContext; 
  readonly TokenHourlySnapshot: PoolFactoryContract_PoolCreatedEvent_tokenHourlySnapshotEntityHandlerContext; 
  readonly TokenWeeklySnapshot: PoolFactoryContract_PoolCreatedEvent_tokenWeeklySnapshotEntityHandlerContext; 
  readonly User: PoolFactoryContract_PoolCreatedEvent_userEntityHandlerContext
};

// tslint:disable-next-line:interface-over-type-literal
export type PoolFactoryContract_PoolCreatedEvent_handlerContextAsync = {
  readonly log: Logs_userLogger; 
  readonly Gauge: PoolFactoryContract_PoolCreatedEvent_gaugeEntityHandlerContextAsync; 
  readonly LatestETHPrice: PoolFactoryContract_PoolCreatedEvent_latestETHPriceEntityHandlerContextAsync; 
  readonly LiquidityPool: PoolFactoryContract_PoolCreatedEvent_liquidityPoolEntityHandlerContextAsync; 
  readonly LiquidityPoolDailySnapshot: PoolFactoryContract_PoolCreatedEvent_liquidityPoolDailySnapshotEntityHandlerContextAsync; 
  readonly LiquidityPoolHourlySnapshot: PoolFactoryContract_PoolCreatedEvent_liquidityPoolHourlySnapshotEntityHandlerContextAsync; 
  readonly LiquidityPoolUserMapping: PoolFactoryContract_PoolCreatedEvent_liquidityPoolUserMappingEntityHandlerContextAsync; 
  readonly LiquidityPoolWeeklySnapshot: PoolFactoryContract_PoolCreatedEvent_liquidityPoolWeeklySnapshotEntityHandlerContextAsync; 
  readonly StateStore: PoolFactoryContract_PoolCreatedEvent_stateStoreEntityHandlerContextAsync; 
  readonly Token: PoolFactoryContract_PoolCreatedEvent_tokenEntityHandlerContextAsync; 
  readonly TokenDailySnapshot: PoolFactoryContract_PoolCreatedEvent_tokenDailySnapshotEntityHandlerContextAsync; 
  readonly TokenHourlySnapshot: PoolFactoryContract_PoolCreatedEvent_tokenHourlySnapshotEntityHandlerContextAsync; 
  readonly TokenWeeklySnapshot: PoolFactoryContract_PoolCreatedEvent_tokenWeeklySnapshotEntityHandlerContextAsync; 
  readonly User: PoolFactoryContract_PoolCreatedEvent_userEntityHandlerContextAsync
};

// tslint:disable-next-line:interface-over-type-literal
export type PoolFactoryContract_PoolCreatedEvent_stateStoreEntityLoaderContext = { readonly stateStoreLoad: (_1:id, _2:{ readonly loaders?: stateStoreLoaderConfig }) => void; readonly load: (_1:id, _2:{ readonly loaders?: stateStoreLoaderConfig }) => void };

// tslint:disable-next-line:interface-over-type-literal
export type PoolFactoryContract_PoolCreatedEvent_contractRegistrations = {
  readonly addPool: (_1:Ethers_ethAddress) => void; 
  readonly addPoolFactory: (_1:Ethers_ethAddress) => void; 
  readonly addVoter: (_1:Ethers_ethAddress) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type PoolFactoryContract_PoolCreatedEvent_loaderContext = {
  readonly log: Logs_userLogger; 
  readonly contractRegistration: PoolFactoryContract_PoolCreatedEvent_contractRegistrations; 
  readonly StateStore: PoolFactoryContract_PoolCreatedEvent_stateStoreEntityLoaderContext
};

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_DistributeRewardEvent_eventArgs = {
  readonly sender: Ethers_ethAddress; 
  readonly gauge: Ethers_ethAddress; 
  readonly amount: Ethers_BigInt_t
};

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_DistributeRewardEvent_log = eventLog<VoterContract_DistributeRewardEvent_eventArgs>;
export type VoterContract_DistributeReward_EventLog = VoterContract_DistributeRewardEvent_log;

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_DistributeRewardEvent_gaugeEntityHandlerContext = {
  readonly get: (_1:id) => (undefined | gaugeEntity); 
  readonly getPool: (_1:gaugeEntity) => liquidityPoolEntity; 
  readonly set: (_1:gaugeEntity) => void; 
  readonly delete: (_1:id) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_DistributeRewardEvent_gaugeEntityHandlerContextAsync = {
  readonly get: (_1:id) => Promise<(undefined | gaugeEntity)>; 
  readonly getPool: (_1:gaugeEntity) => Promise<liquidityPoolEntity>; 
  readonly set: (_1:gaugeEntity) => void; 
  readonly delete: (_1:id) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_DistributeRewardEvent_latestETHPriceEntityHandlerContext = { readonly set: (_1:latestETHPriceEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_DistributeRewardEvent_latestETHPriceEntityHandlerContextAsync = { readonly set: (_1:latestETHPriceEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_DistributeRewardEvent_liquidityPoolEntityHandlerContext = {
  readonly getToken0: (_1:liquidityPoolEntity) => tokenEntity; 
  readonly getToken1: (_1:liquidityPoolEntity) => tokenEntity; 
  readonly set: (_1:liquidityPoolEntity) => void; 
  readonly delete: (_1:id) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_DistributeRewardEvent_liquidityPoolEntityHandlerContextAsync = {
  readonly getToken0: (_1:liquidityPoolEntity) => Promise<tokenEntity>; 
  readonly getToken1: (_1:liquidityPoolEntity) => Promise<tokenEntity>; 
  readonly set: (_1:liquidityPoolEntity) => void; 
  readonly delete: (_1:id) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_DistributeRewardEvent_liquidityPoolDailySnapshotEntityHandlerContext = { readonly set: (_1:liquidityPoolDailySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_DistributeRewardEvent_liquidityPoolDailySnapshotEntityHandlerContextAsync = { readonly set: (_1:liquidityPoolDailySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_DistributeRewardEvent_liquidityPoolHourlySnapshotEntityHandlerContext = { readonly set: (_1:liquidityPoolHourlySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_DistributeRewardEvent_liquidityPoolHourlySnapshotEntityHandlerContextAsync = { readonly set: (_1:liquidityPoolHourlySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_DistributeRewardEvent_liquidityPoolUserMappingEntityHandlerContext = {
  readonly getLiquidityPool: (_1:liquidityPoolUserMappingEntity) => liquidityPoolEntity; 
  readonly getUser: (_1:liquidityPoolUserMappingEntity) => userEntity; 
  readonly set: (_1:liquidityPoolUserMappingEntity) => void; 
  readonly delete: (_1:id) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_DistributeRewardEvent_liquidityPoolUserMappingEntityHandlerContextAsync = {
  readonly getLiquidityPool: (_1:liquidityPoolUserMappingEntity) => Promise<liquidityPoolEntity>; 
  readonly getUser: (_1:liquidityPoolUserMappingEntity) => Promise<userEntity>; 
  readonly set: (_1:liquidityPoolUserMappingEntity) => void; 
  readonly delete: (_1:id) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_DistributeRewardEvent_liquidityPoolWeeklySnapshotEntityHandlerContext = { readonly set: (_1:liquidityPoolWeeklySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_DistributeRewardEvent_liquidityPoolWeeklySnapshotEntityHandlerContextAsync = { readonly set: (_1:liquidityPoolWeeklySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_DistributeRewardEvent_stateStoreEntityHandlerContext = {
  readonly getLatestEthPrice: (_1:stateStoreEntity) => latestETHPriceEntity; 
  readonly set: (_1:stateStoreEntity) => void; 
  readonly delete: (_1:id) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_DistributeRewardEvent_stateStoreEntityHandlerContextAsync = {
  readonly getLatestEthPrice: (_1:stateStoreEntity) => Promise<latestETHPriceEntity>; 
  readonly set: (_1:stateStoreEntity) => void; 
  readonly delete: (_1:id) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_DistributeRewardEvent_tokenEntityHandlerContext = {
  readonly rewardToken: (undefined | tokenEntity); 
  readonly get: (_1:id) => (undefined | tokenEntity); 
  readonly set: (_1:tokenEntity) => void; 
  readonly delete: (_1:id) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_DistributeRewardEvent_tokenEntityHandlerContextAsync = {
  readonly rewardToken: (undefined | tokenEntity); 
  readonly get: (_1:id) => Promise<(undefined | tokenEntity)>; 
  readonly set: (_1:tokenEntity) => void; 
  readonly delete: (_1:id) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_DistributeRewardEvent_tokenDailySnapshotEntityHandlerContext = { readonly set: (_1:tokenDailySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_DistributeRewardEvent_tokenDailySnapshotEntityHandlerContextAsync = { readonly set: (_1:tokenDailySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_DistributeRewardEvent_tokenHourlySnapshotEntityHandlerContext = { readonly set: (_1:tokenHourlySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_DistributeRewardEvent_tokenHourlySnapshotEntityHandlerContextAsync = { readonly set: (_1:tokenHourlySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_DistributeRewardEvent_tokenWeeklySnapshotEntityHandlerContext = { readonly set: (_1:tokenWeeklySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_DistributeRewardEvent_tokenWeeklySnapshotEntityHandlerContextAsync = { readonly set: (_1:tokenWeeklySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_DistributeRewardEvent_userEntityHandlerContext = { readonly set: (_1:userEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_DistributeRewardEvent_userEntityHandlerContextAsync = { readonly set: (_1:userEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_DistributeRewardEvent_handlerContext = {
  readonly log: Logs_userLogger; 
  readonly Gauge: VoterContract_DistributeRewardEvent_gaugeEntityHandlerContext; 
  readonly LatestETHPrice: VoterContract_DistributeRewardEvent_latestETHPriceEntityHandlerContext; 
  readonly LiquidityPool: VoterContract_DistributeRewardEvent_liquidityPoolEntityHandlerContext; 
  readonly LiquidityPoolDailySnapshot: VoterContract_DistributeRewardEvent_liquidityPoolDailySnapshotEntityHandlerContext; 
  readonly LiquidityPoolHourlySnapshot: VoterContract_DistributeRewardEvent_liquidityPoolHourlySnapshotEntityHandlerContext; 
  readonly LiquidityPoolUserMapping: VoterContract_DistributeRewardEvent_liquidityPoolUserMappingEntityHandlerContext; 
  readonly LiquidityPoolWeeklySnapshot: VoterContract_DistributeRewardEvent_liquidityPoolWeeklySnapshotEntityHandlerContext; 
  readonly StateStore: VoterContract_DistributeRewardEvent_stateStoreEntityHandlerContext; 
  readonly Token: VoterContract_DistributeRewardEvent_tokenEntityHandlerContext; 
  readonly TokenDailySnapshot: VoterContract_DistributeRewardEvent_tokenDailySnapshotEntityHandlerContext; 
  readonly TokenHourlySnapshot: VoterContract_DistributeRewardEvent_tokenHourlySnapshotEntityHandlerContext; 
  readonly TokenWeeklySnapshot: VoterContract_DistributeRewardEvent_tokenWeeklySnapshotEntityHandlerContext; 
  readonly User: VoterContract_DistributeRewardEvent_userEntityHandlerContext
};

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_DistributeRewardEvent_handlerContextAsync = {
  readonly log: Logs_userLogger; 
  readonly Gauge: VoterContract_DistributeRewardEvent_gaugeEntityHandlerContextAsync; 
  readonly LatestETHPrice: VoterContract_DistributeRewardEvent_latestETHPriceEntityHandlerContextAsync; 
  readonly LiquidityPool: VoterContract_DistributeRewardEvent_liquidityPoolEntityHandlerContextAsync; 
  readonly LiquidityPoolDailySnapshot: VoterContract_DistributeRewardEvent_liquidityPoolDailySnapshotEntityHandlerContextAsync; 
  readonly LiquidityPoolHourlySnapshot: VoterContract_DistributeRewardEvent_liquidityPoolHourlySnapshotEntityHandlerContextAsync; 
  readonly LiquidityPoolUserMapping: VoterContract_DistributeRewardEvent_liquidityPoolUserMappingEntityHandlerContextAsync; 
  readonly LiquidityPoolWeeklySnapshot: VoterContract_DistributeRewardEvent_liquidityPoolWeeklySnapshotEntityHandlerContextAsync; 
  readonly StateStore: VoterContract_DistributeRewardEvent_stateStoreEntityHandlerContextAsync; 
  readonly Token: VoterContract_DistributeRewardEvent_tokenEntityHandlerContextAsync; 
  readonly TokenDailySnapshot: VoterContract_DistributeRewardEvent_tokenDailySnapshotEntityHandlerContextAsync; 
  readonly TokenHourlySnapshot: VoterContract_DistributeRewardEvent_tokenHourlySnapshotEntityHandlerContextAsync; 
  readonly TokenWeeklySnapshot: VoterContract_DistributeRewardEvent_tokenWeeklySnapshotEntityHandlerContextAsync; 
  readonly User: VoterContract_DistributeRewardEvent_userEntityHandlerContextAsync
};

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_DistributeRewardEvent_gaugeEntityLoaderContext = { readonly load: (_1:id, _2:{ readonly loaders?: gaugeLoaderConfig }) => void };

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_DistributeRewardEvent_tokenEntityLoaderContext = { readonly rewardTokenLoad: (_1:id) => void; readonly load: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_DistributeRewardEvent_contractRegistrations = {
  readonly addPool: (_1:Ethers_ethAddress) => void; 
  readonly addPoolFactory: (_1:Ethers_ethAddress) => void; 
  readonly addVoter: (_1:Ethers_ethAddress) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_DistributeRewardEvent_loaderContext = {
  readonly log: Logs_userLogger; 
  readonly contractRegistration: VoterContract_DistributeRewardEvent_contractRegistrations; 
  readonly Gauge: VoterContract_DistributeRewardEvent_gaugeEntityLoaderContext; 
  readonly Token: VoterContract_DistributeRewardEvent_tokenEntityLoaderContext
};

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_GaugeCreatedEvent_eventArgs = {
  readonly poolFactory: Ethers_ethAddress; 
  readonly votingRewardsFactory: Ethers_ethAddress; 
  readonly gaugeFactory: Ethers_ethAddress; 
  readonly pool: Ethers_ethAddress; 
  readonly bribeVotingReward: Ethers_ethAddress; 
  readonly feeVotingReward: Ethers_ethAddress; 
  readonly gauge: Ethers_ethAddress; 
  readonly creator: Ethers_ethAddress
};

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_GaugeCreatedEvent_log = eventLog<VoterContract_GaugeCreatedEvent_eventArgs>;
export type VoterContract_GaugeCreated_EventLog = VoterContract_GaugeCreatedEvent_log;

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_GaugeCreatedEvent_gaugeEntityHandlerContext = {
  readonly getPool: (_1:gaugeEntity) => liquidityPoolEntity; 
  readonly set: (_1:gaugeEntity) => void; 
  readonly delete: (_1:id) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_GaugeCreatedEvent_gaugeEntityHandlerContextAsync = {
  readonly getPool: (_1:gaugeEntity) => Promise<liquidityPoolEntity>; 
  readonly set: (_1:gaugeEntity) => void; 
  readonly delete: (_1:id) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_GaugeCreatedEvent_latestETHPriceEntityHandlerContext = { readonly set: (_1:latestETHPriceEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_GaugeCreatedEvent_latestETHPriceEntityHandlerContextAsync = { readonly set: (_1:latestETHPriceEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_GaugeCreatedEvent_liquidityPoolEntityHandlerContext = {
  readonly get: (_1:id) => (undefined | liquidityPoolEntity); 
  readonly getToken0: (_1:liquidityPoolEntity) => tokenEntity; 
  readonly getToken1: (_1:liquidityPoolEntity) => tokenEntity; 
  readonly set: (_1:liquidityPoolEntity) => void; 
  readonly delete: (_1:id) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_GaugeCreatedEvent_liquidityPoolEntityHandlerContextAsync = {
  readonly get: (_1:id) => Promise<(undefined | liquidityPoolEntity)>; 
  readonly getToken0: (_1:liquidityPoolEntity) => Promise<tokenEntity>; 
  readonly getToken1: (_1:liquidityPoolEntity) => Promise<tokenEntity>; 
  readonly set: (_1:liquidityPoolEntity) => void; 
  readonly delete: (_1:id) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_GaugeCreatedEvent_liquidityPoolDailySnapshotEntityHandlerContext = { readonly set: (_1:liquidityPoolDailySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_GaugeCreatedEvent_liquidityPoolDailySnapshotEntityHandlerContextAsync = { readonly set: (_1:liquidityPoolDailySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_GaugeCreatedEvent_liquidityPoolHourlySnapshotEntityHandlerContext = { readonly set: (_1:liquidityPoolHourlySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_GaugeCreatedEvent_liquidityPoolHourlySnapshotEntityHandlerContextAsync = { readonly set: (_1:liquidityPoolHourlySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_GaugeCreatedEvent_liquidityPoolUserMappingEntityHandlerContext = {
  readonly getLiquidityPool: (_1:liquidityPoolUserMappingEntity) => liquidityPoolEntity; 
  readonly getUser: (_1:liquidityPoolUserMappingEntity) => userEntity; 
  readonly set: (_1:liquidityPoolUserMappingEntity) => void; 
  readonly delete: (_1:id) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_GaugeCreatedEvent_liquidityPoolUserMappingEntityHandlerContextAsync = {
  readonly getLiquidityPool: (_1:liquidityPoolUserMappingEntity) => Promise<liquidityPoolEntity>; 
  readonly getUser: (_1:liquidityPoolUserMappingEntity) => Promise<userEntity>; 
  readonly set: (_1:liquidityPoolUserMappingEntity) => void; 
  readonly delete: (_1:id) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_GaugeCreatedEvent_liquidityPoolWeeklySnapshotEntityHandlerContext = { readonly set: (_1:liquidityPoolWeeklySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_GaugeCreatedEvent_liquidityPoolWeeklySnapshotEntityHandlerContextAsync = { readonly set: (_1:liquidityPoolWeeklySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_GaugeCreatedEvent_stateStoreEntityHandlerContext = {
  readonly getLatestEthPrice: (_1:stateStoreEntity) => latestETHPriceEntity; 
  readonly set: (_1:stateStoreEntity) => void; 
  readonly delete: (_1:id) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_GaugeCreatedEvent_stateStoreEntityHandlerContextAsync = {
  readonly getLatestEthPrice: (_1:stateStoreEntity) => Promise<latestETHPriceEntity>; 
  readonly set: (_1:stateStoreEntity) => void; 
  readonly delete: (_1:id) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_GaugeCreatedEvent_tokenEntityHandlerContext = { readonly set: (_1:tokenEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_GaugeCreatedEvent_tokenEntityHandlerContextAsync = { readonly set: (_1:tokenEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_GaugeCreatedEvent_tokenDailySnapshotEntityHandlerContext = { readonly set: (_1:tokenDailySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_GaugeCreatedEvent_tokenDailySnapshotEntityHandlerContextAsync = { readonly set: (_1:tokenDailySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_GaugeCreatedEvent_tokenHourlySnapshotEntityHandlerContext = { readonly set: (_1:tokenHourlySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_GaugeCreatedEvent_tokenHourlySnapshotEntityHandlerContextAsync = { readonly set: (_1:tokenHourlySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_GaugeCreatedEvent_tokenWeeklySnapshotEntityHandlerContext = { readonly set: (_1:tokenWeeklySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_GaugeCreatedEvent_tokenWeeklySnapshotEntityHandlerContextAsync = { readonly set: (_1:tokenWeeklySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_GaugeCreatedEvent_userEntityHandlerContext = { readonly set: (_1:userEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_GaugeCreatedEvent_userEntityHandlerContextAsync = { readonly set: (_1:userEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_GaugeCreatedEvent_handlerContext = {
  readonly log: Logs_userLogger; 
  readonly Gauge: VoterContract_GaugeCreatedEvent_gaugeEntityHandlerContext; 
  readonly LatestETHPrice: VoterContract_GaugeCreatedEvent_latestETHPriceEntityHandlerContext; 
  readonly LiquidityPool: VoterContract_GaugeCreatedEvent_liquidityPoolEntityHandlerContext; 
  readonly LiquidityPoolDailySnapshot: VoterContract_GaugeCreatedEvent_liquidityPoolDailySnapshotEntityHandlerContext; 
  readonly LiquidityPoolHourlySnapshot: VoterContract_GaugeCreatedEvent_liquidityPoolHourlySnapshotEntityHandlerContext; 
  readonly LiquidityPoolUserMapping: VoterContract_GaugeCreatedEvent_liquidityPoolUserMappingEntityHandlerContext; 
  readonly LiquidityPoolWeeklySnapshot: VoterContract_GaugeCreatedEvent_liquidityPoolWeeklySnapshotEntityHandlerContext; 
  readonly StateStore: VoterContract_GaugeCreatedEvent_stateStoreEntityHandlerContext; 
  readonly Token: VoterContract_GaugeCreatedEvent_tokenEntityHandlerContext; 
  readonly TokenDailySnapshot: VoterContract_GaugeCreatedEvent_tokenDailySnapshotEntityHandlerContext; 
  readonly TokenHourlySnapshot: VoterContract_GaugeCreatedEvent_tokenHourlySnapshotEntityHandlerContext; 
  readonly TokenWeeklySnapshot: VoterContract_GaugeCreatedEvent_tokenWeeklySnapshotEntityHandlerContext; 
  readonly User: VoterContract_GaugeCreatedEvent_userEntityHandlerContext
};

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_GaugeCreatedEvent_handlerContextAsync = {
  readonly log: Logs_userLogger; 
  readonly Gauge: VoterContract_GaugeCreatedEvent_gaugeEntityHandlerContextAsync; 
  readonly LatestETHPrice: VoterContract_GaugeCreatedEvent_latestETHPriceEntityHandlerContextAsync; 
  readonly LiquidityPool: VoterContract_GaugeCreatedEvent_liquidityPoolEntityHandlerContextAsync; 
  readonly LiquidityPoolDailySnapshot: VoterContract_GaugeCreatedEvent_liquidityPoolDailySnapshotEntityHandlerContextAsync; 
  readonly LiquidityPoolHourlySnapshot: VoterContract_GaugeCreatedEvent_liquidityPoolHourlySnapshotEntityHandlerContextAsync; 
  readonly LiquidityPoolUserMapping: VoterContract_GaugeCreatedEvent_liquidityPoolUserMappingEntityHandlerContextAsync; 
  readonly LiquidityPoolWeeklySnapshot: VoterContract_GaugeCreatedEvent_liquidityPoolWeeklySnapshotEntityHandlerContextAsync; 
  readonly StateStore: VoterContract_GaugeCreatedEvent_stateStoreEntityHandlerContextAsync; 
  readonly Token: VoterContract_GaugeCreatedEvent_tokenEntityHandlerContextAsync; 
  readonly TokenDailySnapshot: VoterContract_GaugeCreatedEvent_tokenDailySnapshotEntityHandlerContextAsync; 
  readonly TokenHourlySnapshot: VoterContract_GaugeCreatedEvent_tokenHourlySnapshotEntityHandlerContextAsync; 
  readonly TokenWeeklySnapshot: VoterContract_GaugeCreatedEvent_tokenWeeklySnapshotEntityHandlerContextAsync; 
  readonly User: VoterContract_GaugeCreatedEvent_userEntityHandlerContextAsync
};

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_GaugeCreatedEvent_liquidityPoolEntityLoaderContext = { readonly load: (_1:id, _2:{ readonly loaders?: liquidityPoolLoaderConfig }) => void };

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_GaugeCreatedEvent_contractRegistrations = {
  readonly addPool: (_1:Ethers_ethAddress) => void; 
  readonly addPoolFactory: (_1:Ethers_ethAddress) => void; 
  readonly addVoter: (_1:Ethers_ethAddress) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_GaugeCreatedEvent_loaderContext = {
  readonly log: Logs_userLogger; 
  readonly contractRegistration: VoterContract_GaugeCreatedEvent_contractRegistrations; 
  readonly LiquidityPool: VoterContract_GaugeCreatedEvent_liquidityPoolEntityLoaderContext
};

// tslint:disable-next-line:interface-over-type-literal
export type chainId = number;
