// eslint-disable-next-line no-unused-vars
var assert = require("assert");
const PacketService = require("../../../lib/services/packet_service");
const packetService = new PacketService();

const MockHappn = require("../../mocks/mock_happn");
this.__mockHappn = new MockHappn();

describe("Standalone Parser Tests", () => {
	it("should handle a 01 command", async () => {
		let packet = "aaaa0d040043ffffffffff8a44";

		let messageObj = {
			created: Date.now(),
			message: packet
		};

		try {
			let packetResult = await packetService.extractData(
				this.__mockHappn,
				messageObj
			);
			let nodeResult = await packetService.buildNodeData(
				this.__mockHappn,
				packetResult
			);
			console.log(nodeResult);
		} catch (err) {
			return Promise.reject(err);
		}
	});
});
