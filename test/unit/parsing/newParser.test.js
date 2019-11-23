const chai = require("chai");
const expect = chai.expect;
chai.use(require("chai-match"));

const modes = require("../../../lib/configs/modes/modes");
const fields = require("../../../lib/configs/fields/fieldConstants");
const { typeId } = fields;
const Parser = require("../../../lib/parsers/parser");

const UnitModelFactory = require("../../../lib/models/units/unitModelFactory");

describe("UNIT - Parser", async function() {
	this.timeout(30000);
	const createdAt = Date.now();

	context("Parser Class", async () => {
		it("can instantiate an new parser using the create command", async () => {
			const testPacket = {
				packet: "aaaa1c0400431b43e93c611b43e93d621b43e93e631b43e93f6414ac",
				createdAt,
			};

			let parser = Parser.create()
				.withMode(modes.AXXIS100)
				.withPacket(testPacket);
			expect(parser.packet).to.be.equal("aaaa1c0400431b43e93c611b43e93d621b43e93e631b43e93f6414ac");
			expect(parser).to.be.an.instanceof(Parser);
		});

		it("can parse a 04 Command with 4 packets", async () => {
			const testPacket = {
				packet: "aaaa1c0400431b43e93c611b43e93d621b43e93e631b43e93f6414ac",
				createdAt,
			};

			let parser = Parser.create()
				.withMode(modes.AXXIS100)
				.withPacket(testPacket)
				.build();

			expect(parser).to.be.an.instanceof(Parser);
			expect(parser.data.length).to.be.equal(5);
			expect(parser.meta[1][fields.serial]).to.be.equal("27.67.233.60");
			expect(parser.meta[1][fields.windowId]).to.be.equal(97);
			expect(parser.meta[4][fields.windowId]).to.be.equal(100);
			expect(parser.meta[1][fields.parentType]).to.be.equal(3);
			expect(parser.meta[1][fields.parentSerial]).to.be.equal(67);
		});

		it("can parse a 04 Command EDD_SIG", async () => {
			const testPacket = {
				packet: "aaaa0d040043ffffffffff8a44",
				createdAt,
			};

			const parser = Parser.create()
				.withMode(modes.AXXIS100)
				.withPacket(testPacket)
				.build();

			//console.log(JSON.stringify(parser, null, 2));
			expect(parser).to.be.an.instanceof(Parser);
			expect(parser.data.length).to.be.equal(2);
			expect(parser.meta[0][fields.serial]).to.be.equal(67);
			expect(parser.meta[1][fields.serial]).to.be.equal("255.255.255.255");
			expect(parser.meta[1][fields.windowId]).to.be.equal(255);
			expect(parser.meta[1][fields.parentType]).to.be.equal(3);
			expect(parser.meta[1][fields.typeId]).to.be.equal(4);
			expect(parser.meta[1][fields.parentSerial]).to.be.equal(67);
		});

		it("can parse a 05 Command", async () => {
			const testPacket = {
				packet:
					"aaaa4805004364008a211001dc05110140061201a4061301080714016c071501d00716013408170198081801fc08190160091a01c4091b01280a1c018c0a1d01f00a1e01540b8f97",
				createdAt,
			};
			let parser = Parser.create()
				.withMode(modes.AXXIS100)
				.withPacket(testPacket)
				.build();

			expect(parser).to.be.an.instanceof(Parser);
			expect(parser.data.length).to.be.equal(16);
			expect(parser.meta[0][fields.serial]).to.be.equal(67);
			expect(parser.data[0][fields.childCount]).to.be.equal(100);

			expect(parser.meta[1][fields.serial]).not.to.exist;
			expect(parser.meta[1][fields.typeId]).to.be.equal(4);
			expect(parser.meta[1][fields.parentType]).to.be.equal(3);
			expect(parser.meta[1][fields.parentSerial]).to.be.equal(67);
			expect(parser.data[1][fields.delay]).to.be.equal(1500);

			//console.log(JSON.stringify(parser));
			let res = [];

			parser.results.forEach(item => {
				let model = UnitModelFactory(item.meta[typeId]);
				model
					.setObj("data", item.data)
					.setObj("meta", item.meta)
					.setPath()
					.build();
				res.push(model);
			});

			const finalRes = res.map(u => {
				return { data: u.data, [fields.counts]: u[fields.counts] };
			});
			console.log(JSON.stringify(finalRes, null, 2));
			//console.log(res);
		});
	});
});
