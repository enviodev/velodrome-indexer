import { expect } from "chai";
import sinon from "sinon";
import {
  CLPoolAggregator,
  CLPoolAggregatorSnapshot,
  handlerContext,
} from "../../generated/src/Types.gen";
import {
  setCLPoolAggregatorSnapshot,
  updateCLPoolAggregator,
} from "../../src/Aggregators/CLPoolAggregator";

describe("CLPoolAggregator Functions", () => {
  let clPoolAggregator: CLPoolAggregator;
  let timestamp: Date;
  let chainId: number;
  let poolId: string;

  beforeEach(() => {
    chainId = 1;
    poolId = "0x123";
    timestamp = new Date("2023-01-01T00:00:00Z");

    clPoolAggregator = {
      id: poolId,
      chainId: chainId,
      name: "Test Pool",
      token0_id: "0xtoken0",
      token1_id: "0xtoken1",
      token0_address: "0xtoken0",
      token1_address: "0xtoken1",
      isStable: false,
      reserve0: 1000n,
      reserve1: 2000n,
      totalLiquidityUSD: 3000n,
      totalVolume0: 4000n,
      totalVolume1: 5000n,
      totalVolumeUSD: 6000n,
      totalFees0: 100n,
      totalFees1: 200n,
      totalFeesUSD: 300n,
      numberOfSwaps: 10n,
      token0Price: 1n,
      token1Price: 2n,
      totalEmissions: 500n,
      totalEmissionsUSD: 1000n,
      totalBribesUSD: 50n,
      lastUpdatedTimestamp: new Date(timestamp.getTime() - 60 * 60 *1000),
      lastSnapshotTimestamp: new Date(timestamp.getTime() - 61 * 60 *1000),
    };
  });

  describe("Snapshot Creation", () => {
    let snapshotId: string;

    const mockContext: any = {
        CLPoolAggregatorSnapshot: {
            set: sinon.stub()
        },
        CLPoolAggregator: {
            set: sinon.stub()
        },
    };

    beforeEach(() => {
      snapshotId = `${chainId}-${poolId}_${timestamp.getTime()}`;
      setCLPoolAggregatorSnapshot(
        clPoolAggregator,
        timestamp,
        mockContext
      );
    });

    afterEach(() => {
        mockContext.CLPoolAggregatorSnapshot.set.reset();
        mockContext.CLPoolAggregator.set.reset();
    });

    it("should create a snapshot of the CL pool aggregator", () => {
      const snapshot = mockContext.CLPoolAggregatorSnapshot.set.args[0][0];
      expect(snapshot).to.not.be.undefined;
      expect(snapshot?.id).to.equal(snapshotId);
      expect(snapshot?.pool).to.equal(clPoolAggregator.id);
      expect(snapshot?.timestamp).to.deep.equal(clPoolAggregator.lastUpdatedTimestamp);
    });

    it("should include all properties from the original aggregator", () => {
      const snapshot = mockContext.CLPoolAggregatorSnapshot.set.args[0][0];
      for (const key in clPoolAggregator) {
        if (key !== 'id' && key !== 'lastSnapshotTimestamp') {
          expect(snapshot[key as keyof CLPoolAggregatorSnapshot]).to.deep.equal(clPoolAggregator[key as keyof CLPoolAggregator]);
        }
      }
    });
  });

  describe("Updating the CL Pool Aggregator", () => {
    let diff: Partial<CLPoolAggregator>;

    const mockContext: any = {
        CLPoolAggregatorSnapshot: {
            set: sinon.stub()
        },
        CLPoolAggregator: {
            set: sinon.stub()
        },
    };

    beforeEach(() => {
      diff = {
        totalVolume0: 5000n,
        totalVolume1: 6000n,
        totalVolumeUSD: 7000n,
        numberOfSwaps: 11n,
      };
    });

    afterEach(() => {
        mockContext.CLPoolAggregatorSnapshot.set.reset();
        mockContext.CLPoolAggregator.set.reset();
    });

    it("should update the CL pool aggregator", () => {
      updateCLPoolAggregator(
        diff,
        clPoolAggregator,
        timestamp,
        mockContext
      );
      const updatedAggregator = mockContext.CLPoolAggregator.set.args[0][0];
      expect(updatedAggregator.totalVolume0).to.equal(diff.totalVolume0);
      expect(updatedAggregator.totalVolume1).to.equal(diff.totalVolume1);
      expect(updatedAggregator.totalVolumeUSD).to.equal(diff.totalVolumeUSD);
      expect(updatedAggregator.numberOfSwaps).to.equal(diff.numberOfSwaps);
      expect(updatedAggregator.lastUpdatedTimestamp).to.deep.equal(timestamp);
    });

    it("should create a snapshot if the last update was more than 1 hour ago", () => {
      updateCLPoolAggregator(
        diff,
        clPoolAggregator,
        timestamp,
        mockContext
      );
      const snapshotId = `${chainId}-${poolId}_${timestamp.getTime()}`;

      const snapshot = mockContext.CLPoolAggregatorSnapshot.set.args[0][0];
      expect(snapshot).to.not.be.undefined;
      expect(snapshot?.id).to.equal(snapshotId);
      expect(snapshot?.pool).to.equal(clPoolAggregator.id);
      expect(snapshot?.timestamp).to.deep.equal(timestamp);
    });

    it("should not create a snapshot if the last update was less than 1 hour ago", () => {
      const recentTimestamp = new Date(clPoolAggregator.lastSnapshotTimestamp.getTime() - (30 * 60 * 1000)); // 30 minutes later
      updateCLPoolAggregator(
        diff,
        clPoolAggregator,
        recentTimestamp,
        mockContext
      );
      expect(mockContext.CLPoolAggregatorSnapshot.set.notCalled).to.be.true;
    });

    it("should update the lastSnapshotTimestamp when a new snapshot is created", () => {
      updateCLPoolAggregator(
        diff,
        clPoolAggregator,
        timestamp,
        mockContext
      );
      const updatedAggregator = mockContext.CLPoolAggregator.set.args[0][0];
      expect(updatedAggregator.lastUpdatedTimestamp).to.deep.equal(timestamp);
    });
  });
});
