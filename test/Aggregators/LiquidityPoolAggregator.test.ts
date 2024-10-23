import { expect } from "chai";
import sinon from "sinon";
import {
  LiquidityPoolAggregator,
} from "../../generated/src/Types.gen";
import {
  setLiquidityPoolAggregatorSnapshot,
  updateLiquidityPoolAggregator,
} from "../../src/Aggregators/LiquidityPoolAggregator";

describe("LiquidityPoolAggregator Functions", () => {
  let contextStub: any;
  let liquidityPoolAggregator: any;
  let timestamp: Date;

  beforeEach(() => {
    contextStub = {
      LiquidityPoolAggregatorSnapshot: { set: sinon.stub() },
      LiquidityPoolAggregator: { set: sinon.stub() },
    };
    liquidityPoolAggregator = {
      id: "0x123",
      chainId: 1,
    };
    timestamp = new Date();
  });

  describe("Snapshot Creation", () => {

    beforeEach(() => {
      setLiquidityPoolAggregatorSnapshot(
        liquidityPoolAggregator as LiquidityPoolAggregator,
        timestamp,
        contextStub
      );
    })

    it("should create a snapshot of the liquidity pool aggregator", () => {

      expect(contextStub.LiquidityPoolAggregatorSnapshot.set.calledOnce).to.be
        .true;
      const snapshot =
        contextStub.LiquidityPoolAggregatorSnapshot.set.getCall(0).args[0];
      expect(snapshot.id).to.equal(
        `${liquidityPoolAggregator.chainId}-${
          liquidityPoolAggregator.id
        }_${timestamp.getTime()}`
      );
      expect(snapshot.pool).to.equal(liquidityPoolAggregator.id);
    });

  });

  describe("Updating the Liquidity Pool Aggregator", () => {

    let diff: any;
    beforeEach(() => {
      diff = {
        totalVolume0: 5000n,
        totalVolume1: 6000n,
        totalVolumeUSD: 7000n,
        numberOfSwaps: 11n,
      };
      updateLiquidityPoolAggregator(
        diff,
        liquidityPoolAggregator as LiquidityPoolAggregator,
        timestamp,
        contextStub
      );
    })

    it("should update the liquidity pool aggregator", () => {

      const updatedAggregator =
        contextStub.LiquidityPoolAggregator.set.getCall(0).args[0];
      expect(updatedAggregator.totalVolume0).to.equal(diff.totalVolume0);
      expect(updatedAggregator.totalVolume1).to.equal(diff.totalVolume1);
      expect(updatedAggregator.numberOfSwaps).to.equal(diff.numberOfSwaps);
    });

    it("should create a snapshot if the last update was more than 1 hour ago", () => {
      const snapshot =
        contextStub.LiquidityPoolAggregatorSnapshot.set.getCall(0).args[0];
      expect(snapshot).to.not.be.undefined;
    });

  });

});
