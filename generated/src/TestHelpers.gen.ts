/* TypeScript file generated from TestHelpers.res by genType. */
/* eslint-disable import/first */


// @ts-ignore: Implicit any on import
const TestHelpersBS = require('./TestHelpers.bs');

import type {BigInt_t as Ethers_BigInt_t} from '../src/bindings/Ethers.gen';

import type {PoolContract_FeesEvent_eventArgs as Types_PoolContract_FeesEvent_eventArgs} from './Types.gen';

import type {PoolContract_SwapEvent_eventArgs as Types_PoolContract_SwapEvent_eventArgs} from './Types.gen';

import type {PoolContract_SyncEvent_eventArgs as Types_PoolContract_SyncEvent_eventArgs} from './Types.gen';

import type {PoolFactoryContract_PoolCreatedEvent_eventArgs as Types_PoolFactoryContract_PoolCreatedEvent_eventArgs} from './Types.gen';

import type {VoterContract_DistributeRewardEvent_eventArgs as Types_VoterContract_DistributeRewardEvent_eventArgs} from './Types.gen';

import type {VoterContract_GaugeCreatedEvent_eventArgs as Types_VoterContract_GaugeCreatedEvent_eventArgs} from './Types.gen';

import type {VotingRewardContract_NotifyRewardEvent_eventArgs as Types_VotingRewardContract_NotifyRewardEvent_eventArgs} from './Types.gen';

import type {ethAddress as Ethers_ethAddress} from '../src/bindings/Ethers.gen';

import type {eventLog as Types_eventLog} from './Types.gen';

import type {t as TestHelpers_MockDb_t} from './TestHelpers_MockDb.gen';

// tslint:disable-next-line:interface-over-type-literal
export type EventFunctions_eventProcessorArgs<eventArgs> = {
  readonly event: Types_eventLog<eventArgs>; 
  readonly mockDb: TestHelpers_MockDb_t; 
  readonly chainId?: number
};

// tslint:disable-next-line:interface-over-type-literal
export type EventFunctions_mockEventData = {
  readonly blockNumber?: number; 
  readonly blockTimestamp?: number; 
  readonly blockHash?: string; 
  readonly chainId?: number; 
  readonly srcAddress?: Ethers_ethAddress; 
  readonly transactionHash?: string; 
  readonly transactionIndex?: number; 
  readonly txOrigin?: (undefined | Ethers_ethAddress); 
  readonly logIndex?: number
};

// tslint:disable-next-line:interface-over-type-literal
export type Pool_Fees_createMockArgs = {
  readonly sender?: Ethers_ethAddress; 
  readonly amount0?: Ethers_BigInt_t; 
  readonly amount1?: Ethers_BigInt_t; 
  readonly mockEventData?: EventFunctions_mockEventData
};

// tslint:disable-next-line:interface-over-type-literal
export type Pool_Swap_createMockArgs = {
  readonly sender?: Ethers_ethAddress; 
  readonly to?: Ethers_ethAddress; 
  readonly amount0In?: Ethers_BigInt_t; 
  readonly amount1In?: Ethers_BigInt_t; 
  readonly amount0Out?: Ethers_BigInt_t; 
  readonly amount1Out?: Ethers_BigInt_t; 
  readonly mockEventData?: EventFunctions_mockEventData
};

// tslint:disable-next-line:interface-over-type-literal
export type Pool_Sync_createMockArgs = {
  readonly reserve0?: Ethers_BigInt_t; 
  readonly reserve1?: Ethers_BigInt_t; 
  readonly mockEventData?: EventFunctions_mockEventData
};

// tslint:disable-next-line:interface-over-type-literal
export type PoolFactory_PoolCreated_createMockArgs = {
  readonly token0?: Ethers_ethAddress; 
  readonly token1?: Ethers_ethAddress; 
  readonly stable?: boolean; 
  readonly pool?: Ethers_ethAddress; 
  readonly unnamed?: Ethers_BigInt_t; 
  readonly mockEventData?: EventFunctions_mockEventData
};

// tslint:disable-next-line:interface-over-type-literal
export type Voter_DistributeReward_createMockArgs = {
  readonly sender?: Ethers_ethAddress; 
  readonly gauge?: Ethers_ethAddress; 
  readonly amount?: Ethers_BigInt_t; 
  readonly mockEventData?: EventFunctions_mockEventData
};

// tslint:disable-next-line:interface-over-type-literal
export type Voter_GaugeCreated_createMockArgs = {
  readonly poolFactory?: Ethers_ethAddress; 
  readonly votingRewardsFactory?: Ethers_ethAddress; 
  readonly gaugeFactory?: Ethers_ethAddress; 
  readonly pool?: Ethers_ethAddress; 
  readonly bribeVotingReward?: Ethers_ethAddress; 
  readonly feeVotingReward?: Ethers_ethAddress; 
  readonly gauge?: Ethers_ethAddress; 
  readonly creator?: Ethers_ethAddress; 
  readonly mockEventData?: EventFunctions_mockEventData
};

// tslint:disable-next-line:interface-over-type-literal
export type VotingReward_NotifyReward_createMockArgs = {
  readonly from?: Ethers_ethAddress; 
  readonly reward?: Ethers_ethAddress; 
  readonly epoch?: Ethers_BigInt_t; 
  readonly amount?: Ethers_BigInt_t; 
  readonly mockEventData?: EventFunctions_mockEventData
};

export const MockDb_createMockDb: () => TestHelpers_MockDb_t = TestHelpersBS.MockDb.createMockDb;

export const Pool_Fees_processEvent: (_1:EventFunctions_eventProcessorArgs<Types_PoolContract_FeesEvent_eventArgs>) => TestHelpers_MockDb_t = TestHelpersBS.Pool.Fees.processEvent;

export const Pool_Fees_processEventAsync: (_1:EventFunctions_eventProcessorArgs<Types_PoolContract_FeesEvent_eventArgs>) => Promise<TestHelpers_MockDb_t> = TestHelpersBS.Pool.Fees.processEventAsync;

export const Pool_Fees_createMockEvent: (args:Pool_Fees_createMockArgs) => Types_eventLog<Types_PoolContract_FeesEvent_eventArgs> = TestHelpersBS.Pool.Fees.createMockEvent;

export const Pool_Swap_processEvent: (_1:EventFunctions_eventProcessorArgs<Types_PoolContract_SwapEvent_eventArgs>) => TestHelpers_MockDb_t = TestHelpersBS.Pool.Swap.processEvent;

export const Pool_Swap_processEventAsync: (_1:EventFunctions_eventProcessorArgs<Types_PoolContract_SwapEvent_eventArgs>) => Promise<TestHelpers_MockDb_t> = TestHelpersBS.Pool.Swap.processEventAsync;

export const Pool_Swap_createMockEvent: (args:Pool_Swap_createMockArgs) => Types_eventLog<Types_PoolContract_SwapEvent_eventArgs> = TestHelpersBS.Pool.Swap.createMockEvent;

export const Pool_Sync_processEvent: (_1:EventFunctions_eventProcessorArgs<Types_PoolContract_SyncEvent_eventArgs>) => TestHelpers_MockDb_t = TestHelpersBS.Pool.Sync.processEvent;

export const Pool_Sync_processEventAsync: (_1:EventFunctions_eventProcessorArgs<Types_PoolContract_SyncEvent_eventArgs>) => Promise<TestHelpers_MockDb_t> = TestHelpersBS.Pool.Sync.processEventAsync;

export const Pool_Sync_createMockEvent: (args:Pool_Sync_createMockArgs) => Types_eventLog<Types_PoolContract_SyncEvent_eventArgs> = TestHelpersBS.Pool.Sync.createMockEvent;

export const PoolFactory_PoolCreated_processEvent: (_1:EventFunctions_eventProcessorArgs<Types_PoolFactoryContract_PoolCreatedEvent_eventArgs>) => TestHelpers_MockDb_t = TestHelpersBS.PoolFactory.PoolCreated.processEvent;

export const PoolFactory_PoolCreated_processEventAsync: (_1:EventFunctions_eventProcessorArgs<Types_PoolFactoryContract_PoolCreatedEvent_eventArgs>) => Promise<TestHelpers_MockDb_t> = TestHelpersBS.PoolFactory.PoolCreated.processEventAsync;

export const PoolFactory_PoolCreated_createMockEvent: (args:PoolFactory_PoolCreated_createMockArgs) => Types_eventLog<Types_PoolFactoryContract_PoolCreatedEvent_eventArgs> = TestHelpersBS.PoolFactory.PoolCreated.createMockEvent;

export const Voter_DistributeReward_processEvent: (_1:EventFunctions_eventProcessorArgs<Types_VoterContract_DistributeRewardEvent_eventArgs>) => TestHelpers_MockDb_t = TestHelpersBS.Voter.DistributeReward.processEvent;

export const Voter_DistributeReward_processEventAsync: (_1:EventFunctions_eventProcessorArgs<Types_VoterContract_DistributeRewardEvent_eventArgs>) => Promise<TestHelpers_MockDb_t> = TestHelpersBS.Voter.DistributeReward.processEventAsync;

export const Voter_DistributeReward_createMockEvent: (args:Voter_DistributeReward_createMockArgs) => Types_eventLog<Types_VoterContract_DistributeRewardEvent_eventArgs> = TestHelpersBS.Voter.DistributeReward.createMockEvent;

export const Voter_GaugeCreated_processEvent: (_1:EventFunctions_eventProcessorArgs<Types_VoterContract_GaugeCreatedEvent_eventArgs>) => TestHelpers_MockDb_t = TestHelpersBS.Voter.GaugeCreated.processEvent;

export const Voter_GaugeCreated_processEventAsync: (_1:EventFunctions_eventProcessorArgs<Types_VoterContract_GaugeCreatedEvent_eventArgs>) => Promise<TestHelpers_MockDb_t> = TestHelpersBS.Voter.GaugeCreated.processEventAsync;

export const Voter_GaugeCreated_createMockEvent: (args:Voter_GaugeCreated_createMockArgs) => Types_eventLog<Types_VoterContract_GaugeCreatedEvent_eventArgs> = TestHelpersBS.Voter.GaugeCreated.createMockEvent;

export const VotingReward_NotifyReward_processEvent: (_1:EventFunctions_eventProcessorArgs<Types_VotingRewardContract_NotifyRewardEvent_eventArgs>) => TestHelpers_MockDb_t = TestHelpersBS.VotingReward.NotifyReward.processEvent;

export const VotingReward_NotifyReward_processEventAsync: (_1:EventFunctions_eventProcessorArgs<Types_VotingRewardContract_NotifyRewardEvent_eventArgs>) => Promise<TestHelpers_MockDb_t> = TestHelpersBS.VotingReward.NotifyReward.processEventAsync;

export const VotingReward_NotifyReward_createMockEvent: (args:VotingReward_NotifyReward_createMockArgs) => Types_eventLog<Types_VotingRewardContract_NotifyRewardEvent_eventArgs> = TestHelpersBS.VotingReward.NotifyReward.createMockEvent;

export const Pool: {
  Fees: {
    processEvent: (_1:EventFunctions_eventProcessorArgs<Types_PoolContract_FeesEvent_eventArgs>) => TestHelpers_MockDb_t; 
    processEventAsync: (_1:EventFunctions_eventProcessorArgs<Types_PoolContract_FeesEvent_eventArgs>) => Promise<TestHelpers_MockDb_t>; 
    createMockEvent: (args:Pool_Fees_createMockArgs) => Types_eventLog<Types_PoolContract_FeesEvent_eventArgs>
  }; 
  Sync: {
    processEvent: (_1:EventFunctions_eventProcessorArgs<Types_PoolContract_SyncEvent_eventArgs>) => TestHelpers_MockDb_t; 
    processEventAsync: (_1:EventFunctions_eventProcessorArgs<Types_PoolContract_SyncEvent_eventArgs>) => Promise<TestHelpers_MockDb_t>; 
    createMockEvent: (args:Pool_Sync_createMockArgs) => Types_eventLog<Types_PoolContract_SyncEvent_eventArgs>
  }; 
  Swap: {
    processEvent: (_1:EventFunctions_eventProcessorArgs<Types_PoolContract_SwapEvent_eventArgs>) => TestHelpers_MockDb_t; 
    processEventAsync: (_1:EventFunctions_eventProcessorArgs<Types_PoolContract_SwapEvent_eventArgs>) => Promise<TestHelpers_MockDb_t>; 
    createMockEvent: (args:Pool_Swap_createMockArgs) => Types_eventLog<Types_PoolContract_SwapEvent_eventArgs>
  }
} = TestHelpersBS.Pool

export const Voter: { GaugeCreated: {
  processEvent: (_1:EventFunctions_eventProcessorArgs<Types_VoterContract_GaugeCreatedEvent_eventArgs>) => TestHelpers_MockDb_t; 
  processEventAsync: (_1:EventFunctions_eventProcessorArgs<Types_VoterContract_GaugeCreatedEvent_eventArgs>) => Promise<TestHelpers_MockDb_t>; 
  createMockEvent: (args:Voter_GaugeCreated_createMockArgs) => Types_eventLog<Types_VoterContract_GaugeCreatedEvent_eventArgs>
}; DistributeReward: {
  processEvent: (_1:EventFunctions_eventProcessorArgs<Types_VoterContract_DistributeRewardEvent_eventArgs>) => TestHelpers_MockDb_t; 
  processEventAsync: (_1:EventFunctions_eventProcessorArgs<Types_VoterContract_DistributeRewardEvent_eventArgs>) => Promise<TestHelpers_MockDb_t>; 
  createMockEvent: (args:Voter_DistributeReward_createMockArgs) => Types_eventLog<Types_VoterContract_DistributeRewardEvent_eventArgs>
} } = TestHelpersBS.Voter

export const PoolFactory: { PoolCreated: {
  processEvent: (_1:EventFunctions_eventProcessorArgs<Types_PoolFactoryContract_PoolCreatedEvent_eventArgs>) => TestHelpers_MockDb_t; 
  processEventAsync: (_1:EventFunctions_eventProcessorArgs<Types_PoolFactoryContract_PoolCreatedEvent_eventArgs>) => Promise<TestHelpers_MockDb_t>; 
  createMockEvent: (args:PoolFactory_PoolCreated_createMockArgs) => Types_eventLog<Types_PoolFactoryContract_PoolCreatedEvent_eventArgs>
} } = TestHelpersBS.PoolFactory

export const VotingReward: { NotifyReward: {
  processEvent: (_1:EventFunctions_eventProcessorArgs<Types_VotingRewardContract_NotifyRewardEvent_eventArgs>) => TestHelpers_MockDb_t; 
  processEventAsync: (_1:EventFunctions_eventProcessorArgs<Types_VotingRewardContract_NotifyRewardEvent_eventArgs>) => Promise<TestHelpers_MockDb_t>; 
  createMockEvent: (args:VotingReward_NotifyReward_createMockArgs) => Types_eventLog<Types_VotingRewardContract_NotifyRewardEvent_eventArgs>
} } = TestHelpersBS.VotingReward

export const MockDb: { createMockDb: () => TestHelpers_MockDb_t } = TestHelpersBS.MockDb
