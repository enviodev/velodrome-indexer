import {
  LiquidityPoolEntity,
  LiquidityPoolHourlySnapshotEntity,
  LiquidityPoolDailySnapshotEntity,
  LiquidityPoolWeeklySnapshotEntity,
  TokenEntity,
  TokenHourlySnapshotEntity,
  TokenDailySnapshotEntity,
  TokenWeeklySnapshotEntity,
} from "./src/Types.gen";

import {
  SECONDS_IN_AN_HOUR,
  SECONDS_IN_A_DAY,
  SECONDS_IN_A_WEEK,
} from "./Constants";

import { SnapshotInterval } from "./CustomTypes";

export function getLiquidityPoolSnapshotByInterval(
  liquidityPoolEntity: LiquidityPoolEntity,
  interval: SnapshotInterval
):
  | LiquidityPoolHourlySnapshotEntity
  | LiquidityPoolDailySnapshotEntity
  | LiquidityPoolWeeklySnapshotEntity {
  const numberOfSecondsInInterval = getNumberOfSecondsInInterval(interval);
  let intervalId = getIdForEntityByInterval(
    liquidityPoolEntity.id,
    liquidityPoolEntity.lastUpdatedTimestamp,
    numberOfSecondsInInterval
  );

  const liquidityPoolSnapshotByIntervalEntity = {
    id: intervalId,
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
  return liquidityPoolSnapshotByIntervalEntity;
}

export function getTokenSnapshotByInterval(
  tokenEntity: TokenEntity,
  interval: SnapshotInterval
):
  | TokenHourlySnapshotEntity
  | TokenDailySnapshotEntity
  | TokenWeeklySnapshotEntity {
  const numberOfSecondsInInterval = getNumberOfSecondsInInterval(interval);
  let intervalId = getIdForEntityByInterval(
    tokenEntity.id,
    tokenEntity.lastUpdatedTimestamp,
    numberOfSecondsInInterval
  );

  const tokenSnapshotByIntervalEntity = {
    id: intervalId,
    token: tokenEntity.id,
    pricePerETH: tokenEntity.pricePerETH,
    pricePerUSD: tokenEntity.pricePerUSD,
    lastUpdatedTimestamp: tokenEntity.lastUpdatedTimestamp,
  };
  return tokenSnapshotByIntervalEntity;
}

function getNumberOfSecondsInInterval(interval: SnapshotInterval): bigint {
  switch (interval) {
    case SnapshotInterval.Hourly:
      return SECONDS_IN_AN_HOUR;
    case SnapshotInterval.Daily:
      return SECONDS_IN_A_DAY;
    case SnapshotInterval.Weekly:
      return SECONDS_IN_A_WEEK;
    default:
      throw new Error("Invalid interval");
  }
}

function getIdForEntityByInterval(
  id: string,
  lastUpdatedTimestamp: bigint,
  numberOfSeconds: bigint
): string {
  let interval = lastUpdatedTimestamp / numberOfSeconds;
  let intervalStartTimestamp = interval * numberOfSeconds;
  let intervalPairID = id.concat("-").concat(intervalStartTimestamp.toString());

  return intervalPairID;
}
