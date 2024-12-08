import { expect } from "chai";
import sinon from "sinon";
import * as PriceOracle from "../src/PriceOracle";
import * as Erc20 from "../src/Erc20";
import { CHAIN_CONSTANTS } from "../src/Constants";
import { Cache } from "../src/cache";

import { setupCommon } from "./EventHandlers/Pool/common";

describe("PriceOracle", () => {
  let mockContext: any ;
  let mockContract: any;

  const chainId = 10; // Optimism
  const startBlock = CHAIN_CONSTANTS[chainId].oracle.startBlock;
  const blockNumber = startBlock + 1;
  const blockDatetime = new Date("2023-01-01T00:00:00Z");

  let addStub: sinon.SinonStub;
  let readStub: sinon.SinonStub;
  const { mockToken0Data } = setupCommon();

  beforeEach(() => {
    addStub = sinon.stub();
    readStub = sinon.stub().returns({
      prices: null
    });
    const stubCache = sinon.stub(Cache, "init").returns({
      add: addStub,
      read: readStub
    } as any);

    mockContext = {
        Token: { set: sinon.stub(), get: sinon.stub() },
        TokenPriceSnapshot: { set: sinon.stub(), get: sinon.stub() }
    };

  });

  afterEach(() => {
    sinon.restore();
  });

  describe("refreshTokenPrice", () => {
    let mockERC20Details: sinon.SinonStub;
    let testLastUpdated: Date;

    const mockTokenPriceData: any = {
      pricePerUSDNew: 2n * 10n ** 18n,
      decimals: mockToken0Data.decimals,
    };

    beforeEach(() => {
      mockContract = sinon.stub(CHAIN_CONSTANTS[chainId].eth_client, "simulateContract")
        .returns({
          result: [mockTokenPriceData.pricePerUSDNew.toString(), "2000000000000000000"]
        } as any);
      mockERC20Details = sinon.stub(Erc20, "getErc20TokenDetails")
        .returns({
          decimals: mockTokenPriceData.decimals
        } as any);
    });

    describe("if the update interval hasn't passed", () => {
      let updatedToken: any;
      beforeEach(async () => {
        testLastUpdated = new Date(blockDatetime.getTime() - 1000);
        const fetchedToken = {
          ...mockToken0Data,
          lastUpdatedTimestamp: testLastUpdated
        };
        await PriceOracle.refreshTokenPrice(fetchedToken, blockNumber, blockDatetime.getTime(), chainId, mockContext);
      });
      it("should not update prices if the update interval hasn't passed", async () => {
        expect(mockContract.called).to.be.false;
      });
    });
    describe("if the update interval has passed", () => {
      let updatedToken: any;
      let testLastUpdated: Date;
      beforeEach(async () => {
        testLastUpdated = new Date(blockDatetime.getTime() - (61 * 60 * 1000));
        const fetchedToken = {
          ...mockToken0Data,
          lastUpdatedTimestamp: testLastUpdated
        };
        await PriceOracle.refreshTokenPrice(fetchedToken, blockNumber, blockDatetime.getTime(), chainId, mockContext);
        updatedToken = mockContext.Token.set.lastCall.args[0];
      });
      it("should update prices if the update interval has passed", async () => {
        expect(updatedToken.pricePerUSDNew).to.equal(mockTokenPriceData.pricePerUSDNew);
        expect(updatedToken.lastUpdatedTimestamp).greaterThan(testLastUpdated);
      });
    });
  });

  describe("set_whitelisted_prices", () => {

    beforeEach(() => {
      mockContract = sinon.stub(CHAIN_CONSTANTS[chainId].eth_client, "simulateContract")
          .returns({ result: ["1000000000000000000", "2000000000000000000"] } as any);
    });

    it("should update existing tokens and create TokenPrice entities", async () => {

      mockContext.Token.get.returns(mockToken0Data);

      await PriceOracle.set_whitelisted_prices(chainId, blockNumber, blockDatetime, mockContext);

      // Check if token was updated
      const updatedToken = mockContext.Token.set.args[0][0];
      expect(updatedToken).to.not.be.undefined;
      expect(updatedToken?.pricePerUSDNew).to.equal(mockToken0Data.pricePerUSDNew);
      expect(updatedToken?.lastUpdatedTimestamp).to.deep.equal(blockDatetime);

      // Check if TokenPrice was created
      const tokenPrice = mockContext.TokenPriceSnapshot.set.args[0][0];
      expect(tokenPrice).to.not.be.undefined;
      expect(tokenPrice?.pricePerUSDNew).to.equal(mockToken0Data.pricePerUSDNew);
      expect(tokenPrice?.lastUpdatedTimestamp).to.deep.equal(blockDatetime);
    });

    it("should create new tokens when they don't exist", async () => {

      const timeDelta = CHAIN_CONSTANTS[chainId].oracle.updateDelta * 1000;
      const updatedBlockDatetime = new Date(blockDatetime.getTime() + 2 * timeDelta);

      mockContext.Token.get.returns(null);
      await PriceOracle.set_whitelisted_prices(chainId, blockNumber, updatedBlockDatetime, mockContext);

      // Check if new token was created
      const newToken = mockContext.Token.set.args[0][0];
      expect(newToken).to.not.be.undefined;
      expect(newToken?.pricePerUSDNew).to.equal(mockToken0Data.pricePerUSDNew);
      expect(newToken?.lastUpdatedTimestamp).to.deep.equal(updatedBlockDatetime);

      // Check if TokenPrice was created
      const tokenPrice = mockContext.TokenPriceSnapshot.set.args[0][0];
      expect(tokenPrice).to.not.be.undefined;
      expect(tokenPrice?.pricePerUSDNew).to.equal(mockToken0Data.pricePerUSDNew);
      expect(tokenPrice?.lastUpdatedTimestamp).to.deep.equal(updatedBlockDatetime);
    });

    it("should not update prices if the update interval hasn't passed", async () => {
      // Set last updated time to be recent
      PriceOracle.setPricesLastUpdated(chainId, new Date(blockDatetime.getTime() - 1000)); // 1 second ago

      await PriceOracle.set_whitelisted_prices(chainId, blockNumber, blockDatetime, mockContext);

      // Check that no tokens were updated
      const setStub = mockContext.Token.set;
      expect(setStub.called).to.be.false;
    });

    it("should handle errors when fetching prices", async () => {
      // Make the contract call throw an error
      mockContract.rejects(new Error("API Error"));

      const timeDelta = CHAIN_CONSTANTS[chainId].oracle.updateDelta * 1000;
      const updatedBlockDatetime = new Date(blockDatetime.getTime() + 5 * timeDelta);

      await PriceOracle.set_whitelisted_prices(chainId, blockNumber, updatedBlockDatetime, mockContext);

      // Check that tokens were created with price 0
      const token = mockContext.Token.set.args[0][0];
      expect(token).to.not.be.undefined;
      expect(token?.pricePerUSDNew).to.equal(BigInt(0));
    });
  });
});
