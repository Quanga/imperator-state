const chai = require("chai");
const expect = chai.expect;
chai.use(require("chai-match"));

const fields = require("../../../lib/configs/fields/fieldConstants");
const { communicationStatus, typeId, serial, blastArmed, path } = fields;
const { keySwitchStatus, createdAt, fireButton, isolationRelay } = fields;
const { cableFault, earthLeakage, parentType } = fields;

const modes = require("../../../lib/configs/modes/modes");

const Parser = require("../../../lib/parsers/parser");

const UnitModelFactory = require("../../../lib/models/units/unitModelFactory");
const UnitBuilder = require("../../../lib/builders/unitBuilder");

describe("UNIT - Parser", async function() {
	context("08 Command", async () => {
		it("can create a node result array with one set of node data from a parsed packet", async function() {
			let now = Date.now();

			const expected = [
				{
					itemType: "PrimaryUnitModel",
					itemState: { [communicationStatus]: 1 },
					itemMeta: {
						[serial]: 1,
						[typeId]: 0,
						[createdAt]: now,
						[parentType]: undefined,
						[path]: "0/1",
					},
					itemData: {
						[keySwitchStatus]: 1,
						[fireButton]: 0,
						[cableFault]: 0,
						[isolationRelay]: 1,
						[earthLeakage]: 0,
						[blastArmed]: 0,
					},
				},
			];

			const testObj = {
				packet: "AAAA0A08000100C0CA96",
				createdAt: now,
			};

			const parsedArr = Parser.create()
				.withMode(modes.AXXIS100)
				.withPacket(testObj)
				.build();

			const result = await UnitBuilder.create(UnitModelFactory).fromArray(parsedArr);

			const res = result.units.map(item => {
				return {
					itemType: item.constructor.name,
					itemData: item.data,
					itemMeta: item.meta,
					itemState: item.state,
				};
			});

			await expect(res).to.deep.equal(expected);
		});

		it("can print a cancellation 08", async function() {
			let now = Date.now();

			// aaaa0a08001705e45771
			//aaaa0a08001705607bb3
			//aaaa0a08001705407992
			const cancelpackets = ["aaaa0a08001705e45771", "aaaa0a08001705607bb3", "aaaa0a08001705407992"];

			for (const packet of cancelpackets) {
				const testObj = {
					packet: packet,
					createdAt: now,
				};

				const parsedArr = Parser.create()
					.withMode(modes.AXXIS100)
					.withPacket(testObj)
					.build();

				const result = await UnitBuilder.create(UnitModelFactory).fromArray(parsedArr);

				const res = result.units.map(item => {
					return {
						itemType: item.constructor.name,
						itemData: item.data,
					};
				});
				console.log(res);
			}

			//await expect(res).to.deep.equal(expected);
		});
	});
});
