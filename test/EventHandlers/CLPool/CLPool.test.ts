import { expect } from "chai";
import sinon from "sinon";
import { MockDb, CLPool } from "../../../generated/src/TestHelpers.gen";
import {
  Token,
  CLFactory_PoolCreated,
  LiquidityPoolAggregator,
} from "../../../generated/src/Types.gen";
import * as LiquidityPoolAggregatorFunctions from "../../../src/Aggregators/LiquidityPoolAggregator";
import * as PriceOracle from "../../../src/PriceOracle";
import { abs } from "../../../src/Maths";
import { setupCommon } from "../Pool/common";

describe("CLPool Event Handlers", () => {
  let mockDb: any;
  let updateLiquidityPoolAggregatorStub: sinon.SinonStub;
  let setPricesStub: sinon.SinonStub;

  let mockToken0Data: any;
  let mockToken1Data: any;
  let mockLiquidityPoolData: any;

  beforeEach(() => {
    mockDb = MockDb.createMockDb();

    const { mockToken0Data, mockToken1Data, mockLiquidityPoolData } = setupCommon();

    updateLiquidityPoolAggregatorStub = sinon.stub(
      LiquidityPoolAggregatorFunctions,
      "updateLiquidityPoolAggregator"
    );
    setPricesStub = sinon
      .stub(PriceOracle, "set_whitelisted_prices")
      .resolves();

  });

  afterEach(() => {
    sinon.restore();
    updateLiquidityPoolAggregatorStub.restore();
  });

  describe("Mint Event", () => {
    let mockEvent: any;
    let eventData: any;

    let expectations: any = {
      amount0In: 100n * 10n ** 18n,
      amount1In: 100n * 10n ** 6n,
      totalLiquidity: 400n * 10n ** 18n,
    };

    const { mockToken0Data, mockToken1Data, mockLiquidityPoolData } = setupCommon();

    let postEventDB: any;
    let collectedEntity: any;

    beforeEach(async () => {
      const updatedDB1 = mockDb.entities.LiquidityPoolAggregator.set(mockLiquidityPoolData);

      const updatedDB2 = updatedDB1.entities.Token.set(mockToken0Data);
      const updatedDB3 = updatedDB2.entities.Token.set(mockToken1Data);

      eventData = {
        sender: "0x4444444444444444444444444444444444444444",
        to: "0x5555555555555555555555555555555555555555",
        amount0: expectations.amount0In,
        amount1: expectations.amount1In,
        tickUpper: 100000n,
        tickLower: 100000n,
        mockEventData: {
          block: {
            timestamp: 1000000,
            number: 123456,
            hash: "0x1234567890123456789012345678901234567890123456789012345678901234",
          },
          chainId: 10,
          logIndex: 1,
          srcAddress: "0x3333333333333333333333333333333333333333",
        },
      };
      mockEvent = CLPool.Mint.createMockEvent(eventData);

      postEventDB = await CLPool.Mint.processEvent({
        event: mockEvent,
        mockDb: updatedDB3,
      });

      const expectedId = `${mockEvent.chainId}_${mockEvent.block.number}_${mockEvent.logIndex}`;
      collectedEntity = postEventDB.entities.CLPool_Mint.get(expectedId);

    });

    it("should create a mint entity", () => {
      expect(collectedEntity).to.not.be.undefined;
      expect(collectedEntity?.amount0).to.equal(expectations.amount0In);
      expect(collectedEntity?.amount1).to.equal(expectations.amount1In);
    });

    describe("CLPool Aggregator", () => {
      let diff: any;
      beforeEach(() => {
        [diff] = updateLiquidityPoolAggregatorStub.firstCall.args;
      });

      it("should update the reserves", () => {
        expect(diff.reserve0).to.equal(
          mockLiquidityPoolData.reserve0 +
          expectations.amount0In,
          "Reserve 0 should be appropriately updated");
        expect(diff.reserve1).to.equal(
          mockLiquidityPoolData.reserve1 +
          expectations.amount1In,
         "Reserve 1 should be appropriately updated");
      });
      it("should update the total liquidity in USD correctly", () => {
        expect(diff.totalLiquidityUSD).to.equal(
          expectations.totalLiquidity,
         "Liquidity should be updated with appropriate prices");
      });
    });
  });

  describe("Burn Event", () => {
    let mockEvent: any;
    let eventData: any;

    let expectations: any = {
      amount0In: 100n * 10n ** 18n,
      amount1In: 100n * 10n ** 6n,
      totalLiquidity: 0n,
    };

    const { mockToken0Data, mockToken1Data, mockLiquidityPoolData } = setupCommon();

    let postEventDB: any;
    let collectedEntity: any;

    beforeEach(async () => {
      const updatedDB1 = mockDb.entities.LiquidityPoolAggregator.set(mockLiquidityPoolData);

      const updatedDB2 = updatedDB1.entities.Token.set(mockToken0Data);
      const updatedDB3 = updatedDB2.entities.Token.set(mockToken1Data);

      eventData = {
        sender: "0x4444444444444444444444444444444444444444",
        to: "0x5555555555555555555555555555555555555555",
        amount0: expectations.amount0In,
        amount1: expectations.amount1In,
        tickUpper: 100000n,
        tickLower: 100000n,
        mockEventData: {
          block: {
            timestamp: 1000000,
            number: 123456,
            hash: "0x1234567890123456789012345678901234567890123456789012345678901234",
          },
          chainId: 10,
          logIndex: 1,
          srcAddress: "0x3333333333333333333333333333333333333333",
        },
      };
      mockEvent = CLPool.Burn.createMockEvent(eventData);

      postEventDB = await CLPool.Burn.processEvent({
        event: mockEvent,
        mockDb: updatedDB3,
      });

      const expectedId = `${mockEvent.chainId}_${mockEvent.block.number}_${mockEvent.logIndex}`;
      collectedEntity = postEventDB.entities.CLPool_Burn.get(expectedId);

    });

    it("should create a burn entity", () => {
      expect(collectedEntity).to.not.be.undefined;
      expect(collectedEntity?.amount0).to.equal(expectations.amount0In);
      expect(collectedEntity?.amount1).to.equal(expectations.amount1In);
    });

    describe("CLPool Aggregator", () => {
      let diff: any;
      beforeEach(() => {
        [diff] = updateLiquidityPoolAggregatorStub.firstCall.args;
      });

      it("should update the reserves", () => {
        expect(diff.reserve0).to.equal(
          mockLiquidityPoolData.reserve0 -
          expectations.amount0In,
          "Reserve 0 should be appropriately updated");
        expect(diff.reserve1).to.equal(
          mockLiquidityPoolData.reserve1 -
          expectations.amount1In,
         "Reserve 1 should be appropriately updated");
      });
      it("should update the total liquidity in USD correctly", () => {
        expect(diff.totalLiquidityUSD).to.equal(
          expectations.totalLiquidity,
         "Liquidity should be updated with appropriate prices");
      });
    });
  });

  describe("Collect Event", () => {
    let mockEvent: any;
    let mockEventData: any;
    let setupDB: any;
    const { mockToken0Data, mockToken1Data, mockLiquidityPoolData } = setupCommon();
    const poolId = mockLiquidityPoolData.id; 
    const token0Id = mockToken0Data.id;
    const token1Id = mockToken1Data.id;

    const eventFees = {
      amount0: 100n * 10n ** 18n,
      amount1: 200n * 10n ** 6n,
    };

    beforeEach(() => {
      mockEventData = {
        amount0: eventFees.amount0,
        amount1: eventFees.amount1,
        mockEventData: {
          block: {
            number: 123456,
            timestamp: 1000000,
            hash: "0xblockhash",
          },
          chainId: 1,
          logIndex: 0,
          srcAddress: poolId,
        },
      };

      mockEvent = CLPool.Collect.createMockEvent(mockEventData);
    });

    describe("when event is processed", () => {
      beforeEach(async () => {
        let updatedDB = mockDb.entities.CLFactory_PoolCreated.set({
          id: `1_123456_0`,
          token0: token0Id,
          token1: token1Id,
          pool: poolId,
        } as CLFactory_PoolCreated);
        updatedDB = updatedDB.entities.Token.set(mockToken0Data);
        updatedDB = updatedDB.entities.Token.set(mockToken1Data);
        updatedDB =
          updatedDB.entities.LiquidityPoolAggregator.set(mockLiquidityPoolData);

        setupDB = await CLPool.Collect.processEvent({
          event: mockEvent,
          mockDb: updatedDB,
        });
      });

      it("should create a CLPool_Collect entity", async () => {
        const expectedId = `${mockEvent.chainId}_${mockEvent.block.number}_${mockEvent.logIndex}`;
        const collectEntity = setupDB.entities.CLPool_Collect.get(expectedId);
        expect(collectEntity).to.not.be.undefined;
        expect(collectEntity?.amount0).to.equal(100n * 10n ** 18n);
        expect(collectEntity?.amount1).to.equal(200n * 10n ** 6n);
      });

      it("should update LiquidityPoolAggregator", async () => {
        expect(updateLiquidityPoolAggregatorStub.calledOnce).to.be.true;
        const [diff] = updateLiquidityPoolAggregatorStub.firstCall.args;

        expect(diff.totalFees0).to.equal(
          mockLiquidityPoolData.totalFees0 + eventFees.amount0
        );
        expect(diff.totalFees1).to.equal(
          mockLiquidityPoolData.totalFees1 + eventFees.amount1
        );
      });
    });
  });
  describe("Collect Fees Event", () => {
    let mockEvent: any;
    let mockEventData: any;
    let setupDB: any;

    const eventFees = {
      amount0: 100n * 10n ** 18n,
      amount1: 200n * 10n ** 6n,
    };
    const { mockToken0Data, mockToken1Data, mockLiquidityPoolData} = setupCommon();
    const poolId = mockLiquidityPoolData.id; 
    const token0Id = mockToken0Data.id;
    const token1Id = mockToken1Data.id;

    beforeEach(() => {
      mockEventData = {
        amount0: eventFees.amount0,
        amount1: eventFees.amount1,
        mockEventData: {
          block: {
            number: 123456,
            timestamp: 1000000,
            hash: "0xblockhash",
          },
          chainId: 1,
          logIndex: 0,
          srcAddress: poolId,
        },
      };

      mockEvent = CLPool.CollectFees.createMockEvent(mockEventData);

    });

    describe("when event is processed", () => {
      let collectEntity: any;
      let diff: any;

      beforeEach(async () => {
        let updatedDB = mockDb.entities.CLFactory_PoolCreated.set({
          id: `1_123456_0`,
          token0: token0Id,
          token1: token1Id,
          pool: poolId,
        } as CLFactory_PoolCreated);
        updatedDB = updatedDB.entities.Token.set(mockToken0Data as Token);
        updatedDB = updatedDB.entities.Token.set(mockToken1Data as Token);
        updatedDB =
          updatedDB.entities.LiquidityPoolAggregator.set(mockLiquidityPoolData as LiquidityPoolAggregator);

        setupDB = await CLPool.CollectFees.processEvent({
          event: mockEvent,
          mockDb: updatedDB,
        });
        const expectedId = `${mockEvent.chainId}_${mockEvent.block.number}_${mockEvent.logIndex}`;
        collectEntity = setupDB.entities.CLPool_CollectFees.get(expectedId);
        [diff] = updateLiquidityPoolAggregatorStub.firstCall.args;
      });

      it("should create a CLPool_CollectFees entity", async () => {
        expect(collectEntity).to.not.be.undefined;
        expect(collectEntity?.amount0).to.equal(100n * 10n ** 18n);
        expect(collectEntity?.amount1).to.equal(200n * 10n ** 6n);
      });

      it("should update LiquidityPoolAggregator", async () => {
        expect(updateLiquidityPoolAggregatorStub.calledOnce).to.be.true;
      });

      it("should update nominal fee amounts correctly", async () => {
        expect(diff.totalFees0).to.equal(
          mockLiquidityPoolData.totalFees0 + eventFees.amount0
        );
        expect(diff.totalFees1).to.equal(
          mockLiquidityPoolData.totalFees1 + eventFees.amount1
        );
      });

      it("should correctly update total fees in USD", async () => {
        expect(diff.totalFeesUSD).to.equal(
          mockLiquidityPoolData.totalFeesUSD +
            (eventFees.amount0 * mockToken0Data.pricePerUSDNew) / 10n ** 18n +
            (eventFees.amount1 / 10n ** 6n) * mockToken1Data.pricePerUSDNew,
          "It should correctly update total fees in USD"
        );
      });
    });
  });

  describe("Swap Event", () => {
    let mockEvent: ReturnType<typeof CLPool.Swap.createMockEvent>;
    let swapEntity: any;
    let aggregatorCalls: any;

    const { mockToken0Data, mockToken1Data, mockLiquidityPoolData } = setupCommon();
    const poolId = mockLiquidityPoolData.id; 
    const token0Id = mockToken0Data.id;
    const token1Id = mockToken1Data.id;

    beforeEach(async () => {

      mockEvent = CLPool.Swap.createMockEvent({
        sender: "0xsender",
        recipient: "0xrecipient",
        amount0: -100n * 10n ** 18n, // Negative for outgoing
        amount1: 200n * 10n ** 6n, // Positive for incoming
        sqrtPriceX96: 1n << 96n,
        liquidity: 1000000n,
        tick: 0n,
        mockEventData: {
          block: {
            number: 123456,
            timestamp: 1000000,
            hash: "0xblockhash",
          },
          chainId: 1,
          logIndex: 0,
          srcAddress: poolId,
        },
      });
    });

    describe("when tokens exist", () => {
      beforeEach(async () => {
        let updatedDB = mockDb.entities.CLFactory_PoolCreated.set({
          id: `1_123456_0`,
          token0: token0Id,
          token1: token1Id,
          pool: poolId,
        } as CLFactory_PoolCreated);

        let updatedDB2 = updatedDB.entities.LiquidityPoolAggregator.set(mockLiquidityPoolData as LiquidityPoolAggregator);
        let updatedDB3 = updatedDB2.entities.Token.set(mockToken0Data as Token);
        let updatedDB4 = updatedDB3.entities.Token.set(mockToken1Data as Token);
        mockDb = updatedDB4;

        const result = await CLPool.Swap.processEvent({
          event: mockEvent,
          mockDb,
        });
        swapEntity = result.entities.CLPool_Swap.get(`1_123456_0`);
        aggregatorCalls = updateLiquidityPoolAggregatorStub.firstCall.args;
      });

      it("should create a CLPool_Swap entity", async () => {
        expect(swapEntity).to.not.be.undefined;
        expect(swapEntity?.sender).to.equal("0xsender");
        expect(swapEntity?.recipient).to.equal("0xrecipient");
        expect(swapEntity?.amount0).to.equal(-100n * 10n ** 18n);
        expect(swapEntity?.amount1).to.equal(200n * 10n ** 6n);
        expect(swapEntity?.sqrtPriceX96).to.equal(1n << 96n);
        expect(swapEntity?.liquidity).to.equal(1000000n);
        expect(swapEntity?.tick).to.equal(0n);
      });

      it("should update LiquidityPoolAggregator", async () => {
        expect(updateLiquidityPoolAggregatorStub.calledOnce).to.be.true;
      });

      it("should update nominal volume amounts correctly", async () => {
        const [diff] = aggregatorCalls;
        expect(diff.totalVolume0).to.equal(
          mockLiquidityPoolData.totalVolume0 + abs(mockEvent.params.amount0)
        );
        expect(diff.totalVolume1).to.equal(
          mockLiquidityPoolData.totalVolume1 + abs(mockEvent.params.amount1)
        );
      });

      it("should update number of swaps correctly", async () => {
        const [diff] = aggregatorCalls;
        expect(diff.numberOfSwaps).to.equal(2n);
      });

      it("should correctly update total volume in USD", async () => {
        const [diff] = aggregatorCalls;
        expect(diff.totalVolumeUSD).to.equal(
          mockLiquidityPoolData.totalVolumeUSD +
            (abs(mockEvent.params.amount0) * mockToken0Data.pricePerUSDNew) /
              10n ** mockToken0Data.decimals
        );
      });

      it("should update token prices correctly", async () => {
        const [diff] = aggregatorCalls;
        expect(diff.token0Price).to.equal(1n * 10n ** 18n);
        expect(diff.token1Price).to.equal(1n * 10n ** 18n);
      });

      it("should call set_whitelisted_prices", async () => {
        expect(setPricesStub.calledOnce).to.be.true;
        const [chainId, blockNumber, blockDatetime] =
          setPricesStub.firstCall.args;

        expect(chainId).to.equal(1);
        expect(blockNumber).to.equal(123456);
        expect(blockDatetime).to.deep.equal(new Date(1000000 * 1000));
      });
    });

    describe("when tokens do not exist", () => {
      beforeEach(async () => {
        let updatedDB = mockDb.entities.CLFactory_PoolCreated.set({
          id: `1_123456_0`,
          token0: token0Id,
          token1: token1Id,
          pool: poolId,
        } as CLFactory_PoolCreated);

        let updatedDB2 =
          updatedDB.entities.LiquidityPoolAggregator.set(mockLiquidityPoolData);
        let updatedDB3 = updatedDB2.entities.Token.set(mockToken1Data);

        await CLPool.Swap.processEvent({
          event: mockEvent,
          mockDb: updatedDB3,
        });
      });

      it("should handle missing token instances", async () => {
        expect(updateLiquidityPoolAggregatorStub.calledOnce).to.be.true;
        const [diff] = updateLiquidityPoolAggregatorStub.firstCall.args;

        expect(diff.totalVolume0).to.equal(
          mockLiquidityPoolData.totalVolume0 + abs(mockEvent.params.amount0)
        );
        expect(diff.totalVolume1).to.equal(
          mockLiquidityPoolData.totalVolume1 + abs(mockEvent.params.amount1)
        );
        expect(diff.totalVolumeUSD).to.equal(
          mockLiquidityPoolData.totalVolumeUSD +
            (abs(mockEvent.params.amount1) * mockToken1Data.pricePerUSDNew) /
              10n ** mockToken1Data.decimals
        );
      });
    });
  });
});
