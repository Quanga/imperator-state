var assert = require("assert");

describe("UNIT - Parser", async function() {
	var DataListParser = require("../../../lib/parsers/deviceListParser");
	const PacketTemplate = require("../../../lib/constants/packetTemplates");

	this.timeout(2000);
	xcontext("ISC", async () => {
		it("can create a result array with ISC list from a parsed packet", async function() {
			/*
			 ISC serial list for IBC id 8
	
			 start  length  command serial  isc1    isc2    isc3    isc4    isc5    isc6    isc7    crc
			 AAAA   16      01      0008    0025    0026    002E    0032    002A    0012    002C    7BCA
			 */
			let now = Date.now();

			var expected = [
				{
					itemType: "ControlUnitModel",
					itemData: {
						serial: 8,
						parentSerial: null,
						typeId: 0,
						parentType: null,
						created: now,
						modified: null,
						path: "",
						communicationStatus: 1,
						keySwitchStatus: null,
						fireButton: null,
						cableFault: null,
						isolationRelay: null,
						earthLeakage: null,
						blastArmed: null
					}
				},
				{
					itemType: "SectionControlModel",
					itemData: {
						serial: 37,
						parentSerial: 8,
						typeId: 1,
						parentType: 0,
						created: now,
						modified: null,
						path: "",
						communicationStatus: 1,
						keySwitchStatus: null,
						cableFault: null,
						isolationRelay: null,
						earthLeakage: null,
						blastArmed: null
					}
				},
				{
					itemType: "SectionControlModel",
					itemData: {
						serial: 38,
						parentSerial: 8,
						typeId: 1,
						parentType: 0,
						created: now,
						modified: null,
						path: "",
						communicationStatus: 1,
						keySwitchStatus: null,
						cableFault: null,
						isolationRelay: null,
						earthLeakage: null,
						blastArmed: null
					}
				},
				{
					itemType: "SectionControlModel",
					itemData: {
						serial: 46,
						parentSerial: 8,
						typeId: 1,
						parentType: 0,
						created: now,
						modified: null,
						path: "",
						communicationStatus: 1,
						keySwitchStatus: null,
						cableFault: null,
						isolationRelay: null,
						earthLeakage: null,
						blastArmed: null
					}
				},
				{
					itemType: "SectionControlModel",
					itemData: {
						serial: 50,
						parentSerial: 8,
						typeId: 1,
						parentType: 0,
						created: now,
						modified: null,
						path: "",
						communicationStatus: 1,
						keySwitchStatus: null,
						cableFault: null,
						isolationRelay: null,
						earthLeakage: null,
						blastArmed: null
					}
				},
				{
					itemType: "SectionControlModel",
					itemData: {
						serial: 42,
						parentSerial: 8,
						typeId: 1,
						parentType: 0,
						created: now,
						modified: null,
						path: "",
						communicationStatus: 1,
						keySwitchStatus: null,
						cableFault: null,
						isolationRelay: null,
						earthLeakage: null,
						blastArmed: null
					}
				},
				{
					itemType: "SectionControlModel",
					itemData: {
						serial: 18,
						parentSerial: 8,
						typeId: 1,
						parentType: 0,
						created: now,
						modified: null,
						path: "",
						communicationStatus: 1,
						keySwitchStatus: null,
						cableFault: null,
						isolationRelay: null,
						earthLeakage: null,
						blastArmed: null
					}
				},
				{
					itemType: "SectionControlModel",
					itemData: {
						serial: 44,
						parentSerial: 8,
						typeId: 1,
						parentType: 0,
						created: now,
						modified: null,
						path: "",
						communicationStatus: 1,
						keySwitchStatus: null,
						cableFault: null,
						isolationRelay: null,
						earthLeakage: null,
						blastArmed: null
					}
				}
			];

			const packetTemplate = new PacketTemplate();

			const parser = new DataListParser(packetTemplate.incomingCommTemplate[1]);

			var testObj = {
				packet: "AAAA1601000800250026002E0032002A0012002C7BCA",
				created: now
			};

			let parsedPacketArr = await parser.parse(testObj);
			//console.log(parsedPacketArr);

			let result = await parser.buildNodeData(parsedPacketArr);
			let res = result.map(item => {
				return {
					itemType: item.constructor.name,
					itemData: item.data
				};
			});
			//console.log(res);

			await assert.deepEqual(res, expected);
		});
	});
});
