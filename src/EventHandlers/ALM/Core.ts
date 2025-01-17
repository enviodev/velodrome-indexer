import {
    ALMCore,
    ALMCore_Rebalance,
} from "generated";

ALMCore.Rebalance.handler(async ({ event, context }) => {
  const [ pool, ammPositionInfo, sqrtPriceX96, amount0, amount1, ammPositionIdBefore, ammPositionIdAfter ] = event.params.rebalanceEventParams;
  const [ token0, token1, property, tickLower, tickUpper ] = ammPositionInfo;
  const entity: ALMCore_Rebalance = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    pool,
    tickLower,
    tickUpper,
    sqrtPriceX96,
    amount0,
    amount1,
    ammPositionIdBefore,
    ammPositionIdAfter,
    timestamp: new Date(event.block.timestamp * 1000),
    chainId: event.chainId,
    blockNumber: event.block.number,
    logIndex: event.logIndex
  };

  context.ALMCore_Rebalance.set(entity);
}); 