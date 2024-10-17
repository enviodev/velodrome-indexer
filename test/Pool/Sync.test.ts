import { expect } from "chai";
import { Pool, MockDb } from "../../generated/src/TestHelpers.gen";
import { LiquidityPoolNew, Token } from "../../generated/src/Types.gen";
import { setupCommon } from "./common";
import { TEN_TO_THE_18_BI, TEN_TO_THE_6_BI, toChecksumAddress, TokenIdByChain } from "../../src/Constants";

describe("Pool Sync Event", () => {
  const { mockToken0Data, mockToken1Data, mockLiquidityPoolData } = setupCommon();

  let mockDb: any;

  beforeEach(() => {
    mockDb = MockDb.createMockDb();
  });

  const eventData = {
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
  };

  describe("when both tokens are missing", () => {
    it("should not update LiquidityPool reserves", async () => {
      const modifiedMockLiquidityPoolData = {
        ...mockLiquidityPoolData,
        token0_id: TokenIdByChain("0x9999999999999999999999999999999999999990", 10),
        token1_id: TokenIdByChain("0x9999999999999999999999999999999999999999", 10),
      };

      const updatedDB1 = mockDb.entities.LiquidityPoolNew.set(modifiedMockLiquidityPoolData as LiquidityPoolNew);
      const mockEvent = Pool.Sync.createMockEvent(eventData);

      const postEventDB = await Pool.Sync.processEvent({
        event: mockEvent,
        mockDb: updatedDB1,
      });

      const updatedPool = postEventDB.entities.LiquidityPoolNew.get(
        toChecksumAddress(eventData.mockEventData.srcAddress)
      );
      expect(updatedPool).to.not.be.undefined;
      expect(updatedPool?.reserve0).to.equal(10000n * TEN_TO_THE_18_BI);
      expect(updatedPool?.reserve1).to.equal(20000n * TEN_TO_THE_6_BI);
    });
  });

  // Add more tests for other scenarios (token0 missing, token1 missing, both tokens present)
});
