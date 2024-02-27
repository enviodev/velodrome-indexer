/* TypeScript file generated from Types.res by genType. */
/* eslint-disable import/first */


import type {BigInt_t as Ethers_BigInt_t} from '../src/bindings/Ethers.gen';

import type {Json_t as Js_Json_t} from '../src/Js.shim';

import type {ethAddress as Ethers_ethAddress} from '../src/bindings/Ethers.gen';

import type {userLogger as Logs_userLogger} from './Logs.gen';

// tslint:disable-next-line:interface-over-type-literal
export type id = string;
export type Id = id;

// tslint:disable-next-line:interface-over-type-literal
export type liquidityPoolDailySnapshotLoaderConfig = boolean;

// tslint:disable-next-line:interface-over-type-literal
export type liquidityPoolNewLoaderConfig = { readonly loadToken0?: tokenLoaderConfig; readonly loadToken1?: tokenLoaderConfig };

// tslint:disable-next-line:interface-over-type-literal
export type tokenLoaderConfig = boolean;

// tslint:disable-next-line:interface-over-type-literal
export type entityRead = 
    { tag: "LiquidityPoolDailySnapshotRead"; value: id }
  | { tag: "LiquidityPoolHourlySnapshotRead"; value: id }
  | { tag: "LiquidityPoolNewRead"; value: [id, liquidityPoolNewLoaderConfig] }
  | { tag: "LiquidityPoolWeeklySnapshotRead"; value: id }
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
export type liquidityPoolDailySnapshotEntity = {
  readonly chainID: Ethers_BigInt_t; 
  readonly totalFees1: Ethers_BigInt_t; 
  readonly pool: string; 
  readonly totalFeesUSD: Ethers_BigInt_t; 
  readonly totalEmissions: Ethers_BigInt_t; 
  readonly totalLiquidityUSD: Ethers_BigInt_t; 
  readonly reserve1: Ethers_BigInt_t; 
  readonly id: id; 
  readonly totalVolume0: Ethers_BigInt_t; 
  readonly totalVolume1: Ethers_BigInt_t; 
  readonly token1Price: Ethers_BigInt_t; 
  readonly numberOfSwaps: Ethers_BigInt_t; 
  readonly token0Price: Ethers_BigInt_t; 
  readonly totalVolumeUSD: Ethers_BigInt_t; 
  readonly name: string; 
  readonly reserve0: Ethers_BigInt_t; 
  readonly totalEmissionsUSD: Ethers_BigInt_t; 
  readonly lastUpdatedTimestamp: Ethers_BigInt_t; 
  readonly totalFees0: Ethers_BigInt_t; 
  readonly totalBribesUSD: Ethers_BigInt_t
};
export type LiquidityPoolDailySnapshotEntity = liquidityPoolDailySnapshotEntity;

// tslint:disable-next-line:interface-over-type-literal
export type liquidityPoolHourlySnapshotEntity = {
  readonly totalEmissionsUSD: Ethers_BigInt_t; 
  readonly totalFees1: Ethers_BigInt_t; 
  readonly totalVolume0: Ethers_BigInt_t; 
  readonly pool: string; 
  readonly reserve1: Ethers_BigInt_t; 
  readonly totalEmissions: Ethers_BigInt_t; 
  readonly totalVolumeUSD: Ethers_BigInt_t; 
  readonly totalBribesUSD: Ethers_BigInt_t; 
  readonly lastUpdatedTimestamp: Ethers_BigInt_t; 
  readonly totalVolume1: Ethers_BigInt_t; 
  readonly totalFeesUSD: Ethers_BigInt_t; 
  readonly token1Price: Ethers_BigInt_t; 
  readonly totalFees0: Ethers_BigInt_t; 
  readonly name: string; 
  readonly chainID: Ethers_BigInt_t; 
  readonly numberOfSwaps: Ethers_BigInt_t; 
  readonly id: id; 
  readonly reserve0: Ethers_BigInt_t; 
  readonly totalLiquidityUSD: Ethers_BigInt_t; 
  readonly token0Price: Ethers_BigInt_t
};
export type LiquidityPoolHourlySnapshotEntity = liquidityPoolHourlySnapshotEntity;

// tslint:disable-next-line:interface-over-type-literal
export type liquidityPoolNewEntity = {
  readonly name: string; 
  readonly totalFeesUSD: Ethers_BigInt_t; 
  readonly token0_id: id; 
  readonly token0Price: Ethers_BigInt_t; 
  readonly reserve0: Ethers_BigInt_t; 
  readonly totalEmissions: Ethers_BigInt_t; 
  readonly totalVolumeUSD: Ethers_BigInt_t; 
  readonly chainID: Ethers_BigInt_t; 
  readonly isStable: boolean; 
  readonly reserve1: Ethers_BigInt_t; 
  readonly totalLiquidityUSD: Ethers_BigInt_t; 
  readonly token1_id: id; 
  readonly totalVolume1: Ethers_BigInt_t; 
  readonly numberOfSwaps: Ethers_BigInt_t; 
  readonly totalVolume0: Ethers_BigInt_t; 
  readonly totalFees0: Ethers_BigInt_t; 
  readonly id: id; 
  readonly totalFees1: Ethers_BigInt_t; 
  readonly token1Price: Ethers_BigInt_t; 
  readonly totalEmissionsUSD: Ethers_BigInt_t; 
  readonly totalBribesUSD: Ethers_BigInt_t; 
  readonly lastUpdatedTimestamp: Ethers_BigInt_t
};
export type LiquidityPoolNewEntity = liquidityPoolNewEntity;

// tslint:disable-next-line:interface-over-type-literal
export type liquidityPoolWeeklySnapshotEntity = {
  readonly name: string; 
  readonly totalVolume1: Ethers_BigInt_t; 
  readonly totalLiquidityUSD: Ethers_BigInt_t; 
  readonly totalEmissions: Ethers_BigInt_t; 
  readonly pool: string; 
  readonly reserve0: Ethers_BigInt_t; 
  readonly totalVolumeUSD: Ethers_BigInt_t; 
  readonly totalFeesUSD: Ethers_BigInt_t; 
  readonly numberOfSwaps: Ethers_BigInt_t; 
  readonly totalVolume0: Ethers_BigInt_t; 
  readonly token1Price: Ethers_BigInt_t; 
  readonly totalEmissionsUSD: Ethers_BigInt_t; 
  readonly totalBribesUSD: Ethers_BigInt_t; 
  readonly lastUpdatedTimestamp: Ethers_BigInt_t; 
  readonly totalFees0: Ethers_BigInt_t; 
  readonly reserve1: Ethers_BigInt_t; 
  readonly token0Price: Ethers_BigInt_t; 
  readonly id: id; 
  readonly totalFees1: Ethers_BigInt_t; 
  readonly chainID: Ethers_BigInt_t
};
export type LiquidityPoolWeeklySnapshotEntity = liquidityPoolWeeklySnapshotEntity;

// tslint:disable-next-line:interface-over-type-literal
export type tokenEntity = {
  readonly symbol: string; 
  readonly lastUpdatedTimestamp: Ethers_BigInt_t; 
  readonly name: string; 
  readonly chainID: Ethers_BigInt_t; 
  readonly id: id; 
  readonly decimals: Ethers_BigInt_t; 
  readonly poolUsedForPricing: string; 
  readonly pricePerUSDNew: Ethers_BigInt_t
};
export type TokenEntity = tokenEntity;

// tslint:disable-next-line:interface-over-type-literal
export type tokenDailySnapshotEntity = {
  readonly token: string; 
  readonly pricePerUSDNew: Ethers_BigInt_t; 
  readonly symbol: string; 
  readonly lastUpdatedTimestamp: Ethers_BigInt_t; 
  readonly name: string; 
  readonly id: id; 
  readonly poolUsedForPricing: string; 
  readonly chainID: Ethers_BigInt_t
};
export type TokenDailySnapshotEntity = tokenDailySnapshotEntity;

// tslint:disable-next-line:interface-over-type-literal
export type tokenHourlySnapshotEntity = {
  readonly poolUsedForPricing: string; 
  readonly symbol: string; 
  readonly token: string; 
  readonly pricePerUSDNew: Ethers_BigInt_t; 
  readonly chainID: Ethers_BigInt_t; 
  readonly lastUpdatedTimestamp: Ethers_BigInt_t; 
  readonly id: id; 
  readonly name: string
};
export type TokenHourlySnapshotEntity = tokenHourlySnapshotEntity;

// tslint:disable-next-line:interface-over-type-literal
export type tokenWeeklySnapshotEntity = {
  readonly chainID: Ethers_BigInt_t; 
  readonly name: string; 
  readonly lastUpdatedTimestamp: Ethers_BigInt_t; 
  readonly symbol: string; 
  readonly id: id; 
  readonly pricePerUSDNew: Ethers_BigInt_t; 
  readonly poolUsedForPricing: string; 
  readonly token: string
};
export type TokenWeeklySnapshotEntity = tokenWeeklySnapshotEntity;

// tslint:disable-next-line:interface-over-type-literal
export type userEntity = {
  readonly joined_at_timestamp: Ethers_BigInt_t; 
  readonly id: id; 
  readonly numberOfSwaps: Ethers_BigInt_t
};
export type UserEntity = userEntity;

// tslint:disable-next-line:interface-over-type-literal
export type eventIdentifier = {
  readonly chainId: number; 
  readonly blockNumber: number; 
  readonly logIndex: number
};

// tslint:disable-next-line:interface-over-type-literal
export type entityData<entityType> = 
    { tag: "Set"; value: [entityType, eventIdentifier] }
  | { tag: "Delete"; value: [string, eventIdentifier] }
  | { tag: "Read"; value: entityType };

// tslint:disable-next-line:interface-over-type-literal
export type inMemoryStoreRow<entityType> = { readonly current: entityData<entityType>; readonly history: entityData<entityType>[] };

// tslint:disable-next-line:interface-over-type-literal
export type eventLog<a> = {
  readonly params: a; 
  readonly chainId: number; 
  readonly txOrigin: (undefined | Ethers_ethAddress); 
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
export type PoolContract_FeesEvent_liquidityPoolDailySnapshotEntityHandlerContext = { readonly set: (_1:liquidityPoolDailySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_FeesEvent_liquidityPoolDailySnapshotEntityHandlerContextAsync = { readonly set: (_1:liquidityPoolDailySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_FeesEvent_liquidityPoolHourlySnapshotEntityHandlerContext = { readonly set: (_1:liquidityPoolHourlySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_FeesEvent_liquidityPoolHourlySnapshotEntityHandlerContextAsync = { readonly set: (_1:liquidityPoolHourlySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_FeesEvent_liquidityPoolNewEntityHandlerContext = {
  readonly get: (_1:id) => (undefined | liquidityPoolNewEntity); 
  readonly getToken0: (_1:liquidityPoolNewEntity) => tokenEntity; 
  readonly getToken1: (_1:liquidityPoolNewEntity) => tokenEntity; 
  readonly set: (_1:liquidityPoolNewEntity) => void; 
  readonly delete: (_1:id) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_FeesEvent_liquidityPoolNewEntityHandlerContextAsync = {
  readonly get: (_1:id) => Promise<(undefined | liquidityPoolNewEntity)>; 
  readonly getToken0: (_1:liquidityPoolNewEntity) => Promise<tokenEntity>; 
  readonly getToken1: (_1:liquidityPoolNewEntity) => Promise<tokenEntity>; 
  readonly set: (_1:liquidityPoolNewEntity) => void; 
  readonly delete: (_1:id) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_FeesEvent_liquidityPoolWeeklySnapshotEntityHandlerContext = { readonly set: (_1:liquidityPoolWeeklySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_FeesEvent_liquidityPoolWeeklySnapshotEntityHandlerContextAsync = { readonly set: (_1:liquidityPoolWeeklySnapshotEntity) => void; readonly delete: (_1:id) => void };

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
  readonly LiquidityPoolDailySnapshot: PoolContract_FeesEvent_liquidityPoolDailySnapshotEntityHandlerContext; 
  readonly LiquidityPoolHourlySnapshot: PoolContract_FeesEvent_liquidityPoolHourlySnapshotEntityHandlerContext; 
  readonly LiquidityPoolNew: PoolContract_FeesEvent_liquidityPoolNewEntityHandlerContext; 
  readonly LiquidityPoolWeeklySnapshot: PoolContract_FeesEvent_liquidityPoolWeeklySnapshotEntityHandlerContext; 
  readonly Token: PoolContract_FeesEvent_tokenEntityHandlerContext; 
  readonly TokenDailySnapshot: PoolContract_FeesEvent_tokenDailySnapshotEntityHandlerContext; 
  readonly TokenHourlySnapshot: PoolContract_FeesEvent_tokenHourlySnapshotEntityHandlerContext; 
  readonly TokenWeeklySnapshot: PoolContract_FeesEvent_tokenWeeklySnapshotEntityHandlerContext; 
  readonly User: PoolContract_FeesEvent_userEntityHandlerContext
};

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_FeesEvent_handlerContextAsync = {
  readonly log: Logs_userLogger; 
  readonly LiquidityPoolDailySnapshot: PoolContract_FeesEvent_liquidityPoolDailySnapshotEntityHandlerContextAsync; 
  readonly LiquidityPoolHourlySnapshot: PoolContract_FeesEvent_liquidityPoolHourlySnapshotEntityHandlerContextAsync; 
  readonly LiquidityPoolNew: PoolContract_FeesEvent_liquidityPoolNewEntityHandlerContextAsync; 
  readonly LiquidityPoolWeeklySnapshot: PoolContract_FeesEvent_liquidityPoolWeeklySnapshotEntityHandlerContextAsync; 
  readonly Token: PoolContract_FeesEvent_tokenEntityHandlerContextAsync; 
  readonly TokenDailySnapshot: PoolContract_FeesEvent_tokenDailySnapshotEntityHandlerContextAsync; 
  readonly TokenHourlySnapshot: PoolContract_FeesEvent_tokenHourlySnapshotEntityHandlerContextAsync; 
  readonly TokenWeeklySnapshot: PoolContract_FeesEvent_tokenWeeklySnapshotEntityHandlerContextAsync; 
  readonly User: PoolContract_FeesEvent_userEntityHandlerContextAsync
};

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_FeesEvent_liquidityPoolNewEntityLoaderContext = { readonly load: (_1:id, _2:{ readonly loaders?: liquidityPoolNewLoaderConfig }) => void };

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_FeesEvent_contractRegistrations = {
  readonly addPool: (_1:Ethers_ethAddress) => void; 
  readonly addPoolFactory: (_1:Ethers_ethAddress) => void; 
  readonly addVoter: (_1:Ethers_ethAddress) => void; 
  readonly addVotingReward: (_1:Ethers_ethAddress) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_FeesEvent_loaderContext = {
  readonly log: Logs_userLogger; 
  readonly contractRegistration: PoolContract_FeesEvent_contractRegistrations; 
  readonly LiquidityPoolNew: PoolContract_FeesEvent_liquidityPoolNewEntityLoaderContext
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
export type PoolContract_SwapEvent_liquidityPoolDailySnapshotEntityHandlerContext = { readonly set: (_1:liquidityPoolDailySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_SwapEvent_liquidityPoolDailySnapshotEntityHandlerContextAsync = { readonly set: (_1:liquidityPoolDailySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_SwapEvent_liquidityPoolHourlySnapshotEntityHandlerContext = { readonly set: (_1:liquidityPoolHourlySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_SwapEvent_liquidityPoolHourlySnapshotEntityHandlerContextAsync = { readonly set: (_1:liquidityPoolHourlySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_SwapEvent_liquidityPoolNewEntityHandlerContext = {
  readonly get: (_1:id) => (undefined | liquidityPoolNewEntity); 
  readonly getToken0: (_1:liquidityPoolNewEntity) => tokenEntity; 
  readonly getToken1: (_1:liquidityPoolNewEntity) => tokenEntity; 
  readonly set: (_1:liquidityPoolNewEntity) => void; 
  readonly delete: (_1:id) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_SwapEvent_liquidityPoolNewEntityHandlerContextAsync = {
  readonly get: (_1:id) => Promise<(undefined | liquidityPoolNewEntity)>; 
  readonly getToken0: (_1:liquidityPoolNewEntity) => Promise<tokenEntity>; 
  readonly getToken1: (_1:liquidityPoolNewEntity) => Promise<tokenEntity>; 
  readonly set: (_1:liquidityPoolNewEntity) => void; 
  readonly delete: (_1:id) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_SwapEvent_liquidityPoolWeeklySnapshotEntityHandlerContext = { readonly set: (_1:liquidityPoolWeeklySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_SwapEvent_liquidityPoolWeeklySnapshotEntityHandlerContextAsync = { readonly set: (_1:liquidityPoolWeeklySnapshotEntity) => void; readonly delete: (_1:id) => void };

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
  readonly get: (_1:id) => (undefined | userEntity); 
  readonly set: (_1:userEntity) => void; 
  readonly delete: (_1:id) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_SwapEvent_userEntityHandlerContextAsync = {
  readonly get: (_1:id) => Promise<(undefined | userEntity)>; 
  readonly set: (_1:userEntity) => void; 
  readonly delete: (_1:id) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_SwapEvent_handlerContext = {
  readonly log: Logs_userLogger; 
  readonly LiquidityPoolDailySnapshot: PoolContract_SwapEvent_liquidityPoolDailySnapshotEntityHandlerContext; 
  readonly LiquidityPoolHourlySnapshot: PoolContract_SwapEvent_liquidityPoolHourlySnapshotEntityHandlerContext; 
  readonly LiquidityPoolNew: PoolContract_SwapEvent_liquidityPoolNewEntityHandlerContext; 
  readonly LiquidityPoolWeeklySnapshot: PoolContract_SwapEvent_liquidityPoolWeeklySnapshotEntityHandlerContext; 
  readonly Token: PoolContract_SwapEvent_tokenEntityHandlerContext; 
  readonly TokenDailySnapshot: PoolContract_SwapEvent_tokenDailySnapshotEntityHandlerContext; 
  readonly TokenHourlySnapshot: PoolContract_SwapEvent_tokenHourlySnapshotEntityHandlerContext; 
  readonly TokenWeeklySnapshot: PoolContract_SwapEvent_tokenWeeklySnapshotEntityHandlerContext; 
  readonly User: PoolContract_SwapEvent_userEntityHandlerContext
};

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_SwapEvent_handlerContextAsync = {
  readonly log: Logs_userLogger; 
  readonly LiquidityPoolDailySnapshot: PoolContract_SwapEvent_liquidityPoolDailySnapshotEntityHandlerContextAsync; 
  readonly LiquidityPoolHourlySnapshot: PoolContract_SwapEvent_liquidityPoolHourlySnapshotEntityHandlerContextAsync; 
  readonly LiquidityPoolNew: PoolContract_SwapEvent_liquidityPoolNewEntityHandlerContextAsync; 
  readonly LiquidityPoolWeeklySnapshot: PoolContract_SwapEvent_liquidityPoolWeeklySnapshotEntityHandlerContextAsync; 
  readonly Token: PoolContract_SwapEvent_tokenEntityHandlerContextAsync; 
  readonly TokenDailySnapshot: PoolContract_SwapEvent_tokenDailySnapshotEntityHandlerContextAsync; 
  readonly TokenHourlySnapshot: PoolContract_SwapEvent_tokenHourlySnapshotEntityHandlerContextAsync; 
  readonly TokenWeeklySnapshot: PoolContract_SwapEvent_tokenWeeklySnapshotEntityHandlerContextAsync; 
  readonly User: PoolContract_SwapEvent_userEntityHandlerContextAsync
};

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_SwapEvent_liquidityPoolNewEntityLoaderContext = { readonly load: (_1:id, _2:{ readonly loaders?: liquidityPoolNewLoaderConfig }) => void };

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_SwapEvent_userEntityLoaderContext = { readonly load: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_SwapEvent_contractRegistrations = {
  readonly addPool: (_1:Ethers_ethAddress) => void; 
  readonly addPoolFactory: (_1:Ethers_ethAddress) => void; 
  readonly addVoter: (_1:Ethers_ethAddress) => void; 
  readonly addVotingReward: (_1:Ethers_ethAddress) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_SwapEvent_loaderContext = {
  readonly log: Logs_userLogger; 
  readonly contractRegistration: PoolContract_SwapEvent_contractRegistrations; 
  readonly LiquidityPoolNew: PoolContract_SwapEvent_liquidityPoolNewEntityLoaderContext; 
  readonly User: PoolContract_SwapEvent_userEntityLoaderContext
};

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_SyncEvent_eventArgs = { readonly reserve0: Ethers_BigInt_t; readonly reserve1: Ethers_BigInt_t };

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_SyncEvent_log = eventLog<PoolContract_SyncEvent_eventArgs>;
export type PoolContract_Sync_EventLog = PoolContract_SyncEvent_log;

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_SyncEvent_liquidityPoolDailySnapshotEntityHandlerContext = { readonly set: (_1:liquidityPoolDailySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_SyncEvent_liquidityPoolDailySnapshotEntityHandlerContextAsync = { readonly set: (_1:liquidityPoolDailySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_SyncEvent_liquidityPoolHourlySnapshotEntityHandlerContext = { readonly set: (_1:liquidityPoolHourlySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_SyncEvent_liquidityPoolHourlySnapshotEntityHandlerContextAsync = { readonly set: (_1:liquidityPoolHourlySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_SyncEvent_liquidityPoolNewEntityHandlerContext = {
  readonly get: (_1:id) => (undefined | liquidityPoolNewEntity); 
  readonly getToken0: (_1:liquidityPoolNewEntity) => tokenEntity; 
  readonly getToken1: (_1:liquidityPoolNewEntity) => tokenEntity; 
  readonly set: (_1:liquidityPoolNewEntity) => void; 
  readonly delete: (_1:id) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_SyncEvent_liquidityPoolNewEntityHandlerContextAsync = {
  readonly get: (_1:id) => Promise<(undefined | liquidityPoolNewEntity)>; 
  readonly getToken0: (_1:liquidityPoolNewEntity) => Promise<tokenEntity>; 
  readonly getToken1: (_1:liquidityPoolNewEntity) => Promise<tokenEntity>; 
  readonly set: (_1:liquidityPoolNewEntity) => void; 
  readonly delete: (_1:id) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_SyncEvent_liquidityPoolWeeklySnapshotEntityHandlerContext = { readonly set: (_1:liquidityPoolWeeklySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_SyncEvent_liquidityPoolWeeklySnapshotEntityHandlerContextAsync = { readonly set: (_1:liquidityPoolWeeklySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_SyncEvent_tokenEntityHandlerContext = {
  readonly get: (_1:id) => (undefined | tokenEntity); 
  readonly set: (_1:tokenEntity) => void; 
  readonly delete: (_1:id) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_SyncEvent_tokenEntityHandlerContextAsync = {
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
  readonly LiquidityPoolDailySnapshot: PoolContract_SyncEvent_liquidityPoolDailySnapshotEntityHandlerContext; 
  readonly LiquidityPoolHourlySnapshot: PoolContract_SyncEvent_liquidityPoolHourlySnapshotEntityHandlerContext; 
  readonly LiquidityPoolNew: PoolContract_SyncEvent_liquidityPoolNewEntityHandlerContext; 
  readonly LiquidityPoolWeeklySnapshot: PoolContract_SyncEvent_liquidityPoolWeeklySnapshotEntityHandlerContext; 
  readonly Token: PoolContract_SyncEvent_tokenEntityHandlerContext; 
  readonly TokenDailySnapshot: PoolContract_SyncEvent_tokenDailySnapshotEntityHandlerContext; 
  readonly TokenHourlySnapshot: PoolContract_SyncEvent_tokenHourlySnapshotEntityHandlerContext; 
  readonly TokenWeeklySnapshot: PoolContract_SyncEvent_tokenWeeklySnapshotEntityHandlerContext; 
  readonly User: PoolContract_SyncEvent_userEntityHandlerContext
};

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_SyncEvent_handlerContextAsync = {
  readonly log: Logs_userLogger; 
  readonly LiquidityPoolDailySnapshot: PoolContract_SyncEvent_liquidityPoolDailySnapshotEntityHandlerContextAsync; 
  readonly LiquidityPoolHourlySnapshot: PoolContract_SyncEvent_liquidityPoolHourlySnapshotEntityHandlerContextAsync; 
  readonly LiquidityPoolNew: PoolContract_SyncEvent_liquidityPoolNewEntityHandlerContextAsync; 
  readonly LiquidityPoolWeeklySnapshot: PoolContract_SyncEvent_liquidityPoolWeeklySnapshotEntityHandlerContextAsync; 
  readonly Token: PoolContract_SyncEvent_tokenEntityHandlerContextAsync; 
  readonly TokenDailySnapshot: PoolContract_SyncEvent_tokenDailySnapshotEntityHandlerContextAsync; 
  readonly TokenHourlySnapshot: PoolContract_SyncEvent_tokenHourlySnapshotEntityHandlerContextAsync; 
  readonly TokenWeeklySnapshot: PoolContract_SyncEvent_tokenWeeklySnapshotEntityHandlerContextAsync; 
  readonly User: PoolContract_SyncEvent_userEntityHandlerContextAsync
};

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_SyncEvent_liquidityPoolNewEntityLoaderContext = { readonly load: (_1:id, _2:{ readonly loaders?: liquidityPoolNewLoaderConfig }) => void };

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_SyncEvent_tokenEntityLoaderContext = { readonly load: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_SyncEvent_contractRegistrations = {
  readonly addPool: (_1:Ethers_ethAddress) => void; 
  readonly addPoolFactory: (_1:Ethers_ethAddress) => void; 
  readonly addVoter: (_1:Ethers_ethAddress) => void; 
  readonly addVotingReward: (_1:Ethers_ethAddress) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type PoolContract_SyncEvent_loaderContext = {
  readonly log: Logs_userLogger; 
  readonly contractRegistration: PoolContract_SyncEvent_contractRegistrations; 
  readonly LiquidityPoolNew: PoolContract_SyncEvent_liquidityPoolNewEntityLoaderContext; 
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
export type PoolFactoryContract_PoolCreatedEvent_liquidityPoolDailySnapshotEntityHandlerContext = { readonly set: (_1:liquidityPoolDailySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type PoolFactoryContract_PoolCreatedEvent_liquidityPoolDailySnapshotEntityHandlerContextAsync = { readonly set: (_1:liquidityPoolDailySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type PoolFactoryContract_PoolCreatedEvent_liquidityPoolHourlySnapshotEntityHandlerContext = { readonly set: (_1:liquidityPoolHourlySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type PoolFactoryContract_PoolCreatedEvent_liquidityPoolHourlySnapshotEntityHandlerContextAsync = { readonly set: (_1:liquidityPoolHourlySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type PoolFactoryContract_PoolCreatedEvent_liquidityPoolNewEntityHandlerContext = {
  readonly getToken0: (_1:liquidityPoolNewEntity) => tokenEntity; 
  readonly getToken1: (_1:liquidityPoolNewEntity) => tokenEntity; 
  readonly set: (_1:liquidityPoolNewEntity) => void; 
  readonly delete: (_1:id) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type PoolFactoryContract_PoolCreatedEvent_liquidityPoolNewEntityHandlerContextAsync = {
  readonly getToken0: (_1:liquidityPoolNewEntity) => Promise<tokenEntity>; 
  readonly getToken1: (_1:liquidityPoolNewEntity) => Promise<tokenEntity>; 
  readonly set: (_1:liquidityPoolNewEntity) => void; 
  readonly delete: (_1:id) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type PoolFactoryContract_PoolCreatedEvent_liquidityPoolWeeklySnapshotEntityHandlerContext = { readonly set: (_1:liquidityPoolWeeklySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type PoolFactoryContract_PoolCreatedEvent_liquidityPoolWeeklySnapshotEntityHandlerContextAsync = { readonly set: (_1:liquidityPoolWeeklySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type PoolFactoryContract_PoolCreatedEvent_tokenEntityHandlerContext = {
  readonly poolTokens: Array<(undefined | tokenEntity)>; 
  readonly get: (_1:id) => (undefined | tokenEntity); 
  readonly set: (_1:tokenEntity) => void; 
  readonly delete: (_1:id) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type PoolFactoryContract_PoolCreatedEvent_tokenEntityHandlerContextAsync = {
  readonly poolTokens: Array<(undefined | tokenEntity)>; 
  readonly get: (_1:id) => Promise<(undefined | tokenEntity)>; 
  readonly set: (_1:tokenEntity) => void; 
  readonly delete: (_1:id) => void
};

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
  readonly LiquidityPoolDailySnapshot: PoolFactoryContract_PoolCreatedEvent_liquidityPoolDailySnapshotEntityHandlerContext; 
  readonly LiquidityPoolHourlySnapshot: PoolFactoryContract_PoolCreatedEvent_liquidityPoolHourlySnapshotEntityHandlerContext; 
  readonly LiquidityPoolNew: PoolFactoryContract_PoolCreatedEvent_liquidityPoolNewEntityHandlerContext; 
  readonly LiquidityPoolWeeklySnapshot: PoolFactoryContract_PoolCreatedEvent_liquidityPoolWeeklySnapshotEntityHandlerContext; 
  readonly Token: PoolFactoryContract_PoolCreatedEvent_tokenEntityHandlerContext; 
  readonly TokenDailySnapshot: PoolFactoryContract_PoolCreatedEvent_tokenDailySnapshotEntityHandlerContext; 
  readonly TokenHourlySnapshot: PoolFactoryContract_PoolCreatedEvent_tokenHourlySnapshotEntityHandlerContext; 
  readonly TokenWeeklySnapshot: PoolFactoryContract_PoolCreatedEvent_tokenWeeklySnapshotEntityHandlerContext; 
  readonly User: PoolFactoryContract_PoolCreatedEvent_userEntityHandlerContext
};

// tslint:disable-next-line:interface-over-type-literal
export type PoolFactoryContract_PoolCreatedEvent_handlerContextAsync = {
  readonly log: Logs_userLogger; 
  readonly LiquidityPoolDailySnapshot: PoolFactoryContract_PoolCreatedEvent_liquidityPoolDailySnapshotEntityHandlerContextAsync; 
  readonly LiquidityPoolHourlySnapshot: PoolFactoryContract_PoolCreatedEvent_liquidityPoolHourlySnapshotEntityHandlerContextAsync; 
  readonly LiquidityPoolNew: PoolFactoryContract_PoolCreatedEvent_liquidityPoolNewEntityHandlerContextAsync; 
  readonly LiquidityPoolWeeklySnapshot: PoolFactoryContract_PoolCreatedEvent_liquidityPoolWeeklySnapshotEntityHandlerContextAsync; 
  readonly Token: PoolFactoryContract_PoolCreatedEvent_tokenEntityHandlerContextAsync; 
  readonly TokenDailySnapshot: PoolFactoryContract_PoolCreatedEvent_tokenDailySnapshotEntityHandlerContextAsync; 
  readonly TokenHourlySnapshot: PoolFactoryContract_PoolCreatedEvent_tokenHourlySnapshotEntityHandlerContextAsync; 
  readonly TokenWeeklySnapshot: PoolFactoryContract_PoolCreatedEvent_tokenWeeklySnapshotEntityHandlerContextAsync; 
  readonly User: PoolFactoryContract_PoolCreatedEvent_userEntityHandlerContextAsync
};

// tslint:disable-next-line:interface-over-type-literal
export type PoolFactoryContract_PoolCreatedEvent_tokenEntityLoaderContext = { readonly poolTokensLoad: (_1:id[]) => void; readonly load: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type PoolFactoryContract_PoolCreatedEvent_contractRegistrations = {
  readonly addPool: (_1:Ethers_ethAddress) => void; 
  readonly addPoolFactory: (_1:Ethers_ethAddress) => void; 
  readonly addVoter: (_1:Ethers_ethAddress) => void; 
  readonly addVotingReward: (_1:Ethers_ethAddress) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type PoolFactoryContract_PoolCreatedEvent_loaderContext = {
  readonly log: Logs_userLogger; 
  readonly contractRegistration: PoolFactoryContract_PoolCreatedEvent_contractRegistrations; 
  readonly Token: PoolFactoryContract_PoolCreatedEvent_tokenEntityLoaderContext
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
export type VoterContract_DistributeRewardEvent_liquidityPoolDailySnapshotEntityHandlerContext = { readonly set: (_1:liquidityPoolDailySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_DistributeRewardEvent_liquidityPoolDailySnapshotEntityHandlerContextAsync = { readonly set: (_1:liquidityPoolDailySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_DistributeRewardEvent_liquidityPoolHourlySnapshotEntityHandlerContext = { readonly set: (_1:liquidityPoolHourlySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_DistributeRewardEvent_liquidityPoolHourlySnapshotEntityHandlerContextAsync = { readonly set: (_1:liquidityPoolHourlySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_DistributeRewardEvent_liquidityPoolNewEntityHandlerContext = {
  readonly emissionSinglePool: (undefined | liquidityPoolNewEntity); 
  readonly get: (_1:id) => (undefined | liquidityPoolNewEntity); 
  readonly getToken0: (_1:liquidityPoolNewEntity) => tokenEntity; 
  readonly getToken1: (_1:liquidityPoolNewEntity) => tokenEntity; 
  readonly set: (_1:liquidityPoolNewEntity) => void; 
  readonly delete: (_1:id) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_DistributeRewardEvent_liquidityPoolNewEntityHandlerContextAsync = {
  readonly emissionSinglePool: (undefined | liquidityPoolNewEntity); 
  readonly get: (_1:id) => Promise<(undefined | liquidityPoolNewEntity)>; 
  readonly getToken0: (_1:liquidityPoolNewEntity) => Promise<tokenEntity>; 
  readonly getToken1: (_1:liquidityPoolNewEntity) => Promise<tokenEntity>; 
  readonly set: (_1:liquidityPoolNewEntity) => void; 
  readonly delete: (_1:id) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_DistributeRewardEvent_liquidityPoolWeeklySnapshotEntityHandlerContext = { readonly set: (_1:liquidityPoolWeeklySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_DistributeRewardEvent_liquidityPoolWeeklySnapshotEntityHandlerContextAsync = { readonly set: (_1:liquidityPoolWeeklySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_DistributeRewardEvent_tokenEntityHandlerContext = {
  readonly emissionRewardToken: (undefined | tokenEntity); 
  readonly get: (_1:id) => (undefined | tokenEntity); 
  readonly set: (_1:tokenEntity) => void; 
  readonly delete: (_1:id) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_DistributeRewardEvent_tokenEntityHandlerContextAsync = {
  readonly emissionRewardToken: (undefined | tokenEntity); 
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
  readonly LiquidityPoolDailySnapshot: VoterContract_DistributeRewardEvent_liquidityPoolDailySnapshotEntityHandlerContext; 
  readonly LiquidityPoolHourlySnapshot: VoterContract_DistributeRewardEvent_liquidityPoolHourlySnapshotEntityHandlerContext; 
  readonly LiquidityPoolNew: VoterContract_DistributeRewardEvent_liquidityPoolNewEntityHandlerContext; 
  readonly LiquidityPoolWeeklySnapshot: VoterContract_DistributeRewardEvent_liquidityPoolWeeklySnapshotEntityHandlerContext; 
  readonly Token: VoterContract_DistributeRewardEvent_tokenEntityHandlerContext; 
  readonly TokenDailySnapshot: VoterContract_DistributeRewardEvent_tokenDailySnapshotEntityHandlerContext; 
  readonly TokenHourlySnapshot: VoterContract_DistributeRewardEvent_tokenHourlySnapshotEntityHandlerContext; 
  readonly TokenWeeklySnapshot: VoterContract_DistributeRewardEvent_tokenWeeklySnapshotEntityHandlerContext; 
  readonly User: VoterContract_DistributeRewardEvent_userEntityHandlerContext
};

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_DistributeRewardEvent_handlerContextAsync = {
  readonly log: Logs_userLogger; 
  readonly LiquidityPoolDailySnapshot: VoterContract_DistributeRewardEvent_liquidityPoolDailySnapshotEntityHandlerContextAsync; 
  readonly LiquidityPoolHourlySnapshot: VoterContract_DistributeRewardEvent_liquidityPoolHourlySnapshotEntityHandlerContextAsync; 
  readonly LiquidityPoolNew: VoterContract_DistributeRewardEvent_liquidityPoolNewEntityHandlerContextAsync; 
  readonly LiquidityPoolWeeklySnapshot: VoterContract_DistributeRewardEvent_liquidityPoolWeeklySnapshotEntityHandlerContextAsync; 
  readonly Token: VoterContract_DistributeRewardEvent_tokenEntityHandlerContextAsync; 
  readonly TokenDailySnapshot: VoterContract_DistributeRewardEvent_tokenDailySnapshotEntityHandlerContextAsync; 
  readonly TokenHourlySnapshot: VoterContract_DistributeRewardEvent_tokenHourlySnapshotEntityHandlerContextAsync; 
  readonly TokenWeeklySnapshot: VoterContract_DistributeRewardEvent_tokenWeeklySnapshotEntityHandlerContextAsync; 
  readonly User: VoterContract_DistributeRewardEvent_userEntityHandlerContextAsync
};

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_DistributeRewardEvent_liquidityPoolNewEntityLoaderContext = { readonly emissionSinglePoolLoad: (_1:id, _2:{ readonly loaders?: liquidityPoolNewLoaderConfig }) => void; readonly load: (_1:id, _2:{ readonly loaders?: liquidityPoolNewLoaderConfig }) => void };

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_DistributeRewardEvent_tokenEntityLoaderContext = { readonly emissionRewardTokenLoad: (_1:id) => void; readonly load: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_DistributeRewardEvent_contractRegistrations = {
  readonly addPool: (_1:Ethers_ethAddress) => void; 
  readonly addPoolFactory: (_1:Ethers_ethAddress) => void; 
  readonly addVoter: (_1:Ethers_ethAddress) => void; 
  readonly addVotingReward: (_1:Ethers_ethAddress) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_DistributeRewardEvent_loaderContext = {
  readonly log: Logs_userLogger; 
  readonly contractRegistration: VoterContract_DistributeRewardEvent_contractRegistrations; 
  readonly LiquidityPoolNew: VoterContract_DistributeRewardEvent_liquidityPoolNewEntityLoaderContext; 
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
export type VoterContract_GaugeCreatedEvent_liquidityPoolDailySnapshotEntityHandlerContext = {
  readonly get: (_1:id) => (undefined | liquidityPoolDailySnapshotEntity); 
  readonly set: (_1:liquidityPoolDailySnapshotEntity) => void; 
  readonly delete: (_1:id) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_GaugeCreatedEvent_liquidityPoolDailySnapshotEntityHandlerContextAsync = {
  readonly get: (_1:id) => Promise<(undefined | liquidityPoolDailySnapshotEntity)>; 
  readonly set: (_1:liquidityPoolDailySnapshotEntity) => void; 
  readonly delete: (_1:id) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_GaugeCreatedEvent_liquidityPoolHourlySnapshotEntityHandlerContext = {
  readonly get: (_1:id) => (undefined | liquidityPoolHourlySnapshotEntity); 
  readonly set: (_1:liquidityPoolHourlySnapshotEntity) => void; 
  readonly delete: (_1:id) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_GaugeCreatedEvent_liquidityPoolHourlySnapshotEntityHandlerContextAsync = {
  readonly get: (_1:id) => Promise<(undefined | liquidityPoolHourlySnapshotEntity)>; 
  readonly set: (_1:liquidityPoolHourlySnapshotEntity) => void; 
  readonly delete: (_1:id) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_GaugeCreatedEvent_liquidityPoolNewEntityHandlerContext = {
  readonly get: (_1:id) => (undefined | liquidityPoolNewEntity); 
  readonly getToken0: (_1:liquidityPoolNewEntity) => tokenEntity; 
  readonly getToken1: (_1:liquidityPoolNewEntity) => tokenEntity; 
  readonly set: (_1:liquidityPoolNewEntity) => void; 
  readonly delete: (_1:id) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_GaugeCreatedEvent_liquidityPoolNewEntityHandlerContextAsync = {
  readonly get: (_1:id) => Promise<(undefined | liquidityPoolNewEntity)>; 
  readonly getToken0: (_1:liquidityPoolNewEntity) => Promise<tokenEntity>; 
  readonly getToken1: (_1:liquidityPoolNewEntity) => Promise<tokenEntity>; 
  readonly set: (_1:liquidityPoolNewEntity) => void; 
  readonly delete: (_1:id) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_GaugeCreatedEvent_liquidityPoolWeeklySnapshotEntityHandlerContext = {
  readonly get: (_1:id) => (undefined | liquidityPoolWeeklySnapshotEntity); 
  readonly set: (_1:liquidityPoolWeeklySnapshotEntity) => void; 
  readonly delete: (_1:id) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_GaugeCreatedEvent_liquidityPoolWeeklySnapshotEntityHandlerContextAsync = {
  readonly get: (_1:id) => Promise<(undefined | liquidityPoolWeeklySnapshotEntity)>; 
  readonly set: (_1:liquidityPoolWeeklySnapshotEntity) => void; 
  readonly delete: (_1:id) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_GaugeCreatedEvent_tokenEntityHandlerContext = {
  readonly get: (_1:id) => (undefined | tokenEntity); 
  readonly set: (_1:tokenEntity) => void; 
  readonly delete: (_1:id) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_GaugeCreatedEvent_tokenEntityHandlerContextAsync = {
  readonly get: (_1:id) => Promise<(undefined | tokenEntity)>; 
  readonly set: (_1:tokenEntity) => void; 
  readonly delete: (_1:id) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_GaugeCreatedEvent_tokenDailySnapshotEntityHandlerContext = {
  readonly get: (_1:id) => (undefined | tokenDailySnapshotEntity); 
  readonly set: (_1:tokenDailySnapshotEntity) => void; 
  readonly delete: (_1:id) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_GaugeCreatedEvent_tokenDailySnapshotEntityHandlerContextAsync = {
  readonly get: (_1:id) => Promise<(undefined | tokenDailySnapshotEntity)>; 
  readonly set: (_1:tokenDailySnapshotEntity) => void; 
  readonly delete: (_1:id) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_GaugeCreatedEvent_tokenHourlySnapshotEntityHandlerContext = {
  readonly get: (_1:id) => (undefined | tokenHourlySnapshotEntity); 
  readonly set: (_1:tokenHourlySnapshotEntity) => void; 
  readonly delete: (_1:id) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_GaugeCreatedEvent_tokenHourlySnapshotEntityHandlerContextAsync = {
  readonly get: (_1:id) => Promise<(undefined | tokenHourlySnapshotEntity)>; 
  readonly set: (_1:tokenHourlySnapshotEntity) => void; 
  readonly delete: (_1:id) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_GaugeCreatedEvent_tokenWeeklySnapshotEntityHandlerContext = {
  readonly get: (_1:id) => (undefined | tokenWeeklySnapshotEntity); 
  readonly set: (_1:tokenWeeklySnapshotEntity) => void; 
  readonly delete: (_1:id) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_GaugeCreatedEvent_tokenWeeklySnapshotEntityHandlerContextAsync = {
  readonly get: (_1:id) => Promise<(undefined | tokenWeeklySnapshotEntity)>; 
  readonly set: (_1:tokenWeeklySnapshotEntity) => void; 
  readonly delete: (_1:id) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_GaugeCreatedEvent_userEntityHandlerContext = {
  readonly get: (_1:id) => (undefined | userEntity); 
  readonly set: (_1:userEntity) => void; 
  readonly delete: (_1:id) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_GaugeCreatedEvent_userEntityHandlerContextAsync = {
  readonly get: (_1:id) => Promise<(undefined | userEntity)>; 
  readonly set: (_1:userEntity) => void; 
  readonly delete: (_1:id) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_GaugeCreatedEvent_handlerContext = {
  readonly log: Logs_userLogger; 
  readonly LiquidityPoolDailySnapshot: VoterContract_GaugeCreatedEvent_liquidityPoolDailySnapshotEntityHandlerContext; 
  readonly LiquidityPoolHourlySnapshot: VoterContract_GaugeCreatedEvent_liquidityPoolHourlySnapshotEntityHandlerContext; 
  readonly LiquidityPoolNew: VoterContract_GaugeCreatedEvent_liquidityPoolNewEntityHandlerContext; 
  readonly LiquidityPoolWeeklySnapshot: VoterContract_GaugeCreatedEvent_liquidityPoolWeeklySnapshotEntityHandlerContext; 
  readonly Token: VoterContract_GaugeCreatedEvent_tokenEntityHandlerContext; 
  readonly TokenDailySnapshot: VoterContract_GaugeCreatedEvent_tokenDailySnapshotEntityHandlerContext; 
  readonly TokenHourlySnapshot: VoterContract_GaugeCreatedEvent_tokenHourlySnapshotEntityHandlerContext; 
  readonly TokenWeeklySnapshot: VoterContract_GaugeCreatedEvent_tokenWeeklySnapshotEntityHandlerContext; 
  readonly User: VoterContract_GaugeCreatedEvent_userEntityHandlerContext
};

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_GaugeCreatedEvent_handlerContextAsync = {
  readonly log: Logs_userLogger; 
  readonly LiquidityPoolDailySnapshot: VoterContract_GaugeCreatedEvent_liquidityPoolDailySnapshotEntityHandlerContextAsync; 
  readonly LiquidityPoolHourlySnapshot: VoterContract_GaugeCreatedEvent_liquidityPoolHourlySnapshotEntityHandlerContextAsync; 
  readonly LiquidityPoolNew: VoterContract_GaugeCreatedEvent_liquidityPoolNewEntityHandlerContextAsync; 
  readonly LiquidityPoolWeeklySnapshot: VoterContract_GaugeCreatedEvent_liquidityPoolWeeklySnapshotEntityHandlerContextAsync; 
  readonly Token: VoterContract_GaugeCreatedEvent_tokenEntityHandlerContextAsync; 
  readonly TokenDailySnapshot: VoterContract_GaugeCreatedEvent_tokenDailySnapshotEntityHandlerContextAsync; 
  readonly TokenHourlySnapshot: VoterContract_GaugeCreatedEvent_tokenHourlySnapshotEntityHandlerContextAsync; 
  readonly TokenWeeklySnapshot: VoterContract_GaugeCreatedEvent_tokenWeeklySnapshotEntityHandlerContextAsync; 
  readonly User: VoterContract_GaugeCreatedEvent_userEntityHandlerContextAsync
};

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_GaugeCreatedEvent_tokenDailySnapshotEntityLoaderContext = { readonly load: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_GaugeCreatedEvent_liquidityPoolDailySnapshotEntityLoaderContext = { readonly load: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_GaugeCreatedEvent_userEntityLoaderContext = { readonly load: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_GaugeCreatedEvent_tokenWeeklySnapshotEntityLoaderContext = { readonly load: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_GaugeCreatedEvent_liquidityPoolWeeklySnapshotEntityLoaderContext = { readonly load: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_GaugeCreatedEvent_liquidityPoolNewEntityLoaderContext = { readonly load: (_1:id, _2:{ readonly loaders?: liquidityPoolNewLoaderConfig }) => void };

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_GaugeCreatedEvent_tokenHourlySnapshotEntityLoaderContext = { readonly load: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_GaugeCreatedEvent_liquidityPoolHourlySnapshotEntityLoaderContext = { readonly load: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_GaugeCreatedEvent_tokenEntityLoaderContext = { readonly load: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_GaugeCreatedEvent_contractRegistrations = {
  readonly addPool: (_1:Ethers_ethAddress) => void; 
  readonly addPoolFactory: (_1:Ethers_ethAddress) => void; 
  readonly addVoter: (_1:Ethers_ethAddress) => void; 
  readonly addVotingReward: (_1:Ethers_ethAddress) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type VoterContract_GaugeCreatedEvent_loaderContext = {
  readonly log: Logs_userLogger; 
  readonly contractRegistration: VoterContract_GaugeCreatedEvent_contractRegistrations; 
  readonly TokenDailySnapshot: VoterContract_GaugeCreatedEvent_tokenDailySnapshotEntityLoaderContext; 
  readonly LiquidityPoolDailySnapshot: VoterContract_GaugeCreatedEvent_liquidityPoolDailySnapshotEntityLoaderContext; 
  readonly User: VoterContract_GaugeCreatedEvent_userEntityLoaderContext; 
  readonly TokenWeeklySnapshot: VoterContract_GaugeCreatedEvent_tokenWeeklySnapshotEntityLoaderContext; 
  readonly LiquidityPoolWeeklySnapshot: VoterContract_GaugeCreatedEvent_liquidityPoolWeeklySnapshotEntityLoaderContext; 
  readonly LiquidityPoolNew: VoterContract_GaugeCreatedEvent_liquidityPoolNewEntityLoaderContext; 
  readonly TokenHourlySnapshot: VoterContract_GaugeCreatedEvent_tokenHourlySnapshotEntityLoaderContext; 
  readonly LiquidityPoolHourlySnapshot: VoterContract_GaugeCreatedEvent_liquidityPoolHourlySnapshotEntityLoaderContext; 
  readonly Token: VoterContract_GaugeCreatedEvent_tokenEntityLoaderContext
};

// tslint:disable-next-line:interface-over-type-literal
export type VotingRewardContract_NotifyRewardEvent_eventArgs = {
  readonly from: Ethers_ethAddress; 
  readonly reward: Ethers_ethAddress; 
  readonly epoch: Ethers_BigInt_t; 
  readonly amount: Ethers_BigInt_t
};

// tslint:disable-next-line:interface-over-type-literal
export type VotingRewardContract_NotifyRewardEvent_log = eventLog<VotingRewardContract_NotifyRewardEvent_eventArgs>;
export type VotingRewardContract_NotifyReward_EventLog = VotingRewardContract_NotifyRewardEvent_log;

// tslint:disable-next-line:interface-over-type-literal
export type VotingRewardContract_NotifyRewardEvent_liquidityPoolDailySnapshotEntityHandlerContext = { readonly set: (_1:liquidityPoolDailySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type VotingRewardContract_NotifyRewardEvent_liquidityPoolDailySnapshotEntityHandlerContextAsync = { readonly set: (_1:liquidityPoolDailySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type VotingRewardContract_NotifyRewardEvent_liquidityPoolHourlySnapshotEntityHandlerContext = { readonly set: (_1:liquidityPoolHourlySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type VotingRewardContract_NotifyRewardEvent_liquidityPoolHourlySnapshotEntityHandlerContextAsync = { readonly set: (_1:liquidityPoolHourlySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type VotingRewardContract_NotifyRewardEvent_liquidityPoolNewEntityHandlerContext = {
  readonly bribeSinglePool: (undefined | liquidityPoolNewEntity); 
  readonly get: (_1:id) => (undefined | liquidityPoolNewEntity); 
  readonly getToken0: (_1:liquidityPoolNewEntity) => tokenEntity; 
  readonly getToken1: (_1:liquidityPoolNewEntity) => tokenEntity; 
  readonly set: (_1:liquidityPoolNewEntity) => void; 
  readonly delete: (_1:id) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type VotingRewardContract_NotifyRewardEvent_liquidityPoolNewEntityHandlerContextAsync = {
  readonly bribeSinglePool: (undefined | liquidityPoolNewEntity); 
  readonly get: (_1:id) => Promise<(undefined | liquidityPoolNewEntity)>; 
  readonly getToken0: (_1:liquidityPoolNewEntity) => Promise<tokenEntity>; 
  readonly getToken1: (_1:liquidityPoolNewEntity) => Promise<tokenEntity>; 
  readonly set: (_1:liquidityPoolNewEntity) => void; 
  readonly delete: (_1:id) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type VotingRewardContract_NotifyRewardEvent_liquidityPoolWeeklySnapshotEntityHandlerContext = { readonly set: (_1:liquidityPoolWeeklySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type VotingRewardContract_NotifyRewardEvent_liquidityPoolWeeklySnapshotEntityHandlerContextAsync = { readonly set: (_1:liquidityPoolWeeklySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type VotingRewardContract_NotifyRewardEvent_tokenEntityHandlerContext = {
  readonly bribeRewardToken: (undefined | tokenEntity); 
  readonly get: (_1:id) => (undefined | tokenEntity); 
  readonly set: (_1:tokenEntity) => void; 
  readonly delete: (_1:id) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type VotingRewardContract_NotifyRewardEvent_tokenEntityHandlerContextAsync = {
  readonly bribeRewardToken: (undefined | tokenEntity); 
  readonly get: (_1:id) => Promise<(undefined | tokenEntity)>; 
  readonly set: (_1:tokenEntity) => void; 
  readonly delete: (_1:id) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type VotingRewardContract_NotifyRewardEvent_tokenDailySnapshotEntityHandlerContext = { readonly set: (_1:tokenDailySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type VotingRewardContract_NotifyRewardEvent_tokenDailySnapshotEntityHandlerContextAsync = { readonly set: (_1:tokenDailySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type VotingRewardContract_NotifyRewardEvent_tokenHourlySnapshotEntityHandlerContext = { readonly set: (_1:tokenHourlySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type VotingRewardContract_NotifyRewardEvent_tokenHourlySnapshotEntityHandlerContextAsync = { readonly set: (_1:tokenHourlySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type VotingRewardContract_NotifyRewardEvent_tokenWeeklySnapshotEntityHandlerContext = { readonly set: (_1:tokenWeeklySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type VotingRewardContract_NotifyRewardEvent_tokenWeeklySnapshotEntityHandlerContextAsync = { readonly set: (_1:tokenWeeklySnapshotEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type VotingRewardContract_NotifyRewardEvent_userEntityHandlerContext = { readonly set: (_1:userEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type VotingRewardContract_NotifyRewardEvent_userEntityHandlerContextAsync = { readonly set: (_1:userEntity) => void; readonly delete: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type VotingRewardContract_NotifyRewardEvent_handlerContext = {
  readonly log: Logs_userLogger; 
  readonly LiquidityPoolDailySnapshot: VotingRewardContract_NotifyRewardEvent_liquidityPoolDailySnapshotEntityHandlerContext; 
  readonly LiquidityPoolHourlySnapshot: VotingRewardContract_NotifyRewardEvent_liquidityPoolHourlySnapshotEntityHandlerContext; 
  readonly LiquidityPoolNew: VotingRewardContract_NotifyRewardEvent_liquidityPoolNewEntityHandlerContext; 
  readonly LiquidityPoolWeeklySnapshot: VotingRewardContract_NotifyRewardEvent_liquidityPoolWeeklySnapshotEntityHandlerContext; 
  readonly Token: VotingRewardContract_NotifyRewardEvent_tokenEntityHandlerContext; 
  readonly TokenDailySnapshot: VotingRewardContract_NotifyRewardEvent_tokenDailySnapshotEntityHandlerContext; 
  readonly TokenHourlySnapshot: VotingRewardContract_NotifyRewardEvent_tokenHourlySnapshotEntityHandlerContext; 
  readonly TokenWeeklySnapshot: VotingRewardContract_NotifyRewardEvent_tokenWeeklySnapshotEntityHandlerContext; 
  readonly User: VotingRewardContract_NotifyRewardEvent_userEntityHandlerContext
};

// tslint:disable-next-line:interface-over-type-literal
export type VotingRewardContract_NotifyRewardEvent_handlerContextAsync = {
  readonly log: Logs_userLogger; 
  readonly LiquidityPoolDailySnapshot: VotingRewardContract_NotifyRewardEvent_liquidityPoolDailySnapshotEntityHandlerContextAsync; 
  readonly LiquidityPoolHourlySnapshot: VotingRewardContract_NotifyRewardEvent_liquidityPoolHourlySnapshotEntityHandlerContextAsync; 
  readonly LiquidityPoolNew: VotingRewardContract_NotifyRewardEvent_liquidityPoolNewEntityHandlerContextAsync; 
  readonly LiquidityPoolWeeklySnapshot: VotingRewardContract_NotifyRewardEvent_liquidityPoolWeeklySnapshotEntityHandlerContextAsync; 
  readonly Token: VotingRewardContract_NotifyRewardEvent_tokenEntityHandlerContextAsync; 
  readonly TokenDailySnapshot: VotingRewardContract_NotifyRewardEvent_tokenDailySnapshotEntityHandlerContextAsync; 
  readonly TokenHourlySnapshot: VotingRewardContract_NotifyRewardEvent_tokenHourlySnapshotEntityHandlerContextAsync; 
  readonly TokenWeeklySnapshot: VotingRewardContract_NotifyRewardEvent_tokenWeeklySnapshotEntityHandlerContextAsync; 
  readonly User: VotingRewardContract_NotifyRewardEvent_userEntityHandlerContextAsync
};

// tslint:disable-next-line:interface-over-type-literal
export type VotingRewardContract_NotifyRewardEvent_liquidityPoolNewEntityLoaderContext = { readonly bribeSinglePoolLoad: (_1:id, _2:{ readonly loaders?: liquidityPoolNewLoaderConfig }) => void; readonly load: (_1:id, _2:{ readonly loaders?: liquidityPoolNewLoaderConfig }) => void };

// tslint:disable-next-line:interface-over-type-literal
export type VotingRewardContract_NotifyRewardEvent_tokenEntityLoaderContext = { readonly bribeRewardTokenLoad: (_1:id) => void; readonly load: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type VotingRewardContract_NotifyRewardEvent_contractRegistrations = {
  readonly addPool: (_1:Ethers_ethAddress) => void; 
  readonly addPoolFactory: (_1:Ethers_ethAddress) => void; 
  readonly addVoter: (_1:Ethers_ethAddress) => void; 
  readonly addVotingReward: (_1:Ethers_ethAddress) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type VotingRewardContract_NotifyRewardEvent_loaderContext = {
  readonly log: Logs_userLogger; 
  readonly contractRegistration: VotingRewardContract_NotifyRewardEvent_contractRegistrations; 
  readonly LiquidityPoolNew: VotingRewardContract_NotifyRewardEvent_liquidityPoolNewEntityLoaderContext; 
  readonly Token: VotingRewardContract_NotifyRewardEvent_tokenEntityLoaderContext
};

// tslint:disable-next-line:interface-over-type-literal
export type chainId = number;
