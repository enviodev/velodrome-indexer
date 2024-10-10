import {
  LiquidityPoolNew,
  LiquidityPoolHourlySnapshot,
  LiquidityPoolDailySnapshot,
  LiquidityPoolWeeklySnapshot,
  Token,
  TokenHourlySnapshot,
  TokenDailySnapshot,
  TokenWeeklySnapshot,
} from "./src/Types.gen";

import {
  SECONDS_IN_AN_HOUR,
  SECONDS_IN_A_DAY,
  SECONDS_IN_A_WEEK,
} from "./Constants";

import { SnapshotInterval } from "./CustomTypes";

// Generic function to return a snapshot of entity of type LiquidityPool given a specific snapshot interval
export function getLiquidityPoolSnapshotByInterval(
  liquidityPoolEntity: LiquidityPoolNew,
  interval: SnapshotInterval
):
  | LiquidityPoolHourlySnapshot
  | LiquidityPoolDailySnapshot
  | LiquidityPoolWeeklySnapshot {
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
  tokenEntity: Token,
  interval: SnapshotInterval
):
  | TokenHourlySnapshot
  | TokenDailySnapshot
  | TokenWeeklySnapshot {
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
    address: tokenEntity.address,
    decimals: tokenEntity.decimals,
    symbol: tokenEntity.symbol,
    name: tokenEntity.name,
    token: tokenEntity.id,
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

function getIdForEntityByInterval(
  id: string,
  lastUpdatedTimestamp: Date,
  numberOfSeconds: bigint
): string {
  // Convert Date to Unix timestamp in seconds
  let lastUpdatedTimestampInSeconds = Math.floor(lastUpdatedTimestamp.getTime() / 1000);

  // Perform interval calculation
  let interval = BigInt(lastUpdatedTimestampInSeconds) / numberOfSeconds;
  let intervalStartTimestamp = interval * numberOfSeconds;

  // Generate intervalPairID
  let intervalPairID = id.concat("-").concat(intervalStartTimestamp.toString());

  return intervalPairID;
}
