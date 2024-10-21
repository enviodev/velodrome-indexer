import { expect } from "chai";
import sinon from "sinon";
import { Token } from "../generated/src/Types.gen";
import * as PriceOracle from "../src/PriceOracle";
import { OPTIMISM_WHITELISTED_TOKENS, CHAIN_CONSTANTS, TokenIdByChain, TokenIdByBlock } from "../src/Constants";
import { Cache } from "../src/cache";

describe("PriceOracle", () => {
  let mockContext: any ;
  let mockContract: any;

  const chainId = 10; // Optimism
  const startBlock = CHAIN_CONSTANTS[chainId].oracle.startBlock;
  const blockNumber = startBlock + 1;
  const blockDatetime = new Date("2023-01-01T00:00:00Z");

  let addStub: sinon.SinonStub;
  let readStub: sinon.SinonStub;

  beforeEach(() => {
    addStub = sinon.stub();
    readStub = sinon.stub().returns({
      prices: null
    });
    const stubCache = sinon.stub(Cache, "init").returns({
      add: addStub,
      read: readStub
    } as any);

    mockContract = {
        methods: {
            getManyRatesWithConnectors: sinon.stub().returns({
                call: sinon.stub().resolves(["1000000000000000000", "2000000000000000000"]) // 1 USD and 2 USD
            })
        }
    };

    mockContext = {
        Token: { set: sinon.stub(), get: sinon.stub() },
        TokenPriceSnapshot: { set: sinon.stub(), get: sinon.stub() }
    };

    const dep = require("../src/Constants");
    sinon.stub(dep, "getPriceOracleContract")
        .returns(mockContract);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe("set_whitelisted_prices", () => {

    it("should update existing tokens and create TokenPrice entities", async () => {
      // Setup existing token
      const existingToken: Token = {
        id: TokenIdByChain(OPTIMISM_WHITELISTED_TOKENS[0].address, chainId),
        address: OPTIMISM_WHITELISTED_TOKENS[0].address,
        symbol: OPTIMISM_WHITELISTED_TOKENS[0].symbol,
        name: OPTIMISM_WHITELISTED_TOKENS[0].symbol,
        chainId: chainId,
        decimals: BigInt(OPTIMISM_WHITELISTED_TOKENS[0].decimals),
        pricePerUSDNew: BigInt(0),
        lastUpdatedTimestamp: new Date("2022-01-01T00:00:00Z")
      };

      mockContext.Token.get.returns(existingToken);

      await PriceOracle.set_whitelisted_prices(chainId, blockNumber, blockDatetime, mockContext);

      // Check if token was updated
      const updatedToken = mockContext.Token.set.args[0][0];
      expect(updatedToken).to.not.be.undefined;
      expect(updatedToken?.pricePerUSDNew).to.equal(BigInt("1000000000000000000"));
      expect(updatedToken?.lastUpdatedTimestamp).to.deep.equal(blockDatetime);

      // Check if TokenPrice was created
      const tokenPrice = mockContext.TokenPriceSnapshot.set.args[0][0];
      expect(tokenPrice).to.not.be.undefined;
      expect(tokenPrice?.pricePerUSDNew).to.equal(BigInt("1000000000000000000"));
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
      expect(newToken?.pricePerUSDNew).to.equal(BigInt("1000000000000000000"));
      expect(newToken?.lastUpdatedTimestamp).to.deep.equal(updatedBlockDatetime);

      // Check if TokenPrice was created
      const tokenPrice = mockContext.TokenPriceSnapshot.set.args[0][0];
      expect(tokenPrice).to.not.be.undefined;
      expect(tokenPrice?.pricePerUSDNew).to.equal(BigInt("1000000000000000000"));
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
      mockContract.methods.getManyRatesWithConnectors.returns({
        call: sinon.stub().rejects(new Error("API Error"))
      });

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
