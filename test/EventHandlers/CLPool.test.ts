import { expect } from "chai";
import sinon from "sinon";
import { MockDb, CLPool } from "../../generated/src/TestHelpers.gen";
import {
  CLPoolAggregator,
  Token,
  CLFactory_PoolCreated,
} from "../../generated/src/Types.gen";
import * as CLPoolAggregatorFunctions from "../../src/Aggregators/CLPoolAggregator";
import * as PriceOracle from "../../src/PriceOracle";
import { abs } from "../../src/Maths";

describe("CLPool Event Handlers", () => {
  let mockDb: any;
  let updateCLPoolAggregatorStub: sinon.SinonStub;
  let setPricesStub: sinon.SinonStub;

  beforeEach(() => {
    mockDb = MockDb.createMockDb();

    updateCLPoolAggregatorStub = sinon.stub(
      CLPoolAggregatorFunctions,
      "updateCLPoolAggregator"
    );
    setPricesStub = sinon
      .stub(PriceOracle, "set_whitelisted_prices")
      .resolves();
  });

  afterEach(() => {
    sinon.restore();
    updateCLPoolAggregatorStub.restore();
  });

  describe("Collect Event", () => {
    let mockEvent: any;
    const poolId = "0x1234567890123456789012345678901234567890";
    const token0Id = "0x0000000000000000000000000000000000000001";
    const token1Id = "0x0000000000000000000000000000000000000002";
    let mockCLPoolAggregator: any;
    let mockEventData: any;
    let setupDB: any;
    let mockToken0: Token;
    let mockToken1: Token;

    const eventFees = {
      amount0: 100n * 10n ** 18n,
      amount1: 200n * 10n ** 6n,
    };

    beforeEach(() => {
      mockToken0 = {
        id: token0Id,
        decimals: 18n,
        pricePerUSDNew: 1n * 10n ** 18n,
      } as Token;

      mockToken1 = {
        id: token1Id,
        decimals: 6n,
        pricePerUSDNew: 1n * 10n ** 18n,
      } as Token;

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

      mockCLPoolAggregator = {
        id: poolId,
        chainId: 1,
        totalFees0: 100n * 10n ** 18n,
        totalFees1: 200n * 10n ** 18n,
        totalFeesUSD: 300n * 10n ** 18n,
      } as CLPoolAggregator;
    });

    describe("when event is processed", () => {
      beforeEach(async () => {
        let updatedDB = mockDb.entities.CLFactory_PoolCreated.set({
          id: `1_123456_0`,
          token0: token0Id,
          token1: token1Id,
          pool: poolId,
        } as CLFactory_PoolCreated);
        updatedDB = updatedDB.entities.Token.set(mockToken0);
        updatedDB = updatedDB.entities.Token.set(mockToken1);
        updatedDB =
          updatedDB.entities.CLPoolAggregator.set(mockCLPoolAggregator);

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

      it("should update CLPoolAggregator", async () => {
        expect(updateCLPoolAggregatorStub.calledOnce).to.be.true;
        const [diff] = updateCLPoolAggregatorStub.firstCall.args;

        expect(diff.totalFees0).to.equal(
          mockCLPoolAggregator.totalFees0 + eventFees.amount0
        );
        expect(diff.totalFees1).to.equal(
          mockCLPoolAggregator.totalFees1 +
            (eventFees.amount1 * 10n ** 18n) / 10n ** 6n,
          "It should normalize fees here"
        );
      });
    });
  });
  describe("Collect Fees Event", () => {
    let mockEvent: any;
    const poolId = "0x1234567890123456789012345678901234567890";
    const token0Id = "0x0000000000000000000000000000000000000001";
    const token1Id = "0x0000000000000000000000000000000000000002";
    let mockCLPoolAggregator: any;
    let mockEventData: any;
    let setupDB: any;
    let mockToken0: Token;
    let mockToken1: Token;

    const eventFees = {
      amount0: 100n * 10n ** 18n,
      amount1: 200n * 10n ** 6n,
    };

    beforeEach(() => {
      mockToken0 = {
        id: token0Id,
        decimals: 18n,
        pricePerUSDNew: 1n * 10n ** 18n,
      } as Token;

      mockToken1 = {
        id: token1Id,
        decimals: 6n,
        pricePerUSDNew: 1n * 10n ** 18n,
      } as Token;

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

      mockCLPoolAggregator = {
        id: poolId,
        chainId: 1,
        totalFees0: 100n * 10n ** 18n,
        totalFees1: 200n * 10n ** 18n,
        totalFeesUSD: 300n * 10n ** 18n,
      } as CLPoolAggregator;
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
        updatedDB = updatedDB.entities.Token.set(mockToken0);
        updatedDB = updatedDB.entities.Token.set(mockToken1);
        updatedDB =
          updatedDB.entities.CLPoolAggregator.set(mockCLPoolAggregator);

        setupDB = await CLPool.CollectFees.processEvent({
          event: mockEvent,
          mockDb: updatedDB,
        });
        const expectedId = `${mockEvent.chainId}_${mockEvent.block.number}_${mockEvent.logIndex}`;
        collectEntity = setupDB.entities.CLPool_CollectFees.get(expectedId);
        [diff] = updateCLPoolAggregatorStub.firstCall.args;
      });

      it("should create a CLPool_CollectFees entity", async () => {
        expect(collectEntity).to.not.be.undefined;
        expect(collectEntity?.amount0).to.equal(100n * 10n ** 18n);
        expect(collectEntity?.amount1).to.equal(200n * 10n ** 6n);
      });

      it("should update CLPoolAggregator", async () => {
        expect(updateCLPoolAggregatorStub.calledOnce).to.be.true;
      });

      it("should update nominal fee amounts correctly", async () => {
        expect(diff.totalFees0).to.equal(
          mockCLPoolAggregator.totalFees0 + eventFees.amount0
        );
        expect(diff.totalFees1).to.equal(
          mockCLPoolAggregator.totalFees1 +
            (eventFees.amount1 * 10n ** 18n) / 10n ** 6n,
          "It should normalize fees here"
        );
      });

      it("should correctly update total fees in USD", async () => {
        expect(diff.totalFeesUSD).to.equal(
          mockCLPoolAggregator.totalFeesUSD +
            (eventFees.amount0 * mockToken0.pricePerUSDNew) / 10n ** 18n +
            (eventFees.amount1 / 10n ** 6n) * mockToken1.pricePerUSDNew,
          "It should correctly update total fees in USD"
        );
      });
    });
  });

  describe("Swap Event", () => {
    const poolId = "0x1234567890123456789012345678901234567890";
    const token0Id = "0x0000000000000000000000000000000000000001";
    const token1Id = "0x0000000000000000000000000000000000000002";
    let mockEvent: ReturnType<typeof CLPool.Swap.createMockEvent>;
    let mockCLPoolAggregator: CLPoolAggregator;
    let mockToken0: Token;
    let mockToken1: Token;
    let swapEntity: any;
    let aggregatorCalls: any;

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

      mockCLPoolAggregator = {
        id: poolId,
        chainId: 1,
        totalVolume0: 1000n * 10n ** 18n,
        totalVolume1: 2000n * 10n ** 6n,
        totalVolumeUSD: 3000n * 10n ** 18n,
        numberOfSwaps: 10n,
        token0Price: 1n * 10n ** 18n,
        token1Price: 1n * 10n ** 18n,
      } as CLPoolAggregator;

      mockToken0 = {
        id: token0Id,
        decimals: 18n,
        pricePerUSDNew: 1n * 10n ** 18n,
      } as Token;

      mockToken1 = {
        id: token1Id,
        decimals: 6n,
        pricePerUSDNew: 1n * 10n ** 18n,
      } as Token;
    });

    describe("when tokens exist", () => {
      beforeEach(async () => {
        let updatedDB = mockDb.entities.CLFactory_PoolCreated.set({
          id: `1_123456_0`,
          token0: token0Id,
          token1: token1Id,
          pool: poolId,
        } as CLFactory_PoolCreated);

        let updatedDB2 =
          updatedDB.entities.CLPoolAggregator.set(mockCLPoolAggregator);
        let updatedDB3 = updatedDB2.entities.Token.set(mockToken0);
        let updatedDB4 = updatedDB3.entities.Token.set(mockToken1);
        mockDb = updatedDB4;

        const result = await CLPool.Swap.processEvent({
          event: mockEvent,
          mockDb,
        });
        swapEntity = result.entities.CLPool_Swap.get(`1_123456_0`);
        aggregatorCalls = updateCLPoolAggregatorStub.firstCall.args;
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

      it("should update CLPoolAggregator", async () => {
        expect(updateCLPoolAggregatorStub.calledOnce).to.be.true;
      });

      it("should update nominal volume amounts correctly", async () => {
        const [diff] = aggregatorCalls;
        expect(diff.totalVolume0).to.equal(
          mockCLPoolAggregator.totalVolume0 + abs(mockEvent.params.amount0)
        );
        expect(diff.totalVolume1).to.equal(
          mockCLPoolAggregator.totalVolume1 +
            (abs(mockEvent.params.amount1) * 10n ** 18n) /
              10n ** mockToken1.decimals,
          "It should normalize the volume 18 decimals. Note here the incoming decimals are 6."
        );
      });

      it("should update number of swaps correctly", async () => {
        const [diff] = aggregatorCalls;
        expect(diff.numberOfSwaps).to.equal(11n);
      });

      it("should correctly update total volume in USD", async () => {
        const [diff] = aggregatorCalls;
        expect(diff.totalVolumeUSD).to.equal(
          mockCLPoolAggregator.totalVolumeUSD +
            (abs(mockEvent.params.amount0) * mockToken0.pricePerUSDNew) /
              10n ** mockToken0.decimals
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
          updatedDB.entities.CLPoolAggregator.set(mockCLPoolAggregator);
        let updatedDB3 = updatedDB2.entities.Token.set(mockToken1);

        await CLPool.Swap.processEvent({
          event: mockEvent,
          mockDb: updatedDB3,
        });
      });

      it("should handle missing token instances", async () => {
        expect(updateCLPoolAggregatorStub.calledOnce).to.be.true;
        const [diff] = updateCLPoolAggregatorStub.firstCall.args;

        expect(diff.totalVolume0).to.equal(mockCLPoolAggregator.totalVolume0); // Unchanged
        expect(diff.totalVolume1).to.equal(
          mockCLPoolAggregator.totalVolume1 +
            (abs(mockEvent.params.amount1) * 10n ** 18n) /
              10n ** mockToken1.decimals,
          "It should normalize the volume 18 decimals. Note here the incoming decimals are 6."
        );
        expect(diff.totalVolumeUSD).to.equal(
          mockCLPoolAggregator.totalVolumeUSD +
            (abs(mockEvent.params.amount1) * mockToken1.pricePerUSDNew) /
              10n ** mockToken1.decimals
        );
      });
    });
  });
});
