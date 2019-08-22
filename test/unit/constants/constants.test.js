var assert = require("assert");
const PacketConstants = require("../../../lib/constants/packetTemplates");

describe("UNIT - Constants", async function() {
	const packetConstants = new PacketConstants();

	context("Packet Constants", async () => {
		it("can get all incoming packet constants", async function() {
			let allIncoming = await packetConstants.incomingCommTemplate;
			let incomingKeys = await Array.from(Object.keys(allIncoming));
			assert.equal(incomingKeys.length, 9);
		});

		it("can get all the unitBitTemplates", async function() {
			let bitTemplates = packetConstants.unitBitTemplate;
			let bitTemps = await Array.from(Object.keys(bitTemplates));
			assert.equal(bitTemps.length, 5);
		});

		it("can get all the logTypes", async function() {
			let logTypes = packetConstants.loggableTypes;
			let logList = await Array.from(Object.keys(logTypes));
			assert.equal(logList.length, 5);
		});
	});
});
