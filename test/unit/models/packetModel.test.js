const chai = require("chai");
const expect = chai.expect;
chai.use(require("chai-match"));
const sinon = require("sinon");
const sinonChai = require("sinon-chai");
const chaiPromise = require("chai-as-promised");

chai.use(sinonChai);
chai.use(chaiPromise);

const { PacketModelData, PacketModelList } = require("../../../lib/models/packetModel");
const PacketTemplate = require("../../../lib/constants/packetTemplates");

describe("UNIT - Models", async function() {
	context("PacketModel", async () => {
		it("cannot create without an object or with more args", async function() {
			expect(() => new PacketModelData()).to.throw(
				Error,
				"An object must be supplied, received null or undefined"
			);

			let packetTemplate = new PacketTemplate().incomingCommTemplate[3];
			const wrongPacket1 = () =>
				new PacketModelData(packetTemplate, "AAAA0C0300044040210ECAF6", Date.now(), "2");
			expect(() => wrongPacket1()).to.throw(
				Error,
				"The Object is missing properties - pos, created, packetSerial"
			);

			const rightPacket = () =>
				new PacketModelData({
					packetTemplate,
					pos: 1,
					created: 123123,
					packetSerial: "04",
					packet: "AAAA0C0300044040210ECAF6"
				});

			expect(() => rightPacket()).not.to.throw();
		});

		it("can create a PacketModel with all required arguments for pos=0", async function() {
			//let packet = { created: Date.now(), message: "AAAA0C0300044040210ECAF6" };
			let packetTemplate = new PacketTemplate().incomingCommTemplate[3];

			let packetModel = new PacketModelData({
				packetTemplate: packetTemplate,
				packet: "AAAA0C0300044040210ECAF6",
				created: Date.now(),
				pos: 0
			});

			expect(packetModel.data.command).to.be.equal(3);
			expect(packetModel.data.typeId).to.be(1);
			expect(packetModel.data.data).to.deep.equal([1, 0, 1, 0, 1, 0, 1, 0]);
		});

		it("can fail a PacketModel with missing template arguments", async function() {
			const newPacket = () =>
				new PacketModelData({
					packet: "AAAA0C0300044040210ECAF6",
					created: Date.now(),
					Pos: 0
				});
			assert.throws(newPacket, Error, "packetTemplate is not provided");
		});

		it("can fail a PacketModel with incorrect packet", async function() {
			try {
				let packetTemplate = new PacketTemplate().incomingCommTemplate[3];

				const newPacket = () =>
					new PacketModelData({
						packetTemplate: packetTemplate,
						packet: 109109809801098098,
						created: Date.now(),
						pos: 0
					});
				assert.throws(newPacket, Error, "packet format is missing or not a string");

				const newPacket2 = () =>
					new PacketModelData({
						packetTemplate: packetTemplate,
						created: Date.now(),
						pos: 0
					});
				assert.throws(newPacket2, Error, "packet format is missing or not a string");
			} catch (error) {
				return Promise.reject(error);
			}
		});
	});
});
