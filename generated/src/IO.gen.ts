/* TypeScript file generated from IO.res by genType. */
/* eslint-disable import/first */


import type {EventSyncState_eventSyncState as DbFunctions_EventSyncState_eventSyncState} from './DbFunctions.gen';

import type {dynamicContractRegistryEntity as Types_dynamicContractRegistryEntity} from './Types.gen';

import type {ethAddress as Ethers_ethAddress} from '../src/bindings/Ethers.gen';

import type {gaugeEntity as Types_gaugeEntity} from './Types.gen';

import type {inMemoryStoreRow as Types_inMemoryStoreRow} from './Types.gen';

import type {latestETHPriceEntity as Types_latestETHPriceEntity} from './Types.gen';

import type {liquidityPoolDailySnapshotEntity as Types_liquidityPoolDailySnapshotEntity} from './Types.gen';

import type {liquidityPoolEntity as Types_liquidityPoolEntity} from './Types.gen';

import type {liquidityPoolHourlySnapshotEntity as Types_liquidityPoolHourlySnapshotEntity} from './Types.gen';

import type {liquidityPoolUserMappingEntity as Types_liquidityPoolUserMappingEntity} from './Types.gen';

import type {liquidityPoolWeeklySnapshotEntity as Types_liquidityPoolWeeklySnapshotEntity} from './Types.gen';

import type {rawEventsEntity as Types_rawEventsEntity} from './Types.gen';

import type {stateStoreEntity as Types_stateStoreEntity} from './Types.gen';

import type {tokenDailySnapshotEntity as Types_tokenDailySnapshotEntity} from './Types.gen';

import type {tokenEntity as Types_tokenEntity} from './Types.gen';

import type {tokenHourlySnapshotEntity as Types_tokenHourlySnapshotEntity} from './Types.gen';

import type {tokenWeeklySnapshotEntity as Types_tokenWeeklySnapshotEntity} from './Types.gen';

import type {userEntity as Types_userEntity} from './Types.gen';

// tslint:disable-next-line:interface-over-type-literal
export type InMemoryStore_stringHasher<val> = (_1:val) => string;

// tslint:disable-next-line:interface-over-type-literal
export type InMemoryStore_storeState<entity,entityKey> = { readonly dict: {[id: string]: Types_inMemoryStoreRow<entity>}; readonly hasher: InMemoryStore_stringHasher<entityKey> };

// tslint:disable-next-line:interface-over-type-literal
export type InMemoryStore_EventSyncState_value = DbFunctions_EventSyncState_eventSyncState;

// tslint:disable-next-line:interface-over-type-literal
export type InMemoryStore_EventSyncState_key = number;

// tslint:disable-next-line:interface-over-type-literal
export type InMemoryStore_EventSyncState_t = InMemoryStore_storeState<InMemoryStore_EventSyncState_value,InMemoryStore_EventSyncState_key>;

// tslint:disable-next-line:interface-over-type-literal
export type InMemoryStore_rawEventsKey = { readonly chainId: number; readonly eventId: string };

// tslint:disable-next-line:interface-over-type-literal
export type InMemoryStore_RawEvents_value = Types_rawEventsEntity;

// tslint:disable-next-line:interface-over-type-literal
export type InMemoryStore_RawEvents_key = InMemoryStore_rawEventsKey;

// tslint:disable-next-line:interface-over-type-literal
export type InMemoryStore_RawEvents_t = InMemoryStore_storeState<InMemoryStore_RawEvents_value,InMemoryStore_RawEvents_key>;

// tslint:disable-next-line:interface-over-type-literal
export type InMemoryStore_dynamicContractRegistryKey = { readonly chainId: number; readonly contractAddress: Ethers_ethAddress };

// tslint:disable-next-line:interface-over-type-literal
export type InMemoryStore_DynamicContractRegistry_value = Types_dynamicContractRegistryEntity;

// tslint:disable-next-line:interface-over-type-literal
export type InMemoryStore_DynamicContractRegistry_key = InMemoryStore_dynamicContractRegistryKey;

// tslint:disable-next-line:interface-over-type-literal
export type InMemoryStore_DynamicContractRegistry_t = InMemoryStore_storeState<InMemoryStore_DynamicContractRegistry_value,InMemoryStore_DynamicContractRegistry_key>;

// tslint:disable-next-line:interface-over-type-literal
export type InMemoryStore_Gauge_value = Types_gaugeEntity;

// tslint:disable-next-line:interface-over-type-literal
export type InMemoryStore_Gauge_key = string;

// tslint:disable-next-line:interface-over-type-literal
export type InMemoryStore_Gauge_t = InMemoryStore_storeState<InMemoryStore_Gauge_value,InMemoryStore_Gauge_key>;

// tslint:disable-next-line:interface-over-type-literal
export type InMemoryStore_LatestETHPrice_value = Types_latestETHPriceEntity;

// tslint:disable-next-line:interface-over-type-literal
export type InMemoryStore_LatestETHPrice_key = string;

// tslint:disable-next-line:interface-over-type-literal
export type InMemoryStore_LatestETHPrice_t = InMemoryStore_storeState<InMemoryStore_LatestETHPrice_value,InMemoryStore_LatestETHPrice_key>;

// tslint:disable-next-line:interface-over-type-literal
export type InMemoryStore_LiquidityPool_value = Types_liquidityPoolEntity;

// tslint:disable-next-line:interface-over-type-literal
export type InMemoryStore_LiquidityPool_key = string;

// tslint:disable-next-line:interface-over-type-literal
export type InMemoryStore_LiquidityPool_t = InMemoryStore_storeState<InMemoryStore_LiquidityPool_value,InMemoryStore_LiquidityPool_key>;

// tslint:disable-next-line:interface-over-type-literal
export type InMemoryStore_LiquidityPoolDailySnapshot_value = Types_liquidityPoolDailySnapshotEntity;

// tslint:disable-next-line:interface-over-type-literal
export type InMemoryStore_LiquidityPoolDailySnapshot_key = string;

// tslint:disable-next-line:interface-over-type-literal
export type InMemoryStore_LiquidityPoolDailySnapshot_t = InMemoryStore_storeState<InMemoryStore_LiquidityPoolDailySnapshot_value,InMemoryStore_LiquidityPoolDailySnapshot_key>;

// tslint:disable-next-line:interface-over-type-literal
export type InMemoryStore_LiquidityPoolHourlySnapshot_value = Types_liquidityPoolHourlySnapshotEntity;

// tslint:disable-next-line:interface-over-type-literal
export type InMemoryStore_LiquidityPoolHourlySnapshot_key = string;

// tslint:disable-next-line:interface-over-type-literal
export type InMemoryStore_LiquidityPoolHourlySnapshot_t = InMemoryStore_storeState<InMemoryStore_LiquidityPoolHourlySnapshot_value,InMemoryStore_LiquidityPoolHourlySnapshot_key>;

// tslint:disable-next-line:interface-over-type-literal
export type InMemoryStore_LiquidityPoolUserMapping_value = Types_liquidityPoolUserMappingEntity;

// tslint:disable-next-line:interface-over-type-literal
export type InMemoryStore_LiquidityPoolUserMapping_key = string;

// tslint:disable-next-line:interface-over-type-literal
export type InMemoryStore_LiquidityPoolUserMapping_t = InMemoryStore_storeState<InMemoryStore_LiquidityPoolUserMapping_value,InMemoryStore_LiquidityPoolUserMapping_key>;

// tslint:disable-next-line:interface-over-type-literal
export type InMemoryStore_LiquidityPoolWeeklySnapshot_value = Types_liquidityPoolWeeklySnapshotEntity;

// tslint:disable-next-line:interface-over-type-literal
export type InMemoryStore_LiquidityPoolWeeklySnapshot_key = string;

// tslint:disable-next-line:interface-over-type-literal
export type InMemoryStore_LiquidityPoolWeeklySnapshot_t = InMemoryStore_storeState<InMemoryStore_LiquidityPoolWeeklySnapshot_value,InMemoryStore_LiquidityPoolWeeklySnapshot_key>;

// tslint:disable-next-line:interface-over-type-literal
export type InMemoryStore_StateStore_value = Types_stateStoreEntity;

// tslint:disable-next-line:interface-over-type-literal
export type InMemoryStore_StateStore_key = string;

// tslint:disable-next-line:interface-over-type-literal
export type InMemoryStore_StateStore_t = InMemoryStore_storeState<InMemoryStore_StateStore_value,InMemoryStore_StateStore_key>;

// tslint:disable-next-line:interface-over-type-literal
export type InMemoryStore_Token_value = Types_tokenEntity;

// tslint:disable-next-line:interface-over-type-literal
export type InMemoryStore_Token_key = string;

// tslint:disable-next-line:interface-over-type-literal
export type InMemoryStore_Token_t = InMemoryStore_storeState<InMemoryStore_Token_value,InMemoryStore_Token_key>;

// tslint:disable-next-line:interface-over-type-literal
export type InMemoryStore_TokenDailySnapshot_value = Types_tokenDailySnapshotEntity;

// tslint:disable-next-line:interface-over-type-literal
export type InMemoryStore_TokenDailySnapshot_key = string;

// tslint:disable-next-line:interface-over-type-literal
export type InMemoryStore_TokenDailySnapshot_t = InMemoryStore_storeState<InMemoryStore_TokenDailySnapshot_value,InMemoryStore_TokenDailySnapshot_key>;

// tslint:disable-next-line:interface-over-type-literal
export type InMemoryStore_TokenHourlySnapshot_value = Types_tokenHourlySnapshotEntity;

// tslint:disable-next-line:interface-over-type-literal
export type InMemoryStore_TokenHourlySnapshot_key = string;

// tslint:disable-next-line:interface-over-type-literal
export type InMemoryStore_TokenHourlySnapshot_t = InMemoryStore_storeState<InMemoryStore_TokenHourlySnapshot_value,InMemoryStore_TokenHourlySnapshot_key>;

// tslint:disable-next-line:interface-over-type-literal
export type InMemoryStore_TokenWeeklySnapshot_value = Types_tokenWeeklySnapshotEntity;

// tslint:disable-next-line:interface-over-type-literal
export type InMemoryStore_TokenWeeklySnapshot_key = string;

// tslint:disable-next-line:interface-over-type-literal
export type InMemoryStore_TokenWeeklySnapshot_t = InMemoryStore_storeState<InMemoryStore_TokenWeeklySnapshot_value,InMemoryStore_TokenWeeklySnapshot_key>;

// tslint:disable-next-line:interface-over-type-literal
export type InMemoryStore_User_value = Types_userEntity;

// tslint:disable-next-line:interface-over-type-literal
export type InMemoryStore_User_key = string;

// tslint:disable-next-line:interface-over-type-literal
export type InMemoryStore_User_t = InMemoryStore_storeState<InMemoryStore_User_value,InMemoryStore_User_key>;

// tslint:disable-next-line:interface-over-type-literal
export type InMemoryStore_t = {
  readonly eventSyncState: InMemoryStore_EventSyncState_t; 
  readonly rawEvents: InMemoryStore_RawEvents_t; 
  readonly dynamicContractRegistry: InMemoryStore_DynamicContractRegistry_t; 
  readonly gauge: InMemoryStore_Gauge_t; 
  readonly latestETHPrice: InMemoryStore_LatestETHPrice_t; 
  readonly liquidityPool: InMemoryStore_LiquidityPool_t; 
  readonly liquidityPoolDailySnapshot: InMemoryStore_LiquidityPoolDailySnapshot_t; 
  readonly liquidityPoolHourlySnapshot: InMemoryStore_LiquidityPoolHourlySnapshot_t; 
  readonly liquidityPoolUserMapping: InMemoryStore_LiquidityPoolUserMapping_t; 
  readonly liquidityPoolWeeklySnapshot: InMemoryStore_LiquidityPoolWeeklySnapshot_t; 
  readonly stateStore: InMemoryStore_StateStore_t; 
  readonly token: InMemoryStore_Token_t; 
  readonly tokenDailySnapshot: InMemoryStore_TokenDailySnapshot_t; 
  readonly tokenHourlySnapshot: InMemoryStore_TokenHourlySnapshot_t; 
  readonly tokenWeeklySnapshot: InMemoryStore_TokenWeeklySnapshot_t; 
  readonly user: InMemoryStore_User_t
};
