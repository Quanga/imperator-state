/* eslint-disable no-unused-vars */
const chai = require("chai");
const expect = chai.expect;
chai.use(require("chai-match"));

const fields = require("../../../lib/configs/fields/fieldConstants");
const { communicationStatus, createdAt, path, serial, parentType, program } = fields;
const { mains, tooLowBat, lowBat, cableFault, calibration, typeId, shaftFault } = fields;
const { keySwitchStatus, blastArmed, isolationRelay, lfs, dcSupplyVoltage } = fields;
const { earthLeakage, ledState, childCount, parentSerial, windowId } = fields;
const { bridgeWire, tagged, logged, delay, boosterFired } = fields;

const modes = require("../../../lib/configs/modes/modes");

const Parser = require("../../../lib/parsers/parser");

const UnitModelFactory = require("../../../lib/models/units/unitModelFactory");
const UnitBuilder = require("../../../lib/builders/unitBuilder");

describe("UNIT - Parser", async function() {
	context("05 Command", async () => {
		it("can create a result array with nodes containing CBB & EDD data from a parsed packet", async function() {
			const now = Date.now();

			const expected = [
				{
					itemType: "PrimaryUnitModel",
					itemState: { [communicationStatus]: 1 },
					itemMeta: {
						[createdAt]: now,
						[path]: "3/67",
						[typeId]: 3,
						[parentType]: 0,
						[serial]: 67,
					},
					itemData: {
						[blastArmed]: 0,
						[keySwitchStatus]: 1,
						[isolationRelay]: 0,
						[mains]: 0,
						[lowBat]: 0,
						[lfs]: 1,
						[tooLowBat]: 0,
						[dcSupplyVoltage]: 1,
						[shaftFault]: 0,
						[cableFault]: 0,
						[earthLeakage]: 0,
						[ledState]: 8,
						[childCount]: 100,
					},
				},
				{
					itemType: "SecondaryUnitModel",
					itemState: { [communicationStatus]: 0 },
					itemMeta: {
						[createdAt]: now,
						[path]: "3/67/4/16",
						[parentSerial]: 67,
						[typeId]: 4,
						[parentType]: 3,
						[windowId]: 16,
					},
					itemData: {
						[bridgeWire]: 0,
						[calibration]: 0,
						[program]: 0,
						[boosterFired]: 0,
						[tagged]: 0,
						[logged]: 1,
						[delay]: 1500,
					},
				},
				{
					itemType: "SecondaryUnitModel",
					itemState: { [communicationStatus]: 0 },
					itemMeta: {
						[createdAt]: now,
						[path]: "3/67/4/17",
						[parentSerial]: 67,
						[typeId]: 4,
						[parentType]: 3,
						[windowId]: 17,
					},
					itemData: {
						[bridgeWire]: 0,
						[calibration]: 0,
						[program]: 0,
						[boosterFired]: 0,
						[tagged]: 0,
						[logged]: 1,
						[delay]: 1600,
					},
				},
				{
					itemType: "SecondaryUnitModel",
					itemState: { [communicationStatus]: 0 },
					itemMeta: {
						[createdAt]: now,
						[path]: "3/67/4/18",
						[parentSerial]: 67,
						[typeId]: 4,
						[parentType]: 3,
						[windowId]: 18,
					},
					itemData: {
						[bridgeWire]: 0,
						[calibration]: 0,
						[program]: 0,
						[boosterFired]: 0,
						[tagged]: 0,
						[logged]: 1,
						[delay]: 1700,
					},
				},
				{
					itemType: "SecondaryUnitModel",
					itemState: { [communicationStatus]: 0 },
					itemMeta: {
						[createdAt]: now,
						[path]: "3/67/4/19",
						[parentSerial]: 67,
						[typeId]: 4,
						[parentType]: 3,
						[windowId]: 19,
					},
					itemData: {
						[bridgeWire]: 0,
						[calibration]: 0,
						[program]: 0,
						[boosterFired]: 0,
						[tagged]: 0,
						[logged]: 1,
						[delay]: 1800,
					},
				},
				{
					itemType: "SecondaryUnitModel",
					itemState: { [communicationStatus]: 0 },
					itemMeta: {
						[createdAt]: now,
						[path]: "3/67/4/20",
						[parentSerial]: 67,
						[typeId]: 4,
						[parentType]: 3,
						[windowId]: 20,
					},
					itemData: {
						[bridgeWire]: 0,
						[calibration]: 0,
						[program]: 0,
						[boosterFired]: 0,
						[tagged]: 0,
						[logged]: 1,
						[delay]: 1900,
					},
				},
				{
					itemType: "SecondaryUnitModel",
					itemState: { [communicationStatus]: 0 },
					itemMeta: {
						[createdAt]: now,
						[path]: "3/67/4/21",
						[parentSerial]: 67,
						[typeId]: 4,
						[parentType]: 3,
						[windowId]: 21,
					},
					itemData: {
						[bridgeWire]: 0,
						[calibration]: 0,
						[program]: 0,
						[boosterFired]: 0,
						[tagged]: 0,
						[logged]: 1,
						[delay]: 2000,
					},
				},
				{
					itemType: "SecondaryUnitModel",
					itemState: { [communicationStatus]: 0 },
					itemMeta: {
						[createdAt]: now,
						[path]: "3/67/4/22",
						[parentSerial]: 67,
						[typeId]: 4,
						[parentType]: 3,
						[windowId]: 22,
					},
					itemData: {
						[bridgeWire]: 0,
						[calibration]: 0,
						[program]: 0,
						[boosterFired]: 0,
						[tagged]: 0,
						[logged]: 1,
						[delay]: 2100,
					},
				},
				{
					itemType: "SecondaryUnitModel",
					itemState: { [communicationStatus]: 0 },
					itemMeta: {
						[createdAt]: now,
						[path]: "3/67/4/23",
						[parentSerial]: 67,
						[typeId]: 4,
						[parentType]: 3,
						[windowId]: 23,
					},
					itemData: {
						[bridgeWire]: 0,
						[calibration]: 0,
						[program]: 0,
						[boosterFired]: 0,
						[tagged]: 0,
						[logged]: 1,
						[delay]: 2200,
					},
				},
				{
					itemType: "SecondaryUnitModel",
					itemState: { [communicationStatus]: 0 },
					itemMeta: {
						[createdAt]: now,
						[path]: "3/67/4/24",
						[parentSerial]: 67,
						[typeId]: 4,
						[parentType]: 3,
						[windowId]: 24,
					},
					itemData: {
						[bridgeWire]: 0,
						[calibration]: 0,
						[program]: 0,
						[boosterFired]: 0,
						[tagged]: 0,
						[logged]: 1,
						[delay]: 2300,
					},
				},
				{
					itemType: "SecondaryUnitModel",
					itemState: { [communicationStatus]: 0 },
					itemMeta: {
						[createdAt]: now,
						[path]: "3/67/4/25",
						[parentSerial]: 67,
						[typeId]: 4,
						[parentType]: 3,
						[windowId]: 25,
					},
					itemData: {
						[bridgeWire]: 0,
						[calibration]: 0,
						[program]: 0,
						[boosterFired]: 0,
						[tagged]: 0,
						[logged]: 1,
						[delay]: 2400,
					},
				},
				{
					itemType: "SecondaryUnitModel",
					itemState: { [communicationStatus]: 0 },
					itemMeta: {
						[createdAt]: now,
						[path]: "3/67/4/26",
						[parentSerial]: 67,
						[typeId]: 4,
						[parentType]: 3,
						[windowId]: 26,
					},
					itemData: {
						[bridgeWire]: 0,
						[calibration]: 0,
						[program]: 0,
						[boosterFired]: 0,
						[tagged]: 0,
						[logged]: 1,
						[delay]: 2500,
					},
				},
				{
					itemType: "SecondaryUnitModel",
					itemState: { [communicationStatus]: 0 },
					itemMeta: {
						[createdAt]: now,
						[path]: "3/67/4/27",
						[parentSerial]: 67,
						[typeId]: 4,
						[parentType]: 3,
						[windowId]: 27,
					},
					itemData: {
						[bridgeWire]: 0,
						[calibration]: 0,
						[program]: 0,
						[boosterFired]: 0,
						[tagged]: 0,
						[logged]: 1,
						[delay]: 2600,
					},
				},
				{
					itemType: "SecondaryUnitModel",
					itemState: { [communicationStatus]: 0 },
					itemMeta: {
						[createdAt]: now,
						[path]: "3/67/4/28",
						[parentSerial]: 67,
						[typeId]: 4,
						[parentType]: 3,
						[windowId]: 28,
					},
					itemData: {
						[bridgeWire]: 0,
						[calibration]: 0,
						[program]: 0,
						[boosterFired]: 0,
						[tagged]: 0,
						[logged]: 1,
						[delay]: 2700,
					},
				},
				{
					itemType: "SecondaryUnitModel",
					itemState: { [communicationStatus]: 0 },
					itemMeta: {
						[createdAt]: now,
						[path]: "3/67/4/29",
						[parentSerial]: 67,
						[typeId]: 4,
						[parentType]: 3,
						[windowId]: 29,
					},
					itemData: {
						[bridgeWire]: 0,
						[calibration]: 0,
						[program]: 0,
						[boosterFired]: 0,
						[tagged]: 0,
						[logged]: 1,
						[delay]: 2800,
					},
				},
				{
					itemType: "SecondaryUnitModel",
					itemState: { [communicationStatus]: 0 },
					itemMeta: {
						[createdAt]: now,
						[path]: "3/67/4/30",
						[parentSerial]: 67,
						[typeId]: 4,
						[parentType]: 3,
						[windowId]: 30,
					},
					itemData: {
						[bridgeWire]: 0,
						[calibration]: 0,
						[program]: 0,
						[boosterFired]: 0,
						[tagged]: 0,
						[logged]: 1,
						[delay]: 2900,
					},
				},
			];

			const testObj = {
				packet:
					"aaaa4805004364008a211001dc05110140061201a4061301080714016c071501d00716013408170198081801fc08190160091a01c4091b01280a1c018c0a1d01f00a1e01540b8f97",
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
					itemMeta: item.meta,
					itemState: item.state,
					itemData: item.data,
				};
			});

			expect(res).to.deep.equal(expected);
		});
	});
});
