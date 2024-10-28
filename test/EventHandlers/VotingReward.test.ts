import { expect } from "chai";
import { MockDb, VotingReward } from "../../generated/src/TestHelpers.gen";
import { TokenIdByChain } from "../../src/Constants";
import { Token, LiquidityPoolAggregator } from "../../generated/src/Types.gen";
import * as Store from "../../src/Store";
import sinon from "sinon";

describe("VotingReward Events", () => {
  describe("NotifyReward Event", () => {
    let mockDb: ReturnType<typeof MockDb.createMockDb>;
    let mockEvent: ReturnType<typeof VotingReward.NotifyReward.createMockEvent>;

    /**
     * Constants for the NotifyReward event test.
     * 
     * @constant {number} chainId - The chain ID for Optimism.
     * @constant {string} poolAddress - The address of the liquidity pool.
     * @constant {string} bribeVotingRewardAddress - The address of the bribe voting reward contract.
     * @constant {string} rewardTokenAddress - The address of the reward token being distributed.
     */
    const chainId = 10; // Optimism
    
    const poolAddress = "0x904f14F9ED81d0b0a40D8169B28592aac5687158";
    const bribeVotingRewardAddress = "0x9afdc6c6caad5ff953e2cff9777c3af2e5d796fb";
    const rewardTokenAddress = "0x3c8B650257cFb5f272f799F5e2b4e65093a11a05";

    beforeEach(() => {
      mockDb = MockDb.createMockDb();
      
      // Setup the mock event
      mockEvent = VotingReward.NotifyReward.createMockEvent({
        from: "0x1234567890123456789012345678901234567890",
        reward: rewardTokenAddress,
        epoch: 1n,
        amount: 1000n * 10n ** 18n, // 1000 tokens with 18 decimals
        mockEventData: {
          block: {
            number: 123456,
            timestamp: 1000000,
            hash: "0xblockhash",
          },
          chainId: chainId,
          logIndex: 0,
          srcAddress: bribeVotingRewardAddress,
        },
      });

      // Stub the pool lookup function
      sinon.stub(Store.poolLookupStoreManager(), "getPoolAddressByBribeVotingRewardAddress")
        .returns(poolAddress);
    });

    afterEach(() => {
      sinon.restore();
    });

    describe("when reward token and liquidity pool exist", () => {
      let resultDB: ReturnType<typeof MockDb.createMockDb>;
      
      beforeEach(async () => {
        // Setup mock reward token
        const rewardToken: Token = {
          id: TokenIdByChain(rewardTokenAddress, chainId),
          address: rewardTokenAddress,
          symbol: "TEST",
          name: "Test Token",
          chainId: chainId,
          decimals: 18n,
          pricePerUSDNew: 2n * 10n ** 18n, // $2 per token
          isWhitelisted: true,
        } as Token;

        // Setup mock liquidity pool
        const liquidityPool: LiquidityPoolAggregator = {
          id: poolAddress,
          chainId: chainId,
          name: "Test Pool",
          token0_id: "token0-10",
          token1_id: "token1-10",
          token0_address: "0xtoken0",
          token1_address: "0xtoken1",
          isStable: false,
          reserve0: 0n,
          reserve1: 0n,
          totalLiquidityUSD: 0n,
          totalVolume0: 0n,
          totalVolume1: 0n,
          totalVolumeUSD: 0n,
          totalFees0: 0n,
          totalFees1: 0n,
          totalFeesUSD: 0n,
          numberOfSwaps: 0n,
          token0Price: 0n,
          token1Price: 0n,
          totalEmissions: 0n,
          totalEmissionsUSD: 0n,
          totalBribesUSD: 1000n * 10n ** 18n, // Starting with $1000 in bribes
        } as LiquidityPoolAggregator;

        // Set entities in the mock database
        const updatedDB1 = mockDb.entities.Token.set(rewardToken);
        const updatedDB2 = updatedDB1.entities.LiquidityPoolAggregator.set(liquidityPool);

        // Process the event
        resultDB = await VotingReward.NotifyReward.processEvent({
          event: mockEvent,
          mockDb: updatedDB2,
        });
      });

      it("should create a VotingReward_NotifyReward entity", () => {
        const notifyRewardEvent = resultDB.entities.VotingReward_NotifyReward.get(
          `${mockEvent.chainId}_${mockEvent.block.number}_${mockEvent.logIndex}`
        );
        expect(notifyRewardEvent).to.not.be.undefined;
        expect(notifyRewardEvent?.from).to.equal("0x1234567890123456789012345678901234567890");
        expect(notifyRewardEvent?.reward).to.equal(rewardTokenAddress);
        expect(notifyRewardEvent?.amount).to.equal(1000n * 10n ** 18n);
        expect(notifyRewardEvent?.epoch).to.equal(1n);
      });

      it("should update the liquidity pool aggregator with bribes data", () => {
        const updatedPool = resultDB.entities.LiquidityPoolAggregator.get(poolAddress);
        expect(updatedPool).to.not.be.undefined;
        expect(updatedPool?.totalBribesUSD).to.equal(3000n * 10n ** 18n, 
          "Should add $2000 (1000 tokens * $2) to existing $1000");
        expect(updatedPool?.lastUpdatedTimestamp).to.deep.equal(new Date(1000000 * 1000));
      });
    });
  });
}); 