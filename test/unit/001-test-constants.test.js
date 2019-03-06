
var assert = require("assert");



describe("Packet Constants", async function () {
	const PacketConstants = require("../../lib/constants/packetTemplates");
	const packetConstants = new PacketConstants();

	it('can get all incoming packet constants', async function () {
		try {
			let allIncoming = await packetConstants.incomingCommTemplate;
			let incomingKeys = await Array.from(Object.keys(allIncoming));
			console.log(incomingKeys);
			assert.equal(incomingKeys.length, 6);
		} catch (err) {
			return Promise.reject(err);
		}
	});

	it('can get all the unitBitTemplates', async function () {
		try {
			let bitTemplates = packetConstants.unitBitTemplate;
			let bitTemps = await Array.from(Object.keys(bitTemplates));
			assert.equal(bitTemps.length, 5);
		} catch (err) {
			return Promise.reject(err);
		}
	});

	it('can get all the logTypes', async function () {
		try {
			let logTypes = packetConstants.loggableTypes;
			let logList = await Array.from(Object.keys(logTypes));
			assert.equal(logList.length, 5);
		} catch (err) {
			return Promise.reject(err);
		}
	});

	it('can test all Logable attributes', async function () {
		try {

			let logables = packetConstants.loggables;

			let res1 = logables.blast_armed.default[0](23, 2);
			let res2 = logables.blast_armed.default[1](23, 2);
			assert.equal(res1, "I651: SN 23 Blast Disarmed");
			assert.equal(res2, "I651: SN 23 Blast Armed");

			res1 = logables.communication_status.default[0](23, 2);
			res2 = logables.communication_status.default[1](23, 2);
			assert.equal(res1, "I651: SN 23 communication status is OFF");
			assert.equal(res2, "I651: SN 23 communication status is ON");


			res1 = logables.key_switch_status.default[0](23, 2);
			res2 = logables.key_switch_status.default[1](23, 2);
			assert.equal(res1, "I651: SN 23 key Switch is OFF");
			assert.equal(res2, "I651: SN 23 key Switch is ON");

			res1 = logables.fire_button[0][0](23, 2);
			res2 = logables.fire_button[0][1](23, 2);
			assert.equal(res1, "I651: SN 23 key switch not Pressed");
			assert.equal(res2, "I651: SN 23 key switch Pressed");

			res1 = logables.isolation_relay.default[0](23, 2);
			res2 = logables.isolation_relay.default[1](23, 2);
			assert.equal(res1, "I651: SN 23 isolation relay is OFF");
			assert.equal(res2, "I651: SN 23 isolation relay is ON");

			res1 = logables.DC_supply_voltage_status.default[0](23, 2);
			res2 = logables.DC_supply_voltage_status.default[1](23, 2);
			assert.equal(res1, "I651: SN 23 DC_supply_voltage_status is OFF");
			assert.equal(res2, "I651: SN 23 DC_supply_voltage_status is ON");

			res1 = logables.cable_fault.default[0](23, 2);
			res2 = logables.cable_fault.default[1](23, 2);
			assert.equal(res1, "I651: SN 23 No Cable Fault Detected");
			assert.equal(res2, "I651: SN 23 Cable Fault Detected");


			res1 = logables.earth_leakage.default[0](23, 2);
			res2 = logables.earth_leakage.default[1](23, 2);
			assert.equal(res1, "I651: SN 23 No Earth Leakage Fault");
			assert.equal(res2, "I651: SN 23 Earth Leakage Fault Detected");

			res1 = logables.booster_fired_lfs.default[0](23, 2);
			res2 = logables.booster_fired_lfs.default[1](23, 2);
			assert.equal(res1, "I651: SN 23 booster fire message false");
			assert.equal(res2, "I651: SN 23 booster fire message true");

			res1 = logables.mains.default[0](23, 2);
			res2 = logables.mains.default[1](23, 2);
			assert.equal(res1, "I651: SN 23 Power Supply Connected");
			assert.equal(res2, "I651: SN 23 Power Supply Error");

			res1 = logables.low_bat.default[0](23, 2);
			res2 = logables.low_bat.default[1](23, 2);
			assert.equal(res1, "I651: SN 23 Battery Charged");
			assert.equal(res2, "I651: SN 23 Low Battery Detected");

		} catch (err) {
			return Promise.reject(err);
		}
	});

	it('can test all Warning attributes', async function () {
		try {

			let warnables = packetConstants.warnables;

			let res1 = warnables.cable_fault.default[0](23, 2);
			let res2 = warnables.cable_fault.default[1](23, 2);
			assert.equal(res1, "I651: SN 23 : Cable fault Restored");
			assert.equal(res2, "I651: SN 23 : Cable fault detected, unit will not fire until the fault is isolated or corrected");

			res1 = warnables.cable_fault[3][0](23, 2);
			res2 = warnables.cable_fault[3][1](23, 2);
			assert.equal(res1, "I651: SN 23 : Cable fault Restored");
			assert.equal(res2, "I651: SN 23 : Cable fault to EDDs detected, will not fire any EDDs");

			res1 = warnables.earth_leakage.default[0](23, 2);
			res2 = warnables.earth_leakage.default[1](23, 2);
			assert.equal(res1, "I651: SN 23 Earth leakage fault corrected");
			assert.equal(res2, "I651: SN 23 : Earth leakage fault detected, unit will not fire until fault is isolated or corrected");

			res1 = warnables.earth_leakage[1][0](23, 2);
			res2 = warnables.earth_leakage[1][1](23, 2);
			assert.equal(res1, "I651: SN 23 Earth leakage fault corrected");
			assert.equal(res2, "I651: SN 23 : Section earth leakage fault detected, downstream units isolated and will not fire until fault is isolated or corrected");

			res1 = warnables.earth_leakage[3][0](23, 2);
			res2 = warnables.earth_leakage[3][1](23, 2);
			assert.equal(res1, "I651: SN 23 Earth leakage fault corrected");
			assert.equal(res2, "I651: SN 23 : Section earth leakage fault detected, downstream units isolated and will not fire until fault is isolated or corrected");

			res1 = warnables.booster_fired_lfs.default[0](23, 2);
			res2 = warnables.booster_fired_lfs.default[1](23, 2);
			assert.equal(res1, "I651: SN 23 booster not fired");
			assert.equal(res2, "I651: SN 23 booser fired message");

			res1 = warnables.mains.default[0](23, 2);
			res2 = warnables.mains.default[1](23, 2);
			assert.equal(res1, "I651: SN 23 : Power Restored");
			assert.equal(res2, "I651: SN 23 : Power outage, unit operating on battery backup");

			res1 = warnables.low_bat.default[0](23, 2);
			res2 = warnables.low_bat.default[1](23, 2);
			assert.equal(res1, "I651: SN 23 Battery Restored");
			assert.equal(res2, "I651: SN 23 : Low battery detected, failure to charge may result in blast failure. There is 1 hour left until the battery is depleted");

		} catch (err) {
			return Promise.reject(err);
		}
	});


});