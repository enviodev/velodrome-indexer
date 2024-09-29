import {
  Gauge,
  Gauge_NotifyReward,
} from "generated";

Gauge.NotifyReward.handler(async ({ event, context }) => {
  const entity: Gauge_NotifyReward = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    from: event.params.from,
    amount: event.params.amount,
    timestamp: new Date(event.block.timestamp * 1000), // Convert to Date
    sourceAddress: event.srcAddress,
    chainId: event.chainId,
  };

  context.Gauge_NotifyReward.set(entity);
});
