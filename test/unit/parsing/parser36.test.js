const chai = require("chai");
const expect = chai.expect;
chai.use(require("chai-match"));

const Parser = require("../../../lib/parsers/parser");
const modes = require("../../../lib/configs/modes/modes");

const fields = require("../../../lib/configs/fields/fieldConstants");
const { communicationStatus, serial, typeId, qosFiring, cableFault, parentType } = fields;
const { createdAt, path, deviceType, firmware, qos, elt, min2, min7 } = fields;

const UnitModelFactory = require("../../../lib/models/units/unitModelFactory");
const UnitBuilder = require("../../../lib/builders/unitBuilder");

describe("UNIT - Parser", async function() {
	context("36 Command", async () => {
		let now = Date.now();

		const expected = [
			{
				itemType: "PrimaryUnitModel",
				itemState: {
					[communicationStatus]: 1,
				},
				itemMeta: {
					[parentType]: 0,
					[serial]: 91,
					[typeId]: 5,
					[createdAt]: now,
					[path]: "5/91",
				},
				itemData: {
					[deviceType]: 0,
					[firmware]: 2,
					[qos]: 99,
					[qosFiring]: 0,
					[cableFault]: 0,
					[elt]: 0,
					[min2]: 0,
					[min7]: 0,
				},
			},
		];

		it("can parse a cfc packet", async function() {
			const testObj = {
				packet: "aaaa0d24005bfd000000029157",
				createdAt: now,
			};

			const parsedArr = Parser.create()
				.withMode(modes.AXXIS100_CFC)
				.withPacket(testObj)
				.build();

			const result = await UnitBuilder.create(UnitModelFactory).fromArray(parsedArr);

			const res = result.units.map(item => {
				return {
					itemType: item.constructor.name,
					itemState: item.state,
					itemMeta: item.meta,
					itemData: item.data,
				};
			});

			expect(res).to.deep.equal(expected);
		});
	});
});
