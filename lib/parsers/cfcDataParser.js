/* eslint-disable max-len */
/* eslint-disable no-mixed-spaces-and-tabs */
const PacketValidation = require("./packetValidataion");

class CfcDataParser {
	constructor(packetTemplate) {
		this.packetTemplate = packetTemplate;
		this.packetValidataion = new PacketValidation();
	}

	async parse(packetObject) {
		return [];
	}

	async buildNodeData(parsedPacketArr) {
		const { ControlUnitModel, SectionControlModel } = require("../models/unitModels");
		const { BoosterModel, CBoosterModel, EDDModel } = require("../models/unitModels");
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
			case 0:
				result = new ControlUnitModel(serial);
				break;
			case 1:
				result = new SectionControlModel(serial);
				break;
			case 2:
				result = new BoosterModel(null, parentSerial);
				break;
			case 3:
				{
					const { ledState, childCount } = parsedPacket.data;
					result = new CBoosterModel(serial, ledState, childCount);
				}
				break;
			case 4:
				{
					const { delay, windowId } = parsedPacket.data;
					result = new EDDModel(serial, parentSerial, windowId, delay);
				}
				break;
			}

			result.dataType = "data";

			await this.extractRawData(bitTemplate, parsedPacket.data, result);
			result.data.createdAt = parsedPacket.data.createdAt;

			resultArr.push(result);
			nodePos++;
		}

		// log.info(
		// 	`DATA - Serial ${resultArr[0].data.serial} - type ${resultArr[0].data.typeId}- units ${resultArr.length}`
		// );
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

module.exports = CfcDataParser;
