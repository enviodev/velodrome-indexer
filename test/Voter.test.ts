import { expect } from "chai";
import { MockDb, Voter } from "../generated/src/TestHelpers.gen";

describe("Voter Events", () => {
  describe("WhitelistToken event", () => {
    it("should create a new WhitelistToken entity", async () => {
      const mockDb = MockDb.createMockDb();
      const mockEvent = Voter.WhitelistToken.createMockEvent({
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

      const expectedId = `${mockEvent.chainId}_${mockEvent.block.number}_${mockEvent.logIndex}`;

      const result = await Voter.WhitelistToken.processEvent({ event: mockEvent, mockDb });

      const whitelistTokenEvent = result.entities.Voter_WhitelistToken.get(expectedId);
      expect(whitelistTokenEvent).to.not.be.undefined;
      expect(whitelistTokenEvent?.whitelister).to.equal("0x1111111111111111111111111111111111111111");
      expect(whitelistTokenEvent?.token).to.equal("0x2222222222222222222222222222222222222222");
      expect(whitelistTokenEvent?.isWhitelisted).to.be.true;
      expect(whitelistTokenEvent?.timestamp).to.deep.equal(new Date(1000000 * 1000));
      expect(whitelistTokenEvent?.chainId).to.equal(10);
    });
  });
});
