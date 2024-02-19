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

// Generic function to return a snapshot of entity of type LiquidityPool given a specific snapshot interval
export function getLiquidityPoolSnapshotByInterval(
  liquidityPoolEntity: LiquidityPoolEntity,
  interval: SnapshotInterval
):
  | LiquidityPoolHourlySnapshotEntity
  | LiquidityPoolDailySnapshotEntity
  | LiquidityPoolWeeklySnapshotEntity {
  // Get the number of seconds in the interval
  const numberOfSecondsInInterval = getNumberOfSecondsInInterval(interval);

  // Get the interval ID for the snapshot entity
  let intervalId = getIdForEntityByInterval(
    liquidityPoolEntity.id,
    liquidityPoolEntity.lastUpdatedTimestamp,
    numberOfSecondsInInterval
  );

  // Create the snapshot entity
  const liquidityPoolSnapshotByIntervalEntity = {
    id: intervalId,
    pool: liquidityPoolEntity.id,
    name: liquidityPoolEntity.name,
    chainID: liquidityPoolEntity.chainID,
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
    totalEmissions: liquidityPoolEntity.totalEmissions,
    totalEmissionsUSD: liquidityPoolEntity.totalEmissionsUSD,
    totalBribesUSD: liquidityPoolEntity.totalBribesUSD,
    lastUpdatedTimestamp: liquidityPoolEntity.lastUpdatedTimestamp,
  };

  // Return the snapshot entity
  return liquidityPoolSnapshotByIntervalEntity;
}

// Generic function to return a snapshot of entity of type Token given a specific snapshot interval
export function getTokenSnapshotByInterval(
  tokenEntity: TokenEntity,
  interval: SnapshotInterval
):
  | TokenHourlySnapshotEntity
  | TokenDailySnapshotEntity
  | TokenWeeklySnapshotEntity {
  // Get the number of seconds in the interval
  const numberOfSecondsInInterval = getNumberOfSecondsInInterval(interval);

  // Get the interval ID for the snapshot entity
  let intervalId = getIdForEntityByInterval(
    tokenEntity.id,
    tokenEntity.lastUpdatedTimestamp,
    numberOfSecondsInInterval
  );

  // Create the snapshot entity
  const tokenSnapshotByIntervalEntity = {
    id: intervalId,
    chainID: tokenEntity.chainID,
    decimals: tokenEntity.decimals,
    symbol: tokenEntity.symbol,
    name: tokenEntity.name,
    token: tokenEntity.id,
    pricePerETH: tokenEntity.pricePerETH,
    pricePerUSD: tokenEntity.pricePerUSD,
    pricePerUSDNew: tokenEntity.pricePerUSDNew,
    lastUpdatedTimestamp: tokenEntity.lastUpdatedTimestamp,
  };

  // Return the snapshot entity
  return tokenSnapshotByIntervalEntity;
}

// Function to return the number of seconds in a given interval
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

// Function to return the interval ID for a given snapshot entity
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
