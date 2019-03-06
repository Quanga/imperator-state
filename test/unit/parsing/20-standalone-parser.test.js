// eslint-disable-next-line no-unused-vars
var assert = require("assert");
const PacketService = require("../../../lib/services/packet_service");
const packetService = new PacketService();

const MockHappn = require("../../mocks/mock_happn");
const mockHappn = new MockHappn();

describe("Standalone Parser Tests", () => {
	it("should handle a 01 command", async () => {

		let messageObj = {
			created: Date.now(),
			message: "aaaa0d040043ffffffffff8a44"
		};

		try {
			let packetResult = await packetService.extractData(mockHappn, messageObj);
			let nodeResult = await packetService.buildNodeData(mockHappn, packetResult);
			console.log(nodeResult);
		} catch (err) {
			return Promise.reject(err);
		}
	});
});
