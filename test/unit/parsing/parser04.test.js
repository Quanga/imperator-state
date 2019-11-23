const chai = require("chai");
const expect = chai.expect;
chai.use(require("chai-match"));

const Parser = require("../../../lib/parsers/parser");
const modes = require("../../../lib/configs/modes/modes");
const fields = require("../../../lib/configs/fields/fieldConstants");
const { communicationStatus, serial, typeId, parentSerial, parentType } = fields;
const { createdAt, path, windowId } = fields;

const UnitModelFactory = require("../../../lib/models/units/unitModelFactory");
const UnitBuilder = require("../../../lib/builders/unitBuilder");

describe("UNIT - Parser", async function() {
	context("04 Command", async () => {
		let now = Date.now();

		var expected = [
			{
				itemType: "PrimaryUnitModel",
				itemState: { [communicationStatus]: 1 },
				itemMeta: {
					[serial]: 67,
					[typeId]: 3,
					[parentType]: 0,
					[path]: "3/67",
					[createdAt]: now,
				},
				itemData: {},
			},
			{
				itemType: "SecondaryUnitModel",
				itemState: { [communicationStatus]: 0 },
				itemMeta: {
					[serial]: "27.67.233.60",
					[parentSerial]: 67,
					[typeId]: 4,
					[parentType]: 3,
					[createdAt]: now,
					[path]: "3/67/4/97",
					[windowId]: 97,
				},
				itemData: {},
			},
			{
				itemType: "SecondaryUnitModel",
				itemState: { [communicationStatus]: 0 },
				itemMeta: {
					[serial]: "27.67.233.61",
					[parentSerial]: 67,
					[typeId]: 4,
					[parentType]: 3,
					[createdAt]: now,
					[path]: "3/67/4/98",
					[windowId]: 98,
				},
				itemData: {},
			},
			{
				itemType: "SecondaryUnitModel",
				itemState: { [communicationStatus]: 0 },
				itemMeta: {
					[serial]: "27.67.233.62",
					[parentSerial]: 67,
					[typeId]: 4,
					[parentType]: 3,
					[createdAt]: now,
					[path]: "3/67/4/99",
					[windowId]: 99,
				},
				itemData: {},
			},
			{
				itemType: "SecondaryUnitModel",
				itemState: { [communicationStatus]: 0 },
				itemMeta: {
					[serial]: "27.67.233.63",
					[parentSerial]: 67,
					[typeId]: 4,
					[parentType]: 3,
					[createdAt]: now,
					[path]: "3/67/4/100",
					[windowId]: 100,
				},
				itemData: {},
			},
		];

		it("can create an array of units containing CBB and EDD data from a packet", async function() {
			const testObj = {
				packet: "aaaa1c0400431b43e93c611b43e93d621b43e93e631b43e93f6414ac",
				createdAt: now,
			};

			const parsedArr = Parser.create()
				.withMode(modes.AXXIS100)
				.withPacket(testObj)
				.build();

			console.log(parsedArr);

			const resultArr = UnitBuilder.create(UnitModelFactory);

			const validaArr = await resultArr.fromArray(parsedArr);

			const res = validaArr.units.map(item => {
				return {
					itemType: item.constructor.name,
					itemData: item.data,
					itemMeta: item.meta,
					itemState: item.state,
				};
			});

			expect(res).to.deep.equal(expected);
		});

		it("can process an edd delete command", async function() {
			var expected = [
				{
					itemType: "PrimaryUnitModel",
					itemMeta: {
						[fields.serial]: 67,
						[fields.typeId]: 3,
						[fields.parentType]: 0,
						[fields.path]: "3/67",
						[fields.createdAt]: now,
					},
					itemData: {},
				},
				{
					itemType: "SecondaryUnitModel",
					itemMeta: {
						[fields.serial]: "255.255.255.255",
						[fields.parentSerial]: 67,
						[fields.typeId]: 4,
						[fields.parentType]: 3,
						[fields.createdAt]: now,
						[fields.path]: "3/67/4/255",
						[fields.windowId]: 255,
					},
					itemData: {},
				},
			];

			const testObj = {
				packet: "aaaa0d040043ffffffffff8a44",
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
					itemMeta: item.meta,
					itemData: item.data,
				};
			});

			expect(res).to.deep.equal(expected);
		});
	});
});
