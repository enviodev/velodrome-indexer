import {
  CLPoolAggregator,
  CLPoolAggregatorSnapshot,
  handlerContext,
} from "./../src/Types.gen";

const UPDATE_INTERVAL = 60 * 60 * 1000; // 1 hour

/**
 * Creates and stores a snapshot of the current state of a LiquidityPoolAggregator.
 * 
 * This function is used to capture the state of a liquidity pool aggregator at a specific
 * point in time. The snapshot includes the pool's ID, a unique snapshot ID, and the timestamp
 * of the last update.
 * 
 * @param liquidityPoolAggregator - The current state of the liquidity pool aggregator.
 * @param timestamp - The current timestamp when the snapshot is taken.
 * @param context - The handler context used to store the snapshot.
 */
export function setCLPoolAggregatorSnapshot(
  liquidityPoolAggregator: CLPoolAggregator,
  timestamp: Date,
  context: handlerContext
) {
  const chainId = liquidityPoolAggregator.chainId;

  const snapshot: CLPoolAggregatorSnapshot = {
    ...liquidityPoolAggregator,
    pool: liquidityPoolAggregator.id,
    id: `${chainId}-${liquidityPoolAggregator.id}_${timestamp.getTime()}`,
    timestamp: liquidityPoolAggregator.lastUpdatedTimestamp,
  };

  context.CLPoolAggregatorSnapshot.set(snapshot);
}

/**
 * Updates the state of a LiquidityPoolAggregator with new data and manages snapshots.
 * 
 * This function applies a set of changes (diff) to the current state of a liquidity pool
 * aggregator. It updates the last updated timestamp and, if more than an hour has passed
 * since the last snapshot, it creates a new snapshot of the aggregator's state.
 * 
 * @param diff - An object containing the changes to be applied to the current state.
 * @param current - The current state of the liquidity pool aggregator.
 * @param timestamp - The current timestamp when the update is applied.
 * @param context - The handler context used to store the updated state and snapshots.
 */
export function updateCLPoolAggregator(
  diff: any,
  current: CLPoolAggregator,
  timestamp: Date,
  context: handlerContext
) {
  const updated: CLPoolAggregator = {
    ...current,
    ...diff,
    lastUpdatedTimestamp: timestamp,
  };

  context.CLPoolAggregator.set(updated);

  // Update the snapshot if the last update was more than 1 hour ago
  if (
    !current.lastSnapshotTimestamp ||
    (timestamp.getTime() - current.lastSnapshotTimestamp.getTime() >
    UPDATE_INTERVAL)
  ) {
    setCLPoolAggregatorSnapshot(updated, timestamp, context);
    const snapshotTimestampUpdate: CLPoolAggregator = {
      ...updated,
      lastSnapshotTimestamp: timestamp,
    };
    context.CLPoolAggregator.set(snapshotTimestampUpdate);
  }
}
