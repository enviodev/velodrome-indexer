import {
  LiquidityPoolEntity,
  liquidityPoolDailySnapshotEntity,
} from "./src/Types.gen";

export function updateLiquidityPoolDayData(
  liquidityPoolEntity: LiquidityPoolEntity
): liquidityPoolDailySnapshotEntity {
  // TODO can refactor this by deducting mod of lastUpdatedTimestamp by 86400 from lastUpdatedTimestamp
  // TODO make helper functions for mathematical operations
  let day = liquidityPoolEntity.lastUpdatedTimestamp / BigInt(86400);
  let dayStartTimestamp = day * BigInt(86400);
  let dayPairID = liquidityPoolEntity.id
    .concat("-")
    .concat(dayStartTimestamp.toString());

  const liquidityPoolDailySnapshotEntity: liquidityPoolDailySnapshotEntity = {
    id: dayPairID,
    pool: liquidityPoolEntity.id,
    reserve0: liquidityPoolEntity.reserve0,
    reserve1: liquidityPoolEntity.reserve1,
    totalLiquidityETH: liquidityPoolEntity.totalLiquidityETH,
    totalLiquidityUSD: liquidityPoolEntity.totalLiquidityUSD,
    totalVolume0: liquidityPoolEntity.totalVolume0,
    totalVolume1: liquidityPoolEntity.totalVolume1,
    totalVolumeUSD: liquidityPoolEntity.totalVolumeUSD,
    totalFees0: liquidityPoolEntity.totalFees0,
    totalFees1: liquidityPoolEntity.totalFees1,
    totalFeesUSD: liquidityPoolEntity.totalFeesUSD,
    numberOfSwaps: liquidityPoolEntity.numberOfSwaps,
    token0Price: liquidityPoolEntity.token0Price,
    token1Price: liquidityPoolEntity.token1Price,
    lastUpdatedTimestamp: liquidityPoolEntity.lastUpdatedTimestamp,
  };
  return liquidityPoolDailySnapshotEntity;
}
