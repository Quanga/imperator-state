/* eslint-disable max-len */
const { PacketModelList } = require("../models/packetModel.js");
const { unitTypes } = require("../constants/typeConstants");

class DeviceListParser {
	constructor(packetTemplate) {
		this.packetTemplate = packetTemplate;
	}

	parse(packetObject) {
		const { dataPackets, packetSerial, createdAt } = packetObject;

		let resultArr = [];

		let parent = new PacketModelList({
			packetTemplate: this.packetTemplate,
			packetSerial: packetSerial,
			packet: null,
			createdAt,
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
		const { EDDModel, CBoosterModel } = require("../models/unitModels");

		let resultArr = [];

		for (const parsedPacket of parsedPacketArr) {
			let result;
			const { serial, parentSerial, typeId, windowId } = parsedPacket.data;

			switch (typeId) {
			case unitTypes.BOOSTER_T2:
				result = new CBoosterModel(serial);
				break;

			case unitTypes.EDD:
				result = new EDDModel(serial, parentSerial, windowId, null);
				break;

			default:
				throw new Error(`Type - ${typeId} is not a list parser type`);
			}

			result.dataType = "list";
			result.data.createdAt = parsedPacket.data.createdAt;

			await resultArr.push(result);
		}

		return resultArr;
	}
}

module.exports = DeviceListParser;
