const PacketModel = require('../../../lib/models/packetModel');
const PacketTemplate = require("../../../lib/constants/packetTemplates");
const assert = require('assert');

describe('PacketModel Tests', async function () {

	it('cannot create without an object or with more args', async function () {
		try {
			let packetTemplate = new PacketTemplate().incomingCommTemplate[3];

			const newPacket = () => new PacketModel();
			assert.throws(newPacket, Error, "options must be an supplied");

			const newPacket2 = () => new PacketModel(packetTemplate, "AAAA0C0300044040210ECAF6", Date.now(), "2");
			assert.throws(newPacket2, Error, "only one argument object to be supplied");

		} catch (error) {
			return Promise.reject(error);
		}
	});
	//constructor(packetTemplate, packet, created, pos)
	it('can create a PacketModel with all required arguments for pos=0', async function () {
		try {
			//let packet = { created: Date.now(), message: "AAAA0C0300044040210ECAF6" };
			let packetTemplate = new PacketTemplate().incomingCommTemplate[3];

			let packetModel = await new PacketModel({
				packetTemplate: packetTemplate,
				packet: "AAAA0C0300044040210ECAF6",
				created: Date.now(),
				pos: 0
			});

			assert.equal(packetModel.command, 3);
			assert.equal(packetModel.typeId, 1);
			assert.deepEqual(packetModel.data, [0, 1, 0, 0, 0, 0, 0, 0]);

		} catch (error) {
			return Promise.reject(error);
		}
	});

	it('can fail a PacketModel with missing template arguments', async function () {
		try {
			const newPacket = () => new PacketModel({
				packet: "AAAA0C0300044040210ECAF6",
				created: Date.now(),
				Pos: 0
			});
			assert.throws(newPacket, Error, "packetTemplate is not provided");

		} catch (error) {
			return Promise.reject(error);
		}
	});

	it('can fail a PacketModel with incorrect pos arguments', async function () {
		try {
			let packetTemplate = new PacketTemplate().incomingCommTemplate[3];

			const newPacket = () => new PacketModel({
				packetTemplate: packetTemplate,
				packet: "AAAA0C0300044040210ECAF6",
				created: Date.now()
			});
			assert.throws(newPacket, Error, "no position reference provided");

			const newPacket2 = () => new PacketModel({
				packetTemplate: packetTemplate,
				packet: "AAAA0C0300044040210ECAF6",
				created: Date.now(),
				pos: "2"
			});
			assert.throws(newPacket2, Error, "no position reference provided");

		} catch (error) {
			return Promise.reject(error);
		}
	});

	it('can fail a PacketModel with incorrect packet', async function () {
		try {
			let packetTemplate = new PacketTemplate().incomingCommTemplate[3];

			const newPacket = () => new PacketModel({
				packetTemplate: packetTemplate,
				packet: 109109809801098098,
				created: Date.now(),
				pos: 0
			});
			assert.throws(newPacket, Error, "packet format is missing or not a string");

			const newPacket2 = () => new PacketModel({
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