/* eslint-disable max-len */
/* eslint-disable no-mixed-spaces-and-tabs */
const { PacketModelData } = require("../models/packetModel");
const { unitTypes } = require("../constants/typeConstants");

class DeviceDataParser {
	constructor(packetTemplate) {
		this.packetTemplate = packetTemplate;
	}

	async parse(packetObject) {
		const { dataPackets, packetSerial, createdAt } = packetObject;

		let resultArr = [];
		let childData = [];
		let parent = null;

		if (this.packetTemplate.packetType === "mixed") {
			childData = dataPackets.slice(1);

			parent = new PacketModelData({
				packetTemplate: this.packetTemplate,
				packetSerial,
				packet: dataPackets[0],
				createdAt,
				pos: 0
			});
		} else {
			childData = dataPackets;
			parent = new PacketModelData({
				packetTemplate: this.packetTemplate,
				packetSerial,
				packet: null,
				createdAt,
				pos: 0
			});
		}

		resultArr.push(parent);

		let bytePos = 1;

		for (let data of childData) {
			let unit = new PacketModelData({
				packetTemplate: this.packetTemplate,
				packetSerial,
				packet: data,
				createdAt,
				pos: bytePos
			});

			resultArr.push(unit);
			bytePos++;
		}

		return resultArr;
	}

	async buildNodeData(parsedPacketArr) {
		const { ControlUnitModel, SectionControlModel } = require("../models/unitModels");
		const { BoosterModel, CBoosterModel, EDDModel, CFCModel } = require("../models/unitModels");
		const deviceTemplate = parsedPacketArr[0].template;

		let resultArr = [];
		let bitTemplate;

		let nodePos = 0;

		for (const parsedPacket of parsedPacketArr) {
			bitTemplate =
				nodePos === 0
					? deviceTemplate.payload.primary.bitTemplate.bits
					: deviceTemplate.payload.secondary.bitTemplate.bits;

			const { serial, parentSerial } = parsedPacket.data;
			let result;

			switch (parsedPacket.data.typeId) {
			case unitTypes.CONTROL_UNIT:
				result = new ControlUnitModel(serial);
				break;

			case unitTypes.SECTION_CONTROLLER:
				result = new SectionControlModel(serial);
				break;

			case unitTypes.BOOSTER_T1:
				result = new BoosterModel(null, parentSerial);
				break;

			case unitTypes.BOOSTER_T2:
				{
					const { ledState, childCount } = parsedPacket.data;
					result = new CBoosterModel(serial, ledState, childCount);
				}
				break;

			case unitTypes.EDD:
				{
					const { delay, windowId } = parsedPacket.data;
					result = new EDDModel(serial, parentSerial, windowId, delay);
				}
				break;

			case unitTypes.CFC:
				{
					const { qos, qosFiring, firmware } = parsedPacket.data;
					result = new CFCModel(serial, qos, qosFiring, firmware);
				}
				break;
			}

			result.dataType = "data";

			await this.extractRawData(bitTemplate, parsedPacket.data, result);
			result.data.createdAt = parsedPacket.data.createdAt;

			resultArr.push(result);
			nodePos++;
		}

		return resultArr;
	}

	async extractRawData(bitTemplate, parsedPacket, result) {
		try {
			if (!parsedPacket.data) {
				return result;
			}

			if (parsedPacket.data !== null) {
				for (let bitKey in bitTemplate) {
					if (result.data.hasOwnProperty(bitKey)) {
						let currentBit = bitTemplate[bitKey];

						let parsedData = parsedPacket.data[currentBit.index];
						if (parsedData !== null) {
							result.data[bitKey] = parsedData;
						}
					}
				}
			}
		} catch (err) {
			return Promise.reject(err);
		}
	}
}

module.exports = DeviceDataParser;
