import { expect } from "chai";
import { MockDb, SuperchainLeafVoter } from "../../generated/src/TestHelpers.gen";
import { TokenIdByChain, CHAIN_CONSTANTS } from "../../src/Constants";
import { Token, LiquidityPoolAggregator } from "../../generated/src/Types.gen";
import * as Store from "../../src/Store";
import * as Common from "../../src/EventHandlers/Voter/common";
import sinon from "sinon";

describe("SuperchainLeafVoter Events", () => {
  describe("Voted Event", () => {
    let mockDb: ReturnType<typeof MockDb.createMockDb>;
    
    beforeEach( async () => {
      mockDb = MockDb.createMockDb();
      const mockEvent = SuperchainLeafVoter.Voted.createMockEvent({
        sender: "0x1111111111111111111111111111111111111111",
        pool: "0x2222222222222222222222222222222222222222",
        tokenId: 1n,
        weight: 100n,
        totalWeight: 1000n,
        mockEventData: {
          block: {
            timestamp: 1000000,
            number: 123456,
            hash: "0xhash",
          },
          chainId: 10,
          logIndex: 1,
        },
      });
      mockDb = await SuperchainLeafVoter.Voted.processEvent({ event: mockEvent, mockDb });
    });

    it("should create a Voter_Voted entity", async () => {
      const votedEntity = mockDb.entities.Voter_Voted.get("10_123456_1");
      expect(votedEntity).to.not.be.undefined;
      expect(votedEntity?.sender).to.equal("0x1111111111111111111111111111111111111111");
      expect(votedEntity?.pool).to.equal("0x2222222222222222222222222222222222222222");
      expect(votedEntity?.weight).to.equal(100n);
      expect(votedEntity?.totalWeight).to.equal(1000n);
    });
  });

  describe("GaugeCreated Event", () => {
    let mockDb: ReturnType<typeof MockDb.createMockDb>;
    const poolLookupStub = sinon.stub(Store.poolLookupStoreManager(), "addRewardAddressDetails");
    
    beforeEach(async () => {
      mockDb = MockDb.createMockDb();
      const mockEvent = SuperchainLeafVoter.GaugeCreated.createMockEvent({
        poolFactory: "0x1111111111111111111111111111111111111111",
        votingRewardsFactory: "0x2222222222222222222222222222222222222222",
        gaugeFactory: "0x3333333333333333333333333333333333333333",
        pool: "0x4444444444444444444444444444444444444444",
        incentiveVotingReward: "0x5555555555555555555555555555555555555555",
        feeVotingReward: "0x6666666666666666666666666666666666666666",
        gauge: "0x7777777777777777777777777777777777777777",
        mockEventData: {
          block: {
            timestamp: 1000000,
            number: 123456,
            hash: "0xhash",
          },
          chainId: 10,
          logIndex: 1,
        },
      });
      
      mockDb = await SuperchainLeafVoter.GaugeCreated.processEvent({ event: mockEvent, mockDb });

    });

    xit("should create a Voter_GaugeCreated entity and update pool mappings", async () => {
      
      const gaugeCreatedEntity = mockDb.entities.Voter_GaugeCreated.get("10_123456_1");
      expect(gaugeCreatedEntity).to.not.be.undefined;
      expect(gaugeCreatedEntity?.pool).to.equal("0x4444444444444444444444444444444444444444");
      expect(gaugeCreatedEntity?.gauge).to.equal("0x7777777777777777777777777777777777777777");
      
      expect(poolLookupStub.calledOnce).to.be.true;
      sinon.restore();
    });
  });

  describe("DistributeReward Event", () => {
    let mockDb: ReturnType<typeof MockDb.createMockDb>;
    let mockEvent: ReturnType<typeof SuperchainLeafVoter.DistributeReward.createMockEvent>;
    const chainId = 10; // Optimism
    const voterAddress = "0x41C914ee0c7E1A5edCD0295623e6dC557B5aBf3C";
    const poolAddress = "0x478946BcD4a5a22b316470F5486fAfb928C0bA25";
    const gaugeAddress = "0xa75127121d28a9bf848f3b70e7eea26570aa7700";
    const blockNumber = 128357873;
    
    beforeEach(async () => {
      mockDb = MockDb.createMockDb();
      
      mockEvent = SuperchainLeafVoter.DistributeReward.createMockEvent({
        gauge: gaugeAddress,
        amount: 1000n * 10n ** 18n,
        mockEventData: {
          block: {
            number: blockNumber,
            timestamp: 1000000,
            hash: "0xhash",
          },
          chainId,
          logIndex: 1,
          srcAddress: voterAddress,
        },
      });

      // Stub common functions
      sinon.stub(Common, "getIsAlive").resolves(true);
      sinon.stub(Common, "getTokensDeposited").resolves(500n * 10n ** 18n);
      sinon.stub(Store.poolLookupStoreManager(), "getPoolAddressByGaugeAddress")
        .returns(poolAddress);
    });

    afterEach(() => {
      sinon.restore();
    });

    describe("when reward token and liquidity pool exist", () => {
      
      beforeEach(async () => {
        const rewardTokenInfo = CHAIN_CONSTANTS[chainId].rewardToken(blockNumber);
        
        // Setup mock reward token
        const rewardToken: Token = {
          id: TokenIdByChain(rewardTokenInfo.address, chainId),
          address: rewardTokenInfo.address,
          symbol: "VELO",
          name: "VELO",
          chainId: chainId,
          decimals: 18n,
          pricePerUSDNew: 2n * 10n ** 18n,
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
          totalVotesDeposited: 0n,
          totalVotesDepositedUSD: 0n,
          totalEmissions: 1000n * 10n ** 18n,
          totalEmissionsUSD: 2000n * 10n ** 18n,
          totalBribesUSD: 0n,
        } as LiquidityPoolAggregator;

        mockDb = mockDb.entities.Token.set(rewardToken);
        mockDb = mockDb.entities.LiquidityPoolAggregator.set(liquidityPool);

        mockDb = await SuperchainLeafVoter.DistributeReward.processEvent({
          event: mockEvent,
          mockDb,
        });
      });

      it("should create a DistributeReward entity", () => {
        const distributeRewardEntity = mockDb.entities.Voter_DistributeReward.get(`${chainId}_${blockNumber}_1`);
        expect(distributeRewardEntity).to.not.be.undefined;
        expect(distributeRewardEntity?.amount).to.equal(1000n * 10n ** 18n);
        expect(distributeRewardEntity?.tokensDeposited).to.equal(500n * 10n ** 18n);
      });

      it("should update the liquidity pool aggregator with emissions and votes data", () => {
        const updatedPool = mockDb.entities.LiquidityPoolAggregator.get(poolAddress);
        expect(updatedPool).to.not.be.undefined;
        expect(updatedPool?.totalEmissions).to.equal(2000n * 10n ** 18n);
        expect(updatedPool?.totalEmissionsUSD).to.equal(4000n * 10n ** 18n);
        expect(updatedPool?.totalVotesDeposited).to.equal(500n * 10n ** 18n);
        expect(updatedPool?.gaugeIsAlive).to.be.true;
      });
    });
  });

}); 