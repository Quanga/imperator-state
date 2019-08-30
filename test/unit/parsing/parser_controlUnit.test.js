const chai = require("chai");
const expect = chai.expect;
chai.use(require("chai-match"));
const PacketValidation = require("../../../lib/parsers/packetValidataion");

describe("UNIT - Parser", async function() {
	this.timeout(2000);

	context("CONTROL UNIT", async () => {
		let now = Date.now();

		const expected = [
			{
				itemType: "ControlUnitModel",
				itemData: {
					serial: 1,
					typeId: 0,
					parentType: null,
					createdAt: now,
					modifiedAt: null,
					path: "",
					communicationStatus: 1,
					keySwitchStatus: 1,
					fireButton: 0,
					cableFault: 0,
					isolationRelay: 1,
					earthLeakage: 0,
					blastArmed: 0
				}
			}
		];
		const validator = new PacketValidation();

		const DataListParser = require("../../../lib/parsers/deviceDataParser");
		const PacketTemplate = require("../../../lib/constants/packetTemplates");

		const packetTemplate = new PacketTemplate();

		const parser = new DataListParser(packetTemplate.incomingCommTemplate[8]);
		it("can create a node result array with one set of node data from a parsed packet", async function() {
			const testObj = {
				packet: "AAAA0A08000100C0CA96",
				createdAt: now
			};

			const valid = await validator.validatePacket(
				testObj,
				packetTemplate.incomingCommTemplate[8].chunk
			);

			// AAAA 0A 08 0001 00C0 CA96
			//                 ^^^^
			// after packet validation
			/*{ createdAt: 1567083781362,
				packetSerial: 1,
				command: 08,
				dataPackets: [ '00C0' ] }*/

			const parsedPacketArr = await parser.parse(valid);
			const result = await parser.buildNodeData(parsedPacketArr);

			const res = result.map(item => {
				return {
					itemType: item.constructor.name,
					itemData: item.data
				};
			});

			await expect(res).to.deep.equal(expected);
		});
	});
});
