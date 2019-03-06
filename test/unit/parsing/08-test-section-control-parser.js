var assert = require("assert");

describe("parser-section-control-parser-test", async function () {
	var MockHappn = require("../../mocks/mock_happn");
	var mockHappn = new MockHappn();

	const PacketService = require("../../../lib/services/packet_service");

	this.timeout(2000);

	it("can create a result array with ISC list from a parsed packet", async function () {
		/*
         ISC serial list for IBC id 8

         start  length  command serial  isc1    isc2    isc3    isc4    isc5    isc6    isc7    crc
         AAAA   16      01      0008    0025    0026    002E    0032    002A    0012    002C    7BCA
         */


		var expected = [{
			id: null,
			serial: 8,
			parent_serial: null,
			type_id: 0,
			parent_type: null,
			parent_id: null,
			window_id: null,
			created: null,
			modified: null,
			communication_status: 1,
			key_switch_status: null,
			fire_button: null,
			cable_fault: null,
			isolation_relay: null,
			earth_leakage: null,
			blast_armed: null
		},
		{
			id: null,
			serial: 37,
			parent_serial: 8,
			type_id: 1,
			parent_type: 0,
			parent_id: null,
			window_id: null,
			created: null,
			modified: null,
			communication_status: 1,
			key_switch_status: null,
			cable_fault: null,
			isolation_relay: null,
			earth_leakage: null,
			blast_armed: null
		},
		{
			id: null,
			serial: 38,
			parent_serial: 8,
			type_id: 1,
			parent_type: 0,
			parent_id: null,
			window_id: null,
			created: null,
			modified: null,
			communication_status: 1,
			key_switch_status: null,
			cable_fault: null,
			isolation_relay: null,
			earth_leakage: null,
			blast_armed: null
		},
		{
			id: null,
			serial: 46,
			parent_serial: 8,
			type_id: 1,
			parent_type: 0,
			parent_id: null,
			window_id: null,
			created: null,
			modified: null,
			communication_status: 1,
			key_switch_status: null,
			cable_fault: null,
			isolation_relay: null,
			earth_leakage: null,
			blast_armed: null
		},
		{
			id: null,
			serial: 50,
			parent_serial: 8,
			type_id: 1,
			parent_type: 0,
			parent_id: null,
			window_id: null,
			created: null,
			modified: null,
			communication_status: 1,
			key_switch_status: null,
			cable_fault: null,
			isolation_relay: null,
			earth_leakage: null,
			blast_armed: null
		},
		{
			id: null,
			serial: 42,
			parent_serial: 8,
			type_id: 1,
			parent_type: 0,
			parent_id: null,
			window_id: null,
			created: null,
			modified: null,
			communication_status: 1,
			key_switch_status: null,
			cable_fault: null,
			isolation_relay: null,
			earth_leakage: null,
			blast_armed: null
		},
		{
			id: null,
			serial: 18,
			parent_serial: 8,
			type_id: 1,
			parent_type: 0,
			parent_id: null,
			window_id: null,
			created: null,
			modified: null,
			communication_status: 1,
			key_switch_status: null,
			cable_fault: null,
			isolation_relay: null,
			earth_leakage: null,
			blast_armed: null
		},
		{
			id: null,
			serial: 44,
			parent_serial: 8,
			type_id: 1,
			parent_type: 0,
			parent_id: null,
			window_id: null,
			created: null,
			modified: null,
			communication_status: 1,
			key_switch_status: null,
			cable_fault: null,
			isolation_relay: null,
			earth_leakage: null,
			blast_armed: null
		}];


		let test = async () => {
			try {
				let packet = { created: Date.now(), message: "AAAA1601000800250026002E0032002A0012002C7BCA" };
				let packetService = new PacketService();

				let parsed = await packetService.extractData(mockHappn, packet);
				let packetArr = await packetService.buildNodeData(mockHappn, parsed);

				let result = packetArr.map(ob => ob.data);
				await assert.deepEqual(result, expected);
			} catch (err) {
				console.log("error ", err);
				return Promise.reject(err);
			}
		};

		return test();
	});
});
