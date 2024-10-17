import { expect } from "chai";
import { MockDb, Pool } from "../../generated/src/TestHelpers.gen";
import { LiquidityPoolNew, Token } from "../../generated/src/Types.gen";
import { setupCommon } from "./common";
import {
  TEN_TO_THE_18_BI,
  TEN_TO_THE_6_BI,
  toChecksumAddress,
  TokenIdByChain,
} from "../../src/Constants";
import sinon from "sinon";
import * as PriceOracle from "../../src/PriceOracle";

describe("Pool Swap Event", () => {
  let mockToken0Data: any;
  let mockToken1Data: any;
  let mockLiquidityPoolData: any;

  let expected: any = {};

  let eventData: any;
  let mockPriceOracle: sinon.SinonStub;
  let mockDb: any;

  beforeEach(() => {
    const setupData = setupCommon();
    mockToken0Data = setupData.mockToken0Data;
    mockToken1Data = setupData.mockToken1Data;
    mockLiquidityPoolData = setupData.mockLiquidityPoolData;

    expected.swapAmount0In = 100n * mockToken0Data.decimals;
    expected.swapAmount1Out = 99n * mockToken1Data.decimals;

    // The code expects net abounts to be normalized to 1e18
    expected.expectedNetAmount0 =
      (expected.swapAmount0In * TEN_TO_THE_18_BI) /
      10n ** mockToken0Data.decimals;
    expected.expectedNetAmount1 =
      (expected.swapAmount1Out * TEN_TO_THE_18_BI) /
      10n ** mockToken1Data.decimals;

    expected.expectedLPVolume0 =
      mockLiquidityPoolData.totalVolume0 + expected.expectedNetAmount0;
    expected.expectedLPVolume1 =
      mockLiquidityPoolData.totalVolume1 + expected.expectedNetAmount1;

    // The code expects pricePerUSDNew to be normalized to 1e18
    expected.expectedLPVolumeUSD0 =
      expected.expectedNetAmount0 *
      (mockToken0Data.pricePerUSDNew / TEN_TO_THE_18_BI);
    expected.expectedLPVolumeUSD1 =
      expected.expectedNetAmount1 *
      (mockToken1Data.pricePerUSDNew / TEN_TO_THE_18_BI);

    mockPriceOracle = sinon
      .stub(PriceOracle, "set_whitelisted_prices")
      .resolves();
    mockDb = MockDb.createMockDb();

    eventData = {
      sender: "0x4444444444444444444444444444444444444444",
      to: "0x5555555555555555555555555555555555555555",
      amount0In: expected.swapAmount0In,
      amount1In: 0n,
      amount0Out: 0n,
      amount1Out: expected.swapAmount1Out,
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
  });

  afterEach(() => {
    mockPriceOracle.restore();
  });

  describe("when both tokens are missing", () => {
    it("should update the liquidity pool with swap count only", async () => {
      const modifiedMockLiquidityPoolData = {
        ...mockLiquidityPoolData,
        token0_id: TokenIdByChain(
          "0x9999999999999999999999999999999999999990",
          10
        ),
        token1_id: TokenIdByChain(
          "0x9999999999999999999999999999999999999999",
          10
        ),
      };

      const updatedDB1 = mockDb.entities.LiquidityPoolNew.set(
        modifiedMockLiquidityPoolData as LiquidityPoolNew
      );
      const mockEvent = Pool.Swap.createMockEvent(eventData);

      const postEventDB = await Pool.Swap.processEvent({
        event: mockEvent,
        mockDb: updatedDB1,
      });

      const updatedPool = postEventDB.entities.LiquidityPoolNew.get(
        toChecksumAddress(eventData.mockEventData.srcAddress)
      );
      expect(updatedPool).to.not.be.undefined;
      expect(updatedPool?.totalVolume0).to.equal(
        modifiedMockLiquidityPoolData.totalVolume0
      );
      expect(updatedPool?.totalVolume1).to.equal(
        modifiedMockLiquidityPoolData.totalVolume1
      );
      expect(updatedPool?.totalVolumeUSD).to.equal(
        modifiedMockLiquidityPoolData.totalVolumeUSD
      );
      expect(updatedPool?.numberOfSwaps).to.equal(1n);
      expect(updatedPool?.lastUpdatedTimestamp).to.deep.equal(
        new Date(eventData.mockEventData.block.timestamp * 1000)
      );
      expect(mockPriceOracle.calledOnce).to.be.true;
    });
  });
  describe("when token0 is missing", () => {
    let postEventDB: ReturnType<typeof MockDb.createMockDb>;

    beforeEach(async () => {
      // Set token0 to a different address not in the db tokens
      mockLiquidityPoolData.token0_id = TokenIdByChain(
        "0x9999999999999999999999999999999999999999",
        10
      );

      const updatedDB1 = mockDb.entities.LiquidityPoolNew.set(
        mockLiquidityPoolData as LiquidityPoolNew
      );
      const updatedDB2 = updatedDB1.entities.Token.set(mockToken0Data as Token);
      const updatedDB3 = updatedDB2.entities.Token.set(mockToken1Data as Token);

      const mockEvent = Pool.Swap.createMockEvent(eventData);

      postEventDB = await Pool.Swap.processEvent({
        event: mockEvent,
        mockDb: updatedDB3,
      });
    });

    it("should update the liquidity pool with token1 data only", async () => {
      const updatedPool = postEventDB.entities.LiquidityPoolNew.get(
        toChecksumAddress(eventData.mockEventData.srcAddress)
      );
      expect(updatedPool).to.not.be.undefined;

      expect(updatedPool?.totalVolume0).to.equal(
        mockLiquidityPoolData.totalVolume0,
        "Token0 nominal swap volume should not be updated"
      );
      expect(updatedPool?.totalVolume1).to.equal(
        expected.expectedNetAmount1,
        "Token1 nominal swap volume should be updated"
      );

      expect(updatedPool?.totalVolumeUSD).to.equal(
        expected.expectedLPVolumeUSD1,
        "Swap volume in USD should be updated for token 1"
      );

      expect(updatedPool?.numberOfSwaps).to.equal(
        1n,
        "Swap count should be updated"
      );
      expect(
        mockPriceOracle.calledOnce,
        "set_whitelisted_prices should be called"
      ).to.be.true;
    });
  });

  describe("when token1 is missing", () => {
    let postEventDB: ReturnType<typeof MockDb.createMockDb>;

    beforeEach(async () => {
      mockLiquidityPoolData.token1_id = TokenIdByChain(
        "0x9999999999999999999999999999999999999999",
        10
      );

      const updatedDB1 = mockDb.entities.LiquidityPoolNew.set(
        mockLiquidityPoolData as LiquidityPoolNew
      );
      const updatedDB2 = updatedDB1.entities.Token.set(mockToken0Data as Token);
      const updatedDB3 = updatedDB2.entities.Token.set(mockToken1Data as Token);

      const mockEvent = Pool.Swap.createMockEvent(eventData);

      postEventDB = await Pool.Swap.processEvent({
        event: mockEvent,
        mockDb: updatedDB3,
      });
    });

    it("should update the liquidity pool with token0 data only", async () => {
      const updatedPool = postEventDB.entities.LiquidityPoolNew.get(
        toChecksumAddress(eventData.mockEventData.srcAddress)
      );
      expect(updatedPool).to.not.be.undefined;

      expect(updatedPool?.totalVolume0).to.equal(
        expected.expectedNetAmount0,
        "Token0 nominal swap volume should be updated"
      );
      expect(updatedPool?.totalVolume1).to.equal(
        mockLiquidityPoolData.totalVolume1,
        "Token1 nominal swap volume in USD should not be updated"
      );

      expect(updatedPool?.totalVolumeUSD).to.equal(
        expected.expectedLPVolumeUSD0,
        "Total volume USD should be updated."
      );

      expect(updatedPool?.numberOfSwaps).to.equal(
        1n,
        "Swap count should be updated"
      );

      expect(
        mockPriceOracle.calledOnce,
        "set_whitelisted_prices should be called"
      ).to.be.true;
    });
  });

  describe("when both tokens exist", () => {
    let postEventDB: ReturnType<typeof MockDb.createMockDb>;

    beforeEach(async () => {
      const updatedDB1 = mockDb.entities.LiquidityPoolNew.set(
        mockLiquidityPoolData as LiquidityPoolNew
      );
      const updatedDB2 = updatedDB1.entities.Token.set(mockToken0Data as Token);
      const updatedDB3 = updatedDB2.entities.Token.set(mockToken1Data as Token);

      const mockEvent = Pool.Swap.createMockEvent(eventData);

      postEventDB = await Pool.Swap.processEvent({
        event: mockEvent,
        mockDb: updatedDB3,
      });
    });

    it("should create a new Pool_Swap entity and update LiquidityPool", async () => {
      const swapEvent = postEventDB.entities.Pool_Swap.get("10_123456_1");
      expect(swapEvent).to.not.be.undefined;
      expect(swapEvent?.sender).to.equal(eventData.sender);
      expect(swapEvent?.to).to.equal(eventData.to);
      expect(swapEvent?.amount0In).to.equal(eventData.amount0In);
      expect(swapEvent?.amount1Out).to.equal(eventData.amount1Out);
      expect(swapEvent?.timestamp).to.deep.equal(
        new Date(eventData.mockEventData.block.timestamp * 1000)
      );
      expect(mockPriceOracle.calledOnce).to.be.true;
    });

    it("should create a new Liquidity Pool if it doesn't exist", async () => {
      const updatedPool = postEventDB.entities.LiquidityPoolNew.get(
        toChecksumAddress(eventData.mockEventData.srcAddress)
      );
      expect(updatedPool).to.not.be.undefined;
      expect(updatedPool?.totalVolume0).to.equal(expected.expectedNetAmount0);
      expect(updatedPool?.totalVolume1).to.equal(expected.expectedNetAmount1);
      expect(updatedPool?.totalVolumeUSD).to.equal(
        expected.expectedLPVolumeUSD0
      );
      expect(updatedPool?.numberOfSwaps).to.equal(1n);
      expect(updatedPool?.lastUpdatedTimestamp).to.deep.equal(
        new Date(eventData.mockEventData.block.timestamp * 1000)
      );
      expect(mockPriceOracle.calledOnce).to.be.true;
    });
  });
});
