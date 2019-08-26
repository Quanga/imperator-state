/* eslint-disable max-len */
const { PacketModelList } = require("../models/packetModel.js");
const PacketValidation = require("./packetValidataion.js");

class DeviceListParser {
	constructor(packetTemplate) {
		this.packetTemplate = packetTemplate;
		this.packetValidataion = new PacketValidation();
	}

	parse(packetObject) {
		const { chunk } = this.packetTemplate;
		const { packet, createdAt } = packetObject;

		let resultArr = [];

		const validPacket = this.packetValidataion.validatePacket(packetObject, chunk);

		if (!validPacket) throw new Error(`Packet Validation Failed for ${packet}`);

		const { dataPackets, packetSerial } = validPacket;

		let parent = new PacketModelList({
			packetTemplate: this.packetTemplate,
			packetSerial: packetSerial,
			packet: null,
			createdAt: createdAt,
			pos: 0
		});

		resultArr.push(parent);

		if (!dataPackets) return resultArr;

		let bytePos = 1;

		for (let data of dataPackets) {
			let unit = new PacketModelList({
				packetTemplate: this.packetTemplate,
				packetSerial: packetSerial,
				packet: data,
				createdAt: createdAt,
				pos: bytePos
			});

			resultArr.push(unit);
			bytePos++;
		}

		return resultArr;
	}

	async buildNodeData(parsedPacketArr) {
		const { ControlUnitModel, SectionControlModel } = require("../models/unitModels");
		const { BoosterModel, CBoosterModel, EDDModel } = require("../models/unitModels");

		let resultArr = [];

		for (const parsedPacket of parsedPacketArr) {
			let result;
			const { serial, parentSerial, typeId } = parsedPacket.data;

			switch (typeId) {
			case 0:
				result = new ControlUnitModel(serial);
				break;
			case 1:
				result = new SectionControlModel(serial);
				break;
			case 2:
				result = new BoosterModel(serial, parentSerial);
				break;
			case 3:
				result = new CBoosterModel(serial);
				break;
			case 4:
				{
					const { windowId } = parsedPacket.data;
					result = new EDDModel(serial, parentSerial, windowId);
				}
				break;
			}

			result.dataType = "list";
			result.data.createdAt = parsedPacket.data.createdAt;

			await resultArr.push(result);
		}
		// log.info(
		// 	`LIST - Serial ${resultArr[0].data.serial} - type ${resultArr[0].data.typeId}- units ${resultArr.length}`
		// );

		return resultArr;
	}
}

module.exports = DeviceListParser;
