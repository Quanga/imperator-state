const chai = require("chai");
const expect = chai.expect;
chai.use(require("chai-match"));

const Parser = require("../../../lib/parsers/parser");
const modes = require("../../../lib/configs/modes/modes");
const fields = require("../../../lib/configs/fields/fieldConstants");
const { communicationStatus, createdAt, path, serial, parentType, program } = fields;
const { calibration, typeId, parentSerial, windowId } = fields;
const { bridgeWire, tagged, logged, delay, boosterFired, detonatorStatus } = fields;

const UnitModelFactory = require("../../../lib/models/units/unitModelFactory");
const UnitBuilder = require("../../../lib/builders/unitBuilder");

describe("UNIT - Parser", async function() {
	context("23 Command", async () => {
		let now = Date.now();
		it("can create a result array with nodes containing CBB & EDD data from a parsed packet", async function() {
			const expected = [
				{
					itemType: "PrimaryUnitModel",
					itemState: {
						[communicationStatus]: 1,
					},
					itemMeta: {
						[serial]: 65535,
						[typeId]: 3,
						[parentType]: 0,
						[path]: "3/65535",
						[createdAt]: now,
					},
					itemData: {},
				},
				{
					itemType: "SecondaryUnitModel",
					itemState: {
						[communicationStatus]: 0,
					},
					itemMeta: {
						[parentSerial]: 65535,
						[typeId]: 4,
						[parentType]: 3,
						[createdAt]: now,
						[path]: "3/65535/4/493",
						[windowId]: 493,
					},
					itemData: {
						[bridgeWire]: 0,
						[calibration]: 0,
						[program]: 0,
						[boosterFired]: 0,
						[tagged]: 0,
						[logged]: 1,
						[delay]: 9200,
						[detonatorStatus]: 0,
					},
				},
				{
					itemType: "SecondaryUnitModel",
					itemState: {
						[communicationStatus]: 0,
					},
					itemMeta: {
						[parentSerial]: 65535,
						[typeId]: 4,
						[parentType]: 3,
						[createdAt]: now,
						[path]: "3/65535/4/494",
						[windowId]: 494,
					},
					itemData: {
						[bridgeWire]: 0,
						[calibration]: 0,
						[program]: 0,
						[boosterFired]: 0,
						[tagged]: 0,
						[logged]: 1,
						[delay]: 9300,
						[detonatorStatus]: 0,
					},
				},
				{
					itemType: "SecondaryUnitModel",
					itemState: {
						[communicationStatus]: 0,
					},
					itemMeta: {
						[parentSerial]: 65535,
						[typeId]: 4,
						[parentType]: 3,
						[createdAt]: now,
						[path]: "3/65535/4/495",
						[windowId]: 495,
					},
					itemData: {
						[bridgeWire]: 0,
						[calibration]: 0,
						[program]: 0,
						[boosterFired]: 0,
						[tagged]: 0,
						[logged]: 1,
						[delay]: 9400,
						[detonatorStatus]: 0,
					},
				},
				{
					itemType: "SecondaryUnitModel",
					itemState: {
						[communicationStatus]: 0,
					},
					itemMeta: {
						[parentSerial]: 65535,
						[typeId]: 4,
						[parentType]: 3,
						[createdAt]: now,
						[path]: "3/65535/4/496",
						[windowId]: 496,
					},
					itemData: {
						[bridgeWire]: 0,
						[calibration]: 0,
						[program]: 0,
						[boosterFired]: 0,
						[tagged]: 0,
						[logged]: 1,
						[delay]: 9500,
						[detonatorStatus]: 0,
					},
				},
				{
					itemType: "SecondaryUnitModel",
					itemState: {
						[communicationStatus]: 0,
					},
					itemMeta: {
						[parentSerial]: 65535,
						[typeId]: 4,
						[parentType]: 3,
						[createdAt]: now,
						[path]: "3/65535/4/497",
						[windowId]: 497,
					},
					itemData: {
						[bridgeWire]: 0,
						[calibration]: 0,
						[program]: 0,
						[boosterFired]: 0,
						[tagged]: 0,
						[logged]: 1,
						[delay]: 9600,
						[detonatorStatus]: 0,
					},
				},
				{
					itemType: "SecondaryUnitModel",
					itemState: {
						[communicationStatus]: 0,
					},
					itemMeta: {
						[parentSerial]: 65535,
						[typeId]: 4,
						[parentType]: 3,
						[createdAt]: now,
						[path]: "3/65535/4/498",
						[windowId]: 498,
					},
					itemData: {
						[bridgeWire]: 0,
						[calibration]: 0,
						[program]: 0,
						[boosterFired]: 0,
						[tagged]: 0,
						[logged]: 1,
						[delay]: 9700,
						[detonatorStatus]: 0,
					},
				},
				{
					itemType: "SecondaryUnitModel",
					itemState: {
						[communicationStatus]: 0,
					},
					itemMeta: {
						[parentSerial]: 65535,
						[typeId]: 4,
						[parentType]: 3,
						[createdAt]: now,
						[path]: "3/65535/4/499",
						[windowId]: 499,
					},
					itemData: {
						[bridgeWire]: 0,
						[calibration]: 0,
						[program]: 0,
						[boosterFired]: 0,
						[tagged]: 0,
						[logged]: 1,
						[delay]: 9800,
						[detonatorStatus]: 0,
					},
				},
				{
					itemType: "SecondaryUnitModel",
					itemState: {
						[communicationStatus]: 0,
					},
					itemMeta: {
						[parentSerial]: 65535,
						[typeId]: 4,
						[parentType]: 3,
						[createdAt]: now,
						[path]: "3/65535/4/500",
						[windowId]: 500,
					},
					itemData: {
						[bridgeWire]: 0,
						[calibration]: 0,
						[program]: 0,
						[boosterFired]: 0,
						[tagged]: 0,
						[logged]: 1,
						[delay]: 9900,
						[detonatorStatus]: 0,
					},
				},
			];

			const testObj = {
				packet:
					"aaaa3017ffffed0101f023ee01015424ef0101b824f001011c25f101018025f20101e425f301014826f40101ac262665",
				createdAt: now,
			};

			const parsedArr = Parser.create()
				.withMode(modes.AXXIS100)
				.withPacket(testObj)
				.build();

			const result = await UnitBuilder.create(UnitModelFactory).fromArray(parsedArr);

			let res = result.units.map(item => {
				return {
					itemType: item.constructor.name,
					itemData: item.data,
					itemState: item.state,
					itemMeta: item.meta,
				};
			});

			expect(res).to.deep.equal(expected);
		});
	});
});
