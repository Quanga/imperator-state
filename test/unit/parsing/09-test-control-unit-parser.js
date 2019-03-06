var assert = require("assert");

describe("parser-control-unit-parser-test", async function () {
	const MockHappn = require("../../mocks/mock_happn");
	let mockHappn = new MockHappn();

	const PacketService = require("../../../lib/services/packet_service");

	this.timeout(2000);

	it("can create a node result array with one set of node data from a parsed packet", async function () {

		/*
         AAAA 0A 08 0001 00C0 CA96 (event on IBC-1 id 0001 - key switch armed on IBC)
         */


		var expected = [{
			id: null,
			serial: 1,
			parent_serial: null,
			type_id: 0,
			parent_type: null,
			parent_id: null,
			window_id: null,
			created: null,
			modified: null,
			communication_status: 1,
			key_switch_status: 1,
			fire_button: 0,
			cable_fault: 0,
			isolation_relay: 1,
			earth_leakage: 0,
			blast_armed: 0
		}];


		let test = async () => {
			try {
				let packet = { created: Date.now(), message: "AAAA0A08000100C0CA96" };
				let packetService = new PacketService();

				let parsed = await packetService.extractData(mockHappn, packet);
				let packetArr = await packetService.buildNodeData(mockHappn, parsed);
				let result = packetArr.map(ob => ob.data);
				console.log(result);
				await assert.deepEqual(result, expected);
			} catch (err) {
				console.log("error ", err);
				return Promise.reject(err);
			}
		};

		return test();


	});
});
