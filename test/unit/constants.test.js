var assert = require("assert");
const PacketConstants = require("../../lib/constants/packetTemplates");

describe("Packet Constants Tests", async function() {
	const packetConstants = new PacketConstants();

	it("can get all incoming packet constants", async function() {
		try {
			let allIncoming = await packetConstants.incomingCommTemplate;
			let incomingKeys = await Array.from(Object.keys(allIncoming));
			assert.equal(incomingKeys.length, 8);
		} catch (err) {
			return Promise.reject(err);
		}
	});

	it("can get all the unitBitTemplates", async function() {
		try {
			let bitTemplates = packetConstants.unitBitTemplate;
			let bitTemps = await Array.from(Object.keys(bitTemplates));
			assert.equal(bitTemps.length, 5);
		} catch (err) {
			return Promise.reject(err);
		}
	});

	it("can get all the logTypes", async function() {
		try {
			let logTypes = packetConstants.loggableTypes;
			let logList = await Array.from(Object.keys(logTypes));
			assert.equal(logList.length, 5);
		} catch (err) {
			return Promise.reject(err);
		}
	});

	it("can test all Logable attributes", async function() {
		try {
			let logables = packetConstants.loggables;
			let res1 = logables.blastArmed.default[0](23, 2);
			let res2 = logables.blastArmed.default[1](23, 2);
			assert.equal(res1, "I651: SN 23 Blast Disarmed");
			assert.equal(res2, "I651: SN 23 Blast Armed");

			res1 = logables.communicationStatus.default[0](23, 2);
			res2 = logables.communicationStatus.default[1](23, 2);
			assert.equal(res1, "I651: SN 23 communication status is OFF");
			assert.equal(res2, "I651: SN 23 communication status is ON");

			res1 = logables.keySwitchStatus.default[0](23, 2);
			res2 = logables.keySwitchStatus.default[1](23, 2);
			assert.equal(res1, "I651: SN 23 key Switch is OFF");
			assert.equal(res2, "I651: SN 23 key Switch is ON");

			res1 = logables.fireButton[0][0](23, 2);
			res2 = logables.fireButton[0][1](23, 2);
			assert.equal(res1, "I651: SN 23 key switch not Pressed");
			assert.equal(res2, "I651: SN 23 key switch Pressed");

			res1 = logables.isolationRelay.default[0](23, 2);
			res2 = logables.isolationRelay.default[1](23, 2);
			assert.equal(res1, "I651: SN 23 isolation relay is OFF");
			assert.equal(res2, "I651: SN 23 isolation relay is ON");

			res1 = logables.dcSupplyVoltage.default[0](23, 2);
			res2 = logables.dcSupplyVoltage.default[1](23, 2);
			assert.equal(res1, "I651: SN 23 dcSupplyVoltage is OFF");
			assert.equal(res2, "I651: SN 23 dcSupplyVoltage is ON");

			res1 = logables.cableFault.default[0](23, 2);
			res2 = logables.cableFault.default[1](23, 2);
			assert.equal(res1, "I651: SN 23 No Cable Fault Detected");
			assert.equal(res2, "I651: SN 23 Cable Fault Detected");

			res1 = logables.earthLeakage.default[0](23, 2);
			res2 = logables.earthLeakage.default[1](23, 2);
			assert.equal(res1, "I651: SN 23 No Earth Leakage Fault");
			assert.equal(res2, "I651: SN 23 Earth Leakage Fault Detected");

			res1 = logables.boosterFired.default[0](23, 2);
			res2 = logables.boosterFired.default[1](23, 2);
			assert.equal(res1, "I651: SN 23 booster fire message false");
			assert.equal(res2, "I651: SN 23 booster fire message true");

			res1 = logables.mains.default[0](23, 2);
			res2 = logables.mains.default[1](23, 2);
			assert.equal(res1, "I651: SN 23 Power Supply Connected");
			assert.equal(res2, "I651: SN 23 Power Supply Error");

			res1 = logables.lowBat.default[0](23, 2);
			res2 = logables.lowBat.default[1](23, 2);
			assert.equal(res1, "I651: SN 23 Battery Charged");
			assert.equal(res2, "I651: SN 23 Low Battery Detected");
		} catch (err) {
			return Promise.reject(err);
		}
	});

	it("can test all Warning attributes", async function() {
		try {
			let warnables = packetConstants.warnables;

			let res1 = warnables.cableFault.default[0](23, 2);
			let res2 = warnables.cableFault.default[1](23, 2);
			assert.equal(res1, "I651: SN 23 : Cable fault Restored");
			assert.equal(
				res2,
				"I651: SN 23 : Cable fault detected, unit will not fire until the fault is isolated or corrected"
			);

			res1 = warnables.cableFault[3][0](23, 2);
			res2 = warnables.cableFault[3][1](23, 2);
			assert.equal(res1, "I651: SN 23 : Cable fault Restored");
			assert.equal(
				res2,
				"I651: SN 23 : Cable fault to EDDs detected, will not fire any EDDs"
			);

			res1 = warnables.earthLeakage.default[0](23, 2);
			res2 = warnables.earthLeakage.default[1](23, 2);
			assert.equal(res1, "I651: SN 23 Earth leakage fault corrected");
			assert.equal(
				res2,
				"I651: SN 23 : Earth leakage fault detected, unit will not fire until fault is isolated or corrected"
			);

			res1 = warnables.earthLeakage[1][0](23, 2);
			res2 = warnables.earthLeakage[1][1](23, 2);
			assert.equal(res1, "I651: SN 23 Earth leakage fault corrected");
			assert.equal(
				res2,
				"I651: SN 23 : Section earth leakage fault detected, downstream units isolated and will not fire until fault is isolated or corrected"
			);

			res1 = warnables.earthLeakage[3][0](23, 2);
			res2 = warnables.earthLeakage[3][1](23, 2);
			assert.equal(res1, "I651: SN 23 Earth leakage fault corrected");
			assert.equal(
				res2,
				"I651: SN 23 : Section earth leakage fault detected, downstream units isolated and will not fire until fault is isolated or corrected"
			);

			res1 = warnables.boosterFired.default[0](23, 2);
			res2 = warnables.boosterFired.default[1](23, 2);
			assert.equal(res1, "I651: SN 23 booster not fired");
			assert.equal(res2, "I651: SN 23 booser fired message");

			res1 = warnables.mains.default[0](23, 2);
			res2 = warnables.mains.default[1](23, 2);
			assert.equal(res1, "I651: SN 23 : Power Restored");
			assert.equal(
				res2,
				"I651: SN 23 : Power outage, unit operating on battery backup"
			);

			res1 = warnables.lowBat.default[0](23, 2);
			res2 = warnables.lowBat.default[1](23, 2);
			assert.equal(res1, "I651: SN 23 Battery Restored");
			assert.equal(
				res2,
				"I651: SN 23 : Low battery detected, failure to charge may result in blast failure. There is 1 hour left until the battery is depleted"
			);
		} catch (err) {
			return Promise.reject(err);
		}
	});
});
