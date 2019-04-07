var assert = require("assert");

describe("651 Parser Test", async function() {
	const MockHappn = require("../../mocks/mock_happn");
	let mockHappn = new MockHappn();

	this.timeout(30000);

	it("can create a result array with nodes containing ISC and IB651 data from a parsed packet", async function() {
		/*
         start  length  command ISC serial  ISC data    IB651 data  CRC
         AAAA   0C      03      0004        4040        210E        CAF6
         */

		var expected = [
			{
				itemType: "SectionControlModel",
				itemData: {
					serial: 4,
					parentSerial: null,
					typeId: 1,
					parentType: 0,
					created: null,
					modified: null,
					path: "",
					communicationStatus: 1,
					keySwitchStatus: 0,
					cableFault: 0,
					isolationRelay: 1,
					earthLeakage: 0,
					blastArmed: 0
				}
			},
			{
				itemType: "BoosterModel",
				itemData: {
					serial: null,
					parentSerial: 4,
					typeId: 2,
					parentType: 1,
					created: null,
					modified: null,
					path: "",
					communicationStatus: 1,
					keySwitchStatus: 0,
					detonatorStatus: 1,
					boosterFired: 0,
					partialBlast: 0,
					missingPulseDetected: 0,
					dcSupplyVoltage: 0,
					mains: 0
				}
			}
		];

		let test = async () => {
			try {
				const DataParser = require("../../../lib/parsers/deviceDataParser");
				const PacketTemplate = require("../../../lib/constants/packetTemplates");

				const packetTemplate = new PacketTemplate();

				const parser = new DataParser(packetTemplate.incomingCommTemplate[3]);

				const testObj = {
					packet: "AAAA0C0300044040210ECAF6",
					created: Date.now()
				};

				let parsedPacketArr = await parser.parse(mockHappn, testObj);

				let result = await parser.buildNodeData(mockHappn, parsedPacketArr);

				let res = result.map(item => {
					return {
						itemType: item.constructor.name,
						itemData: item.data
					};
				});

				await assert.deepEqual(res, expected);
			} catch (err) {
				console.log("error ", err);
				return Promise.reject(err);
			}
		};

		return test();
	});
});
