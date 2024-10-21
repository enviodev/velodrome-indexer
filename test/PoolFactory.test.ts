import { expect } from "chai";
import { MockDb, PoolFactory } from "../generated/src/TestHelpers.gen";
import { LiquidityPoolAggregator, Token } from "../generated/src/Types.gen";
import { TEN_TO_THE_18_BI } from "../src/Constants";
import { toChecksumAddress } from "../src/Constants";

describe("PoolFactory Events", () => {

  const token0Address = "0x1111111111111111111111111111111111111111";
  const token1Address = "0x2222222222222222222222222222222222222222";
  const poolAddress = "0x3333333333333333333333333333333333333333";
  const chainId = 10;

  describe("PoolCreated event", () => {

    let createdPool: any;
    beforeEach(async () => {
      const mockDb = MockDb.createMockDb();
      const mockEvent = PoolFactory.PoolCreated.createMockEvent({
        token0: token0Address,
        token1: token1Address,
        pool: poolAddress,
        stable: false,
        mockEventData: { 
          block: {
            timestamp: 1000000,
            hash: "0x1234567890123456789012345678901234567890123456789012345678901234"
          }, 
          chainId,
          logIndex: 1,
        }
      });
      const result = await PoolFactory.PoolCreated.processEvent({ event: mockEvent, mockDb });
      createdPool = result.entities.LiquidityPoolAggregator.get(toChecksumAddress(poolAddress));
    });
    it("should create a new LiquidityPool entity and Token entities", async () => {
      expect(createdPool).to.not.be.undefined;
      expect(createdPool?.isStable).to.be.false;
      expect(createdPool?.lastUpdatedTimestamp).to.deep.equal(new Date(1000000 * 1000));
    });

    it("should appropriately set token data on the aggregator", () => {
      expect(createdPool?.token0_id).to.equal(toChecksumAddress(token0Address) + "-" + chainId);
      expect(createdPool?.token1_id).to.equal(toChecksumAddress(token1Address) + "-" + chainId);
      expect(createdPool?.token0_address).to.equal(token0Address);
      expect(createdPool?.token1_address).to.equal(token1Address);
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
      expect(setCustomFeeEvent?.pool).to.equal(poolAddress);
      expect(setCustomFeeEvent?.fee).to.equal(100n);
      expect(setCustomFeeEvent?.timestamp).to.deep.equal(new Date(1000000 * 1000));
    });
  });
});
