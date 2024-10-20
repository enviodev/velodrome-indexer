import { expect } from "chai";
import { Pool, MockDb } from "../../generated/src/TestHelpers.gen";
import { LiquidityPoolAggregator, Token } from "../../generated/src/Types.gen";
import { setupCommon } from "./common";
import { TEN_TO_THE_18_BI, TEN_TO_THE_6_BI, toChecksumAddress, TokenIdByChain } from "../../src/Constants";

describe("Pool Fees Event", () => {
  const { mockToken0Data, mockToken1Data } = setupCommon();

  let mockDb: any;
  beforeEach(() => {
    mockDb = MockDb.createMockDb();
  });

  it("should update LiquidityPool entity with new fees", async () => {
    const poolId = toChecksumAddress("0x3333333333333333333333333333333333333333");
    const mockLiquidityPool: LiquidityPoolAggregator = {
      id: poolId,
      chainId: 10,
      token0_id: TokenIdByChain("0x1111111111111111111111111111111111111111", 10),
      token1_id: TokenIdByChain("0x2222222222222222222222222222222222222222", 10),
      totalFees0: 0n,
      totalFees1: 0n,
      totalFeesUSD: 0n,
    } as LiquidityPoolAggregator;

    const updatedDB1 = mockDb.entities.Token.set(mockToken0Data as Token);
    const updatedDB2 = updatedDB1.entities.Token.set(mockToken1Data as Token);
    const updatedDB3 = updatedDB2.entities.LiquidityPoolAggregator.set(mockLiquidityPool);

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
        srcAddress: toChecksumAddress("0x3333333333333333333333333333333333333333"),
      },
    });

    const result = await Pool.Fees.processEvent({
      event: mockEvent,
      mockDb: updatedDB3,
    });

    const updatedPool = result.entities.LiquidityPoolAggregator.get(poolId);
    expect(updatedPool).to.not.be.undefined;
    expect(updatedPool?.totalFees0).to.equal(100n * TEN_TO_THE_18_BI);
    expect(updatedPool?.totalFees1).to.equal(200n * TEN_TO_THE_18_BI);
    expect(updatedPool?.totalFeesUSD).to.equal(300n * TEN_TO_THE_18_BI); // 100 + 200
    expect(updatedPool?.lastUpdatedTimestamp).to.deep.equal(new Date(1000000 * 1000));
  });
});
