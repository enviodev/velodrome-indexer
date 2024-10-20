import { expect } from "chai";
import sinon from "sinon";
import {
  LiquidityPoolAggregator,
  handlerContext,
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

  it("should create a snapshot of the liquidity pool aggregator", () => {
    setLiquidityPoolAggregatorSnapshot(
      liquidityPoolAggregator as LiquidityPoolAggregator,
      timestamp,
      contextStub
    );

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

  it("should update the liquidity pool aggregator and create a snapshot if needed", () => {
    const diff = {
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

    expect(contextStub.LiquidityPoolAggregator.set.calledTwice).to.be.true;
    const updatedAggregator =
      contextStub.LiquidityPoolAggregator.set.getCall(0).args[0];
    expect(updatedAggregator.totalVolume0).to.equal(diff.totalVolume0);
    expect(updatedAggregator.totalVolume1).to.equal(diff.totalVolume1);
    expect(updatedAggregator.numberOfSwaps).to.equal(diff.numberOfSwaps);

    const snapshot =
      contextStub.LiquidityPoolAggregatorSnapshot.set.getCall(0).args[0];
    expect(snapshot).to.not.be.undefined;
  });
});
