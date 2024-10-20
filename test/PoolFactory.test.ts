import { expect } from "chai";
import { MockDb, PoolFactory } from "../generated/src/TestHelpers.gen";
import { LiquidityPoolAggregator, Token } from "../generated/src/Types.gen";
import { TEN_TO_THE_18_BI } from "../src/Constants";
import { toChecksumAddress } from "../src/Constants";

describe("PoolFactory Events", () => {
  describe("PoolCreated event", () => {
    it("should create a new LiquidityPool entity and Token entities", async () => {
      // Setup
      const mockDb = MockDb.createMockDb();
      const mockEvent = PoolFactory.PoolCreated.createMockEvent({
        token0: "0x1111111111111111111111111111111111111111",
        token1: "0x2222222222222222222222222222222222222222",
        pool: "0x3333333333333333333333333333333333333333",
        stable: false,
        mockEventData: { 
          block: {
            timestamp: 1000000,
            hash: "0x1234567890123456789012345678901234567890123456789012345678901234"
          }, 
          chainId: 10,
          logIndex: 1,
        }
      });

      // Execute
      const result = await PoolFactory.PoolCreated.processEvent({ event: mockEvent, mockDb });

      // Assert
      const createdPool = result.entities.LiquidityPoolAggregator.get(toChecksumAddress("0x3333333333333333333333333333333333333333"));
      expect(createdPool).to.not.be.undefined;
      expect(createdPool?.token0_id).to.equal(toChecksumAddress("0x1111111111111111111111111111111111111111") + "-10");
      expect(createdPool?.token1_id).to.equal(toChecksumAddress("0x2222222222222222222222222222222222222222") + "-10");
      expect(createdPool?.isStable).to.be.false;
      expect(createdPool?.lastUpdatedTimestamp).to.deep.equal(new Date(1000000 * 1000));
    });
  });

  describe("SetCustomFee event", () => {
    it("should create a new PoolFactory_SetCustomFee entity", async () => {
      // Setup
      const mockDb = MockDb.createMockDb();
      const mockEvent = PoolFactory.SetCustomFee.createMockEvent({
        pool: "0x3333333333333333333333333333333333333333",
        fee: 100n,
        mockEventData: { 
          block: {
            number: 1000000,
            timestamp: 1000000,
            hash: "0x1234567890123456789012345678901234567890123456789012345678901234"
          }, 
          chainId: 10,
          logIndex: 1,
        }
      });

      // Execute
      const result = await PoolFactory.SetCustomFee.processEvent({ event: mockEvent, mockDb });

      // Assert
      const setCustomFeeEvent = result.entities.PoolFactory_SetCustomFee.get("10_1000000_1");
      expect(setCustomFeeEvent).to.not.be.undefined;
      expect(setCustomFeeEvent?.pool).to.equal("0x3333333333333333333333333333333333333333");
      expect(setCustomFeeEvent?.fee).to.equal(100n);
      expect(setCustomFeeEvent?.timestamp).to.deep.equal(new Date(1000000 * 1000));
    });
  });
});
