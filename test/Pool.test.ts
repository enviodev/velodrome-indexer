import { expect } from "chai";
import { MockDb, Pool } from "../generated/src/TestHelpers.gen";
import {
  LiquidityPoolNew,
  Token,
} from "../generated/src/Types.gen";
import {
  TEN_TO_THE_18_BI,
  TEN_TO_THE_6_BI,
  toChecksumAddress,
  TokenIdByChain,
} from "../src/Constants";
import sinon from "sinon";
import * as PriceOracle from "../src/PriceOracle";

describe("Pool Events", () => {
  let mockDb: ReturnType<typeof MockDb.createMockDb>;
  let mockPriceOracle: sinon.SinonStub;

  beforeEach(() => {
    mockDb = MockDb.createMockDb();
    mockPriceOracle = sinon
      .stub(PriceOracle, "set_whitelisted_prices")
      .resolves();
  });

  afterEach(() => {
    mockPriceOracle.restore();
  });

  describe("Mint event", () => {
    it("should create a new Pool_Mint entity", async () => {
      const mockEvent = Pool.Mint.createMockEvent({
        sender: "0x1111111111111111111111111111111111111111",
        amount0: 1000n * TEN_TO_THE_18_BI,
        amount1: 2000n * TEN_TO_THE_18_BI,
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
      });

      const result = await Pool.Mint.processEvent({ event: mockEvent, mockDb });

      const mintEvent = result.entities.Pool_Mint.get("10_123456_1");
      expect(mintEvent).to.not.be.undefined;
      expect(mintEvent?.sender).to.equal(
        "0x1111111111111111111111111111111111111111"
      );
      expect(mintEvent?.amount0).to.equal(1000n * TEN_TO_THE_18_BI);
      expect(mintEvent?.amount1).to.equal(2000n * TEN_TO_THE_18_BI);
      expect(mintEvent?.timestamp).to.deep.equal(new Date(1000000 * 1000));
    });
  });

  describe("Burn event", () => {
    it("should create a new Pool_Burn entity", async () => {
      const mockEvent = Pool.Burn.createMockEvent({
        sender: "0x1111111111111111111111111111111111111111",
        to: "0x2222222222222222222222222222222222222222",
        amount0: 500n * TEN_TO_THE_18_BI,
        amount1: 1000n * TEN_TO_THE_18_BI,
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
      });

      const result = await Pool.Burn.processEvent({ event: mockEvent, mockDb });

      const burnEvent = result.entities.Pool_Burn.get("10_123456_1");
      expect(burnEvent).to.not.be.undefined;
      expect(burnEvent?.sender).to.equal(
        "0x1111111111111111111111111111111111111111"
      );
      expect(burnEvent?.to).to.equal(
        "0x2222222222222222222222222222222222222222"
      );
      expect(burnEvent?.amount0).to.equal(500n * TEN_TO_THE_18_BI);
      expect(burnEvent?.amount1).to.equal(1000n * TEN_TO_THE_18_BI);
      expect(burnEvent?.timestamp).to.deep.equal(new Date(1000000 * 1000));
    });
  });

  describe("Fees event", () => {
    it("should update LiquidityPool entity with new fees", async () => {
      const poolId = toChecksumAddress(
        "0x3333333333333333333333333333333333333333"
      );
      const mockLiquidityPool: LiquidityPoolNew = {
        id: poolId,
        chainID: 10n,
        token0_id: TokenIdByChain(
          "0x1111111111111111111111111111111111111111",
          10
        ),
        token1_id: TokenIdByChain(
          "0x2222222222222222222222222222222222222222",
          10
        ),
        totalFees0: 0n,
        totalFees1: 0n,
        totalFeesUSD: 0n,
      } as LiquidityPoolNew;

      const mockToken0: Token = {
        id: TokenIdByChain("0x1111111111111111111111111111111111111111", 10),
        decimals: 18n,
        pricePerUSDNew: TEN_TO_THE_18_BI, // 1 USD
      } as Token;

      const mockToken1: Token = {
        id: TokenIdByChain("0x2222222222222222222222222222222222222222", 10),
        decimals: 6n,
        pricePerUSDNew: TEN_TO_THE_18_BI, // 1 USD
      } as Token;

      const updatedDB1 = mockDb.entities.Token.set(mockToken0);
      const updatedDB2 = updatedDB1.entities.Token.set(mockToken1);
      const updatedDB3 =
        updatedDB2.entities.LiquidityPoolNew.set(mockLiquidityPool);

      const mockEvent = Pool.Fees.createMockEvent({
        amount0: 100n * TEN_TO_THE_18_BI,
        amount1: 200n * TEN_TO_THE_6_BI,
        mockEventData: {
          block: {
            number: 123456,
            timestamp: 1000000,
            hash: "0x1234567890123456789012345678901234567890123456789012345678901234",
          },
          chainId: 10,
          srcAddress: toChecksumAddress(
            "0x3333333333333333333333333333333333333333"
          ),
        },
      });

      const result = await Pool.Fees.processEvent({
        event: mockEvent,
        mockDb: updatedDB3,
      });

      const updatedPool = result.entities.LiquidityPoolNew.get(poolId);
      expect(updatedPool).to.not.be.undefined;
      expect(updatedPool?.totalFees0).to.equal(100n * TEN_TO_THE_18_BI);
      expect(updatedPool?.totalFees1).to.equal(200n * TEN_TO_THE_18_BI);
      expect(updatedPool?.totalFeesUSD).to.equal(300n * TEN_TO_THE_18_BI); // 100 + 200
      expect(updatedPool?.lastUpdatedTimestamp).to.deep.equal(
        new Date(1000000 * 1000)
      );
    });
  });

  describe("Swap event", () => {
    it("should create a new Pool_Swap entity and update LiquidityPool", async () => {
      const mockLiquidityPool: LiquidityPoolNew = {
        id: toChecksumAddress("0x3333333333333333333333333333333333333333"),
        chainID: 10n,
        token0_id: TokenIdByChain(
          "0x1111111111111111111111111111111111111111",
          10
        ),
        token1_id: TokenIdByChain(
          "0x2222222222222222222222222222222222222222",
          10
        ),
        totalVolume0: 0n,
        totalVolume1: 0n,
        totalVolumeUSD: 0n,
        numberOfSwaps: 0n,
      } as LiquidityPoolNew;

      const mockToken0: Token = {
        id: TokenIdByChain("0x1111111111111111111111111111111111111111", 10),
        decimals: 18n,
        pricePerUSDNew: TEN_TO_THE_18_BI, // 1 USD
      } as Token;

      const mockToken1: Token = {
        id: TokenIdByChain("0x2222222222222222222222222222222222222222", 10),
        decimals: 6n,
        pricePerUSDNew: TEN_TO_THE_18_BI, // 1 USD
      } as Token;

      const updatedDB1 = mockDb.entities.LiquidityPoolNew.set(mockLiquidityPool);
      const updatedDB2 = updatedDB1.entities.Token.set(mockToken0);
      const updatedDB3 = updatedDB2.entities.Token.set(mockToken1);

      const mockEvent = Pool.Swap.createMockEvent({
        sender: "0x4444444444444444444444444444444444444444",
        to: "0x5555555555555555555555555555555555555555",
        amount0In: 100n * TEN_TO_THE_18_BI,
        amount1In: 0n,
        amount0Out: 0n,
        amount1Out: 99n * TEN_TO_THE_6_BI,
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
      });

      const result = await Pool.Swap.processEvent({ event: mockEvent, mockDb: updatedDB3 });

      const swapEvent = result.entities.Pool_Swap.get("10_123456_1");
      expect(swapEvent).to.not.be.undefined;
      expect(swapEvent?.sender).to.equal(
        "0x4444444444444444444444444444444444444444"
      );
      expect(swapEvent?.to).to.equal(
        "0x5555555555555555555555555555555555555555"
      );
      expect(swapEvent?.amount0In).to.equal(100n * TEN_TO_THE_18_BI);
      expect(swapEvent?.amount1Out).to.equal(99n * TEN_TO_THE_6_BI);

      const updatedPool = result.entities.LiquidityPoolNew.get(
        toChecksumAddress("0x3333333333333333333333333333333333333333")
      );
      expect(updatedPool).to.not.be.undefined;
      expect(updatedPool?.totalVolume0).to.equal(100n * TEN_TO_THE_18_BI);
      expect(updatedPool?.totalVolume1).to.equal(99n * TEN_TO_THE_18_BI);
      expect(updatedPool?.totalVolumeUSD).to.equal(100n * TEN_TO_THE_18_BI);
      expect(updatedPool?.numberOfSwaps).to.equal(1n);
    });
  });

  describe("Sync event", () => {
    it("should update LiquidityPool reserves and call set_whitelisted_prices", async () => {
      const mockLiquidityPool: LiquidityPoolNew = {
        id: toChecksumAddress("0x3333333333333333333333333333333333333333"),
        chainID: 10n,
        token0_id: TokenIdByChain(
          "0x1111111111111111111111111111111111111111",
          10
        ),
        token1_id: TokenIdByChain(
          "0x2222222222222222222222222222222222222222",
          10
        ),
        reserve0: 10000n * TEN_TO_THE_18_BI,
        reserve1: 20000n * TEN_TO_THE_6_BI,
      } as LiquidityPoolNew;

      const mockToken0: Token = {
        id: TokenIdByChain("0x1111111111111111111111111111111111111111", 10),
        decimals: 18n,
        pricePerUSDNew: TEN_TO_THE_18_BI, // 1 USD
      } as Token;

      const mockToken1: Token = {
        id: TokenIdByChain("0x2222222222222222222222222222222222222222", 10),
        decimals: 6n,
        pricePerUSDNew: TEN_TO_THE_18_BI, // 1 USD
      } as Token;

      const updatedDB1 = mockDb.entities.LiquidityPoolNew.set(mockLiquidityPool);
      const updatedDB2 = updatedDB1.entities.Token.set(mockToken0);
      const updatedDB3 = updatedDB2.entities.Token.set(mockToken1);

      const mockEvent = Pool.Sync.createMockEvent({
        reserve0: 11000n * TEN_TO_THE_18_BI,
        reserve1: 22000n * TEN_TO_THE_6_BI,
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
      });

      const result = await Pool.Sync.processEvent({ event: mockEvent, mockDb: updatedDB3 });


      const syncEvent = result.entities.Pool_Sync.get("10_123456_1");
      expect(syncEvent).to.not.be.undefined;
      expect(syncEvent?.reserve0).to.equal(11000n * TEN_TO_THE_18_BI);
      expect(syncEvent?.reserve1).to.equal(22000n * TEN_TO_THE_6_BI);

      const updatedPool = result.entities.LiquidityPoolNew.get(
        toChecksumAddress("0x3333333333333333333333333333333333333333")
      );

      expect(updatedPool).to.not.be.undefined;
      expect(updatedPool?.reserve0).to.equal(11000n * TEN_TO_THE_18_BI);
      expect(updatedPool?.reserve1).to.equal(22000n * TEN_TO_THE_18_BI);
      expect(updatedPool?.totalLiquidityUSD).to.equal(
        33000n * TEN_TO_THE_18_BI
      );

      expect(mockPriceOracle.calledOnce).to.be.true;
      expect(mockPriceOracle.firstCall.args[0]).to.equal(10); // chainId
      expect(mockPriceOracle.firstCall.args[1]).to.equal(123456); // blockNumber
    });
  });
});
