var assert = require("assert");

describe("651 Parser Test", async function () {
	const MockHappn = require("../../mocks/mock_happn");
	let mockHappn = new MockHappn();

	const PacketService = require("../../../lib/services/packet_service");

	this.timeout(2000);

	it("can create a result array with nodes containing ISC and IB651 data from a parsed packet", async function () {
		/*
         start  length  command ISC serial  ISC data    IB651 data  CRC
         AAAA   0C      03      0004        4040        210E        CAF6
         */

		var expected = [{
			id: null,
			serial: 4,
			parent_serial: null,
			type_id: 1,
			parent_type: 0,
			parent_id: null,
			window_id: null,
			created: null,
			modified: null,
			communication_status: 1,
			key_switch_status: 0,
			cable_fault: 0,
			isolation_relay: 1,
			earth_leakage: 0,
			blast_armed: 0
		},
		{
			id: null,
			serial: null,
			parent_serial: 4,
			type_id: 2,
			parent_type: 1,
			parent_id: null,
			window_id: 1,
			created: null,
			modified: null,
			communication_status: 1,
			key_switch_status: 0,
			detonator_status: 1,
			booster_fired_lfs: 0,
			partial_blast_lfs: 0,
			missing_pulse_detected_lfs: 0,
			DC_supply_voltage: 0,
			mains: 0
		}];

		let test = async () => {
			try {
				let packet = { created: Date.now(), message: "AAAA0C0300044040210ECAF6" };
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
