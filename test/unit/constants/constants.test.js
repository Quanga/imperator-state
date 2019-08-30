const chai = require("chai");
const expect = chai.expect;
chai.use(require("chai-match"));
const PacketConstants = require("../../../lib/constants/packetTemplates");

describe("UNIT - Constants", async function() {
	const packetConstants = new PacketConstants();

	context("Packet Constants", async () => {
		it("can get all incoming packet constants", async function() {
			let allIncoming = await packetConstants.incomingCommTemplate;
			let incomingKeys = await Array.from(Object.keys(allIncoming));
			expect(incomingKeys.length).to.be.equal(9);
		});

		it("can get all the unitBitTemplates", async function() {
			let bitTemplates = packetConstants.unitBitTemplate;
			let bitTemps = await Array.from(Object.keys(bitTemplates));
			expect(bitTemps.length).to.be.equal(6);
		});

		it("can get all the logTypes", async function() {
			let logTypes = packetConstants.loggableTypes;
			let logList = await Array.from(Object.keys(logTypes));
			expect(logList.length).to.be.equal(5);
		});
	});
});
