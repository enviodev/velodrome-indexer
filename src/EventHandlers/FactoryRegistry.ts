import { FactoryRegistry, FactoryRegistry_Approve, FactoryRegistry_Unapprove } from "generated";

FactoryRegistry.Approve.contractRegister(
  ({ event, context }) => {
    context.addPoolFactory(event.params.poolFactory);
    context.addCLFactory(event.params.poolFactory);
    if (event.chainId === 10) {
      context.addSuperchainPoolFactory(event.params.poolFactory);
    }
  }
);

FactoryRegistry.Approve.handler(async ({ event, context }) => {
  const entity: FactoryRegistry_Approve = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    poolFactory: event.params.poolFactory,
    votingRewardsFactory: event.params.votingRewardsFactory,
    gaugeFactory: event.params.gaugeFactory,
    timestamp: new Date(event.block.timestamp * 1000),
    transactionHash: event.transaction.hash,
    blockNumber: event.block.number,
    logIndex: event.logIndex,
    chainId: event.chainId,
  };

  context.FactoryRegistry_Approve.set(entity);
});

FactoryRegistry.Unapprove.handler(async ({ event, context }) => {

  const entity: FactoryRegistry_Unapprove = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    poolFactory: event.params.poolFactory,
    votingRewardsFactory: event.params.votingRewardsFactory,
    gaugeFactory: event.params.gaugeFactory,
    timestamp: new Date(event.block.timestamp * 1000),
    transactionHash: event.transaction.hash,
    blockNumber: event.block.number,
    logIndex: event.logIndex,
    chainId: event.chainId,
  };

  context.FactoryRegistry_Unapprove.set(entity);
});