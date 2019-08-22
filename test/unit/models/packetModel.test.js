/* eslint-disable max-len */
/* eslint-disable no-unused-vars */
const chai = require("chai");
const expect = chai.expect;
chai.use(require("chai-match"));
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
				"The Object is missing properties - created, packetTemplate, packet"
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
			const packetTemplate = new PacketTemplate().incomingCommTemplate[3];

			const packetModel = new PacketModelData({
				packetTemplate,
				packet: "AAAA0C0300044040210ECAF6",
				created: Date.now(),
				pos: 0
			});

			expect(packetModel.data.command).to.be.equal(3);
			expect(packetModel.data.typeId).to.be.equal(1);
			expect(packetModel.data.data).to.deep.equal([1, 0, 1, 0, 1, 0, 1, 0]);
		});

		it("can fail a PacketModel with missing template arguments", async function() {
			const newPacket = () =>
				new PacketModelData({
					packetTemplate: null,
					packet: "AAAA0C0300044040210ECAF6",
					created: Date.now(),
					Pos: 0
				});
			expect(() => newPacket()).to.throw(Error, "Incorrect packet template object");
		});

		it("can fail a PacketModel with incorrect packet", async function() {
			let packetTemplate = new PacketTemplate().incomingCommTemplate[3];

			const newPacket = () =>
				new PacketModelData({
					packetTemplate: packetTemplate,
					packet: 109109809801098098,
					created: Date.now(),
					pos: 0
				});
			expect(() => newPacket()).to.throw(Error, "Packet must be an string");

			const newPacket2 = () =>
				new PacketModelData({
					packetTemplate: packetTemplate,
					created: Date.now(),
					pos: 0
				});
			expect(() => newPacket2()).to.throw(Error, "The Object is missing properties - packet");
		});

		it("can create a PacketModel with all required arguments  04 for pos=0", async function() {
			const packetTemplate = new PacketTemplate().incomingCommTemplate[4];

			const packetModel = new PacketModelList({
				packetTemplate,
				packet: "7f0da08302",
				created: Date.now(),
				pos: 1
			});

			expect(() => packetModel()).not.to.be.throw;
			expect(packetModel.data.command).to.be.equal(4);
			expect(packetModel.data.typeId).to.be.equal(4);
			expect(packetModel.data.serial).to.be.equal(2131599491);
			expect(packetModel.data.windowId).to.be.equal(2);
		});
	});
});

//
