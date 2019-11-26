/* eslint-disable max-len */
const chai = require("chai");
const expect = chai.expect;
chai.use(require("chai-match"));
var Parser = require("binary-parser").Parser;

describe("UNIT - Models", async function() {
	this.timeout(25000);
	process.env.NODE_ENV = "test";

	context("parser delete me when you fix this", async () => {
		it("it will parse an object", async () => {
			// Build an IP packet header Parser

			const dataParser = new Parser().string("items", {
				length: 5,
				stripNull: true,
				encoding: "hex",
				formatter: vars => {
					console.log(vars);
					return vars;
				},
			});

			const type3 = new Parser()
				.uint8("length")
				.string("crc", { length: 1, encoding: "hex" })
				.string("led", { length: 1, encoding: "hex" })
				.bit1("key1")
				.bit1("key2")
				.bit1("key3")
				.bit1("key4")
				.bit1("key5")
				.bit1("key6")
				.bit1("key7")
				.bit1("key8")
				.bit1("key9")
				.bit1("key10")
				.bit1("key11")
				.bit1("key12")
				.bit1("key13")
				.bit1("key14")
				.bit1("key15")
				.bit1("key16");

			const ipHeader = new Parser()
				.string("header", { length: 2, encoding: "hex", assert: "aaaa" })
				.uint8("totalLength")
				.uint8("command")
				.string("serial", { length: 2, encoding: "hex" })
				.choice("data", {
					tag: "command",
					choices: {
						1: dataParser,
						5: Parser.start()
							.nest("parent", {
								type: type3,
							})
							.array("chunks", {
								type: dataParser,
								lengthInBytes: vars => {
									return vars.totalLength - 16;
								},
								formatter: arr => {
									return arr.map(x => x.items);
								},
							}),
					},
					defaultChoice: 5,
				})
				.string("crc", { length: 2, stripNull: true, encoding: "hex" });
			// aaaa 48 05 0043 64008a21 1001dc05110140061201a4061301080714016c071501d00716013408170198081801fc08190160091a01c4091b01280a1c018c0a1d01f00a1e01540b8f97			// Prepare buffer to parse.
			var buf = Buffer.from(
				"aaaa4805004364008a211001dc05110140061201a4061301080714016c071501d00716013408170198081801fc08190160091a01c4091b01280a1c018c0a1d01f00a1e01540b8f97",
				"hex",
			);

			// Parse buffer and show result
			console.log(JSON.stringify(ipHeader.parse(buf)));
		});
	});
});
