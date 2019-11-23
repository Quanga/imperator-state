/* eslint-disable max-len */
const chai = require("chai");
const expect = chai.expect;
chai.use(require("chai-match"));

const fields = require("../../../lib/configs/fields/fieldConstants");
const { communicationStatus, serial, typeId, parentSerial, parentType } = fields;
const { createdAt, path, windowId } = fields;

const Parser = require("../../../lib/parsers/parser");
const modes = require("../../../lib/configs/modes/modes");

const UnitModelFactory = require("../../../lib/models/units/unitModelFactory");
const UnitBuilder = require("../../../lib/builders/unitBuilder");

describe("UNIT - Parser", async function() {
	context("22 Command", async () => {
		it("can create a result array with nodes containing CBB and EDD data from a parsed packet", async function() {
			const now = Date.now();
			var expected = [
				{
					itemType: "PrimaryUnitModel",
					itemState: {
						[communicationStatus]: 1,
					},
					itemMeta: {
						[serial]: 65535,
						[typeId]: 3,
						[path]: "3/65535",
						[createdAt]: now,
						[parentType]: 0,
					},
				},
				{
					itemType: "SecondaryUnitModel",
					itemState: {
						[communicationStatus]: 0,
					},
					itemMeta: {
						[serial]: "27.74.16.14",
						[parentSerial]: 65535,
						[typeId]: 4,
						[parentType]: 3,
						[createdAt]: now,
						[path]: "3/65535/4/381",
						[windowId]: 381,
					},
				},
				{
					itemType: "SecondaryUnitModel",
					itemState: {
						[communicationStatus]: 0,
					},
					itemMeta: {
						[serial]: "27.74.16.13",
						[parentSerial]: 65535,
						[typeId]: 4,
						[parentType]: 3,
						[createdAt]: now,
						[path]: "3/65535/4/382",
						[windowId]: 382,
					},
				},
				{
					itemType: "SecondaryUnitModel",
					itemState: {
						[communicationStatus]: 0,
					},
					itemMeta: {
						[serial]: "27.74.16.12",
						[parentSerial]: 65535,
						[typeId]: 4,
						[parentType]: 3,
						[createdAt]: now,
						[path]: "3/65535/4/383",
						[windowId]: 383,
					},
				},
				{
					itemType: "SecondaryUnitModel",
					itemState: {
						[communicationStatus]: 0,
					},
					itemMeta: {
						[serial]: "27.74.16.11",
						[parentSerial]: 65535,
						[typeId]: 4,
						[parentType]: 3,
						[createdAt]: now,
						[path]: "3/65535/4/384",
						[windowId]: 384,
					},
				},
				{
					itemType: "SecondaryUnitModel",
					itemState: {
						[communicationStatus]: 0,
					},
					itemMeta: {
						[serial]: "27.74.16.10",
						[parentSerial]: 65535,
						[typeId]: 4,
						[parentType]: 3,
						[createdAt]: now,
						[path]: "3/65535/4/385",
						[windowId]: 385,
					},
				},
				{
					itemType: "SecondaryUnitModel",
					itemState: {
						[communicationStatus]: 0,
					},
					itemMeta: {
						[serial]: "27.74.16.9",
						[parentSerial]: 65535,
						[typeId]: 4,
						[parentType]: 3,
						[createdAt]: now,
						[path]: "3/65535/4/386",
						[windowId]: 386,
					},
				},
				{
					itemType: "SecondaryUnitModel",
					itemState: {
						[communicationStatus]: 0,
					},
					itemMeta: {
						[serial]: "27.74.16.8",
						[parentSerial]: 65535,
						[typeId]: 4,
						[parentType]: 3,
						[createdAt]: now,
						[path]: "3/65535/4/387",
						[windowId]: 387,
					},
				},
				{
					itemType: "SecondaryUnitModel",
					itemState: {
						[communicationStatus]: 0,
					},
					itemMeta: {
						[serial]: "27.74.16.7",
						[parentSerial]: 65535,
						[typeId]: 4,
						[parentType]: 3,
						[createdAt]: now,
						[path]: "3/65535/4/388",
						[windowId]: 388,
					},
				},
				{
					itemType: "SecondaryUnitModel",
					itemState: {
						[communicationStatus]: 0,
					},
					itemMeta: {
						[serial]: "27.74.16.6",
						[parentSerial]: 65535,
						[typeId]: 4,
						[parentType]: 3,
						[createdAt]: now,
						[path]: "3/65535/4/389",
						[windowId]: 389,
					},
				},
				{
					itemType: "SecondaryUnitModel",
					itemState: {
						[communicationStatus]: 0,
					},
					itemMeta: {
						[serial]: "27.74.122.127",
						[parentSerial]: 65535,
						[typeId]: 4,
						[parentType]: 3,
						[createdAt]: now,
						[path]: "3/65535/4/390",
						[windowId]: 390,
					},
				},
			];

			var testObj = {
				packet:
					"aaaa4416ffff1b4a100e7d011b4a100d7e011b4a100c7f011b4a100b80011b4a100a81011b4a100982011b4a100883011b4a100784011b4a100685011b4a7a7f860186ce",
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
					itemState: item.state,
					itemMeta: item.meta,
				};
			});

			expect(res).to.deep.equal(expected);
		});
	});
});
