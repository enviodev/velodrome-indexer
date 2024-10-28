import { expect } from "chai";
import { MockDb, Voter } from "../../generated/src/TestHelpers.gen";
import { TokenIdByChain, CHAIN_CONSTANTS } from "../../src/Constants";
import { Token, LiquidityPoolAggregator } from "../../generated/src/Types.gen";
import * as Store from "../../src/Store";
import sinon from "sinon";

describe("Voter Events", () => {
  describe("WhitelistToken event", () => {
    let resultDB: ReturnType<typeof MockDb.createMockDb>;
    let expectedId: string;
    let mockDb: ReturnType<typeof MockDb.createMockDb>;
    let mockEvent: any;
    beforeEach(async () => {
      mockDb = MockDb.createMockDb();
      mockEvent = Voter.WhitelistToken.createMockEvent({
        whitelister: "0x1111111111111111111111111111111111111111",
        token: "0x2222222222222222222222222222222222222222",
        _bool: true,
        mockEventData: {
          block: {
            number: 123456,
            timestamp: 1000000,
            hash: "0x1234567890123456789012345678901234567890123456789012345678901234",
          },
          chainId: 10,
          logIndex: 1,
        },
      });
    });
    describe("if token is in the db", () => {

      const expectedPricePerUSDNew = BigInt(10000000);
      beforeEach(async () => {
        // Note token doesn't have lastUpdatedTimestamp due to bug in codegen.
        // Will cast during the set call.
        const token = {
          id: TokenIdByChain("0x2222222222222222222222222222222222222222", 10),
          address: "0x2222222222222222222222222222222222222222",
          symbol: "TEST",
          name: "TEST",
          chainId: 10,
          decimals: BigInt(18),
          pricePerUSDNew: expectedPricePerUSDNew,
          isWhitelisted: false,
        };

        const updatedDB1 = mockDb.entities.Token.set(token as Token);

        resultDB = await Voter.WhitelistToken.processEvent({ event: mockEvent, mockDb: updatedDB1 });

        expectedId = `${mockEvent.chainId}_${mockEvent.block.number}_${mockEvent.logIndex}`;
      });
      it("should create a new WhitelistToken entity", async () => {
        const whitelistTokenEvent = resultDB.entities.Voter_WhitelistToken.get(expectedId);
        expect(whitelistTokenEvent).to.not.be.undefined;
        expect(whitelistTokenEvent?.whitelister).to.equal("0x1111111111111111111111111111111111111111");
        expect(whitelistTokenEvent?.token).to.equal("0x2222222222222222222222222222222222222222");
        expect(whitelistTokenEvent?.isWhitelisted).to.be.true;
        expect(whitelistTokenEvent?.timestamp).to.deep.equal(new Date(1000000 * 1000));
        expect(whitelistTokenEvent?.chainId).to.equal(10);
      });

      it("should update the token entity", async () => {
        const token = resultDB.entities.Token.get(TokenIdByChain("0x2222222222222222222222222222222222222222", 10));
        expect(token?.isWhitelisted).to.be.true;
        expect(token?.pricePerUSDNew).to.equal(expectedPricePerUSDNew);
      });

    });
    describe("if token is not in the db", () => {

      let resultDB: ReturnType<typeof MockDb.createMockDb>;
      let expectedId: string;
      beforeEach(async () => {

        resultDB = await Voter.WhitelistToken.processEvent({ event: mockEvent, mockDb: mockDb });

        expectedId = `${mockEvent.chainId}_${mockEvent.block.number}_${mockEvent.logIndex}`;
      });
      it("should create a new WhitelistToken entity", async () => {
        const whitelistTokenEvent = resultDB.entities.Voter_WhitelistToken.get(expectedId);
        expect(whitelistTokenEvent).to.not.be.undefined;
        expect(whitelistTokenEvent?.whitelister).to.equal("0x1111111111111111111111111111111111111111");
        expect(whitelistTokenEvent?.token).to.equal("0x2222222222222222222222222222222222222222");
        expect(whitelistTokenEvent?.isWhitelisted).to.be.true;
        expect(whitelistTokenEvent?.timestamp).to.deep.equal(new Date(1000000 * 1000));
        expect(whitelistTokenEvent?.chainId).to.equal(10);
      });

      it("should create a new Token entity", async () => {
        const token = resultDB.entities.Token.get(TokenIdByChain("0x2222222222222222222222222222222222222222", 10));
        expect(token?.isWhitelisted).to.be.true;
        expect(token?.pricePerUSDNew).to.equal(0n);
      });

    });
  });

  describe("DistributeReward Event", () => {
    let mockDb: ReturnType<typeof MockDb.createMockDb>;
    let mockEvent: ReturnType<typeof Voter.DistributeReward.createMockEvent>;

    /**
     * Constants for the Distribute Reward event test. Note that we can use real
     * poolAddress and gaugeAddresses to make the call work.
     * 
     * @constant {number} chainId - The chain ID for Optimism.
     * @constant {string} poolAddress - The address of the liquidity pool.
     * @constant {string} gaugeAddress - The address of the gauge.
     * 
     * @see {@link ../../.cache/guagetopool-10.json} for a mapping between gauge and pool that exists.
     */
    const chainId = 10; // Optimism
    const poolAddress = "0x904f14F9ED81d0b0a40D8169B28592aac5687158";
    const gaugeAddress = "0x91f2e5c009d3742188fa77619582402681d73f98";

    const rewardTokenAddress = CHAIN_CONSTANTS[chainId].rewardToken.address;

    beforeEach(() => {
      mockDb = MockDb.createMockDb();
      
      // Setup the mock event
      mockEvent = Voter.DistributeReward.createMockEvent({
        gauge: gaugeAddress,
        amount: 1000n * 10n ** 18n, // 1000 tokens with 18 decimals
        mockEventData: {
          block: {
            number: 123456,
            timestamp: 1000000,
            hash: "0xblockhash",
          },
          chainId: chainId,
          logIndex: 0,
        },
      });

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
          symbol: "VELO",
          name: "VELO",
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
          totalEmissions: 1000n * 10n ** 18n,
          totalEmissionsUSD: 2000n * 10n ** 18n,
          totalBribesUSD: 0n,
        } as LiquidityPoolAggregator;

        // Set entities in the mock database
        const updatedDB1 = mockDb.entities.Token.set(rewardToken);
        const updatedDB2 = updatedDB1.entities.LiquidityPoolAggregator.set(liquidityPool);

        // Process the event
        resultDB = await Voter.DistributeReward.processEvent({
          event: mockEvent,
          mockDb: updatedDB2,
        });
      });

      it("should update the liquidity pool aggregator with emissions data", () => {
        const updatedPool = resultDB.entities.LiquidityPoolAggregator.get(poolAddress);
        expect(updatedPool).to.not.be.undefined;
        expect(updatedPool?.totalEmissions).to.equal(2000n * 10n ** 18n, "Should add 1000 tokens to existing 1000");
        expect(updatedPool?.totalEmissionsUSD).to.equal(4000n * 10n ** 18n, "Should add $2000 (1000 tokens * $2) to existing $2000");
        expect(updatedPool?.lastUpdatedTimestamp).to.deep.equal(new Date(1000000 * 1000));
      });
    });
  });
});
