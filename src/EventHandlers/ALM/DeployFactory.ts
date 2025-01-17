import { ALMDeployFactory, ALMDeployFactory_StrategyCreated } from "generated";

ALMDeployFactory.StrategyCreated.handler(async ({ event, context }) => {
  const [
    pool,
    ammPosition,
    strategyParams,
    lpWrapper,
    caller
  ] = event.params.params;

  const entity: ALMDeployFactory_StrategyCreated = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    pool,
    lpWrapper,
    timestamp: new Date(event.block.timestamp * 1000),
    chainId: event.chainId,
  };

  context.ALMDeployFactory_StrategyCreated.set(entity);
});
