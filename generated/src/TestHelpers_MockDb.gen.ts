/* TypeScript file generated from TestHelpers_MockDb.res by genType. */
/* eslint-disable import/first */


// @ts-ignore: Implicit any on import
const TestHelpers_MockDbBS = require('./TestHelpers_MockDb.bs');

import type {EventSyncState_eventSyncState as DbFunctions_EventSyncState_eventSyncState} from './DbFunctions.gen';

import type {InMemoryStore_dynamicContractRegistryKey as IO_InMemoryStore_dynamicContractRegistryKey} from './IO.gen';

import type {InMemoryStore_rawEventsKey as IO_InMemoryStore_rawEventsKey} from './IO.gen';

import type {InMemoryStore_t as IO_InMemoryStore_t} from './IO.gen';

import type {chainId as Types_chainId} from './Types.gen';

import type {dynamicContractRegistryEntity as Types_dynamicContractRegistryEntity} from './Types.gen';

import type {gaugeEntity as Types_gaugeEntity} from './Types.gen';

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
export type t = {
  readonly __dbInternal__: IO_InMemoryStore_t; 
  readonly entities: entities; 
  readonly rawEvents: storeOperations<IO_InMemoryStore_rawEventsKey,Types_rawEventsEntity>; 
  readonly eventSyncState: storeOperations<Types_chainId,DbFunctions_EventSyncState_eventSyncState>; 
  readonly dynamicContractRegistry: storeOperations<IO_InMemoryStore_dynamicContractRegistryKey,Types_dynamicContractRegistryEntity>
};

// tslint:disable-next-line:interface-over-type-literal
export type entities = {
  readonly Gauge: entityStoreOperations<Types_gaugeEntity>; 
  readonly LatestETHPrice: entityStoreOperations<Types_latestETHPriceEntity>; 
  readonly LiquidityPool: entityStoreOperations<Types_liquidityPoolEntity>; 
  readonly LiquidityPoolDailySnapshot: entityStoreOperations<Types_liquidityPoolDailySnapshotEntity>; 
  readonly LiquidityPoolHourlySnapshot: entityStoreOperations<Types_liquidityPoolHourlySnapshotEntity>; 
  readonly LiquidityPoolUserMapping: entityStoreOperations<Types_liquidityPoolUserMappingEntity>; 
  readonly LiquidityPoolWeeklySnapshot: entityStoreOperations<Types_liquidityPoolWeeklySnapshotEntity>; 
  readonly StateStore: entityStoreOperations<Types_stateStoreEntity>; 
  readonly Token: entityStoreOperations<Types_tokenEntity>; 
  readonly TokenDailySnapshot: entityStoreOperations<Types_tokenDailySnapshotEntity>; 
  readonly TokenHourlySnapshot: entityStoreOperations<Types_tokenHourlySnapshotEntity>; 
  readonly TokenWeeklySnapshot: entityStoreOperations<Types_tokenWeeklySnapshotEntity>; 
  readonly User: entityStoreOperations<Types_userEntity>
};

// tslint:disable-next-line:interface-over-type-literal
export type entityStoreOperations<entity> = storeOperations<string,entity>;

// tslint:disable-next-line:interface-over-type-literal
export type storeOperations<entityKey,entity> = {
  readonly getAll: () => entity[]; 
  readonly get: (_1:entityKey) => (undefined | entity); 
  readonly set: (_1:entity) => t; 
  readonly delete: (_1:entityKey) => t
};

export const createMockDb: () => t = TestHelpers_MockDbBS.createMockDb;
