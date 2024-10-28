import { expect } from "chai";
import { MockDb, Voter } from "../../generated/src/TestHelpers.gen";
import { TokenIdByChain } from "../../src/Constants";
import { Token } from "../../generated/src/Types.gen";

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
});
