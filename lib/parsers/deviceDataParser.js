/* eslint-disable max-len */
/* eslint-disable no-mixed-spaces-and-tabs */
const { PacketModelData } = require("../models/packetModel");
const PacketValidation = require("./packetValidataion");

class DeviceDataParser {
	constructor(packetTemplate) {
		this.packetTemplate = packetTemplate;
		this.packetValidataion = new PacketValidation();
	}
	parse($happn, packetObject) {
		const { log } = $happn;
		const { chunk } = this.packetTemplate;
		const { packet, created } = packetObject;

		try {
			let resultArr = [];

			const validPacket = this.packetValidataion.validatePacket(packetObject, chunk);

			if (!validPacket) {
				log.error(`Packet Validation Failed for ${packet}`);
				return resultArr;
			}

			const { dataPackets, packetSerial } = validPacket;

			let childData = [];
			let parent = null;

			if (this.packetTemplate.packetType === "mixed") {
				childData = dataPackets.slice(1);

				parent = new PacketModelData({
					packetTemplate: this.packetTemplate,
					packetSerial: packetSerial,
					packet: dataPackets[0],
					created: created,
					pos: 0
				});
			} else {
				childData = dataPackets;
				parent = new PacketModelData({
					packetTemplate: this.packetTemplate,
					packetSerial: packetSerial,
					packet: null,
					created: created,
					pos: 0
				});
			}

			resultArr.push(parent);

			let bytePos = 1;

			for (let data of childData) {
				let unit = new PacketModelData({
					packetTemplate: this.packetTemplate,
					packetSerial: packetSerial,
					packet: data,
					created: created,
					pos: bytePos
				});

				resultArr.push(unit);
				bytePos++;
			}

			return resultArr;
		} catch (err) {
			log.error("parsing error", err);
		}
	}

	async buildNodeData($happn, parsedPacketArr) {
		const { ControlUnitModel, SectionControlModel } = require("../models/unitModels");
		const { BoosterModel, CBoosterModel, EDDModel } = require("../models/unitModels");
		const deviceTemplate = parsedPacketArr[0].template;
		const { log } = $happn;

		let resultArr = [];
		let bitTemplate;

		let nodePos = 0;
		try {
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
				result.data.created = parsedPacket.data.created;

				resultArr.push(result);
				nodePos++;
			}

			log.info(
				`DATA - Serial ${resultArr[0].data.serial} - type ${resultArr[0].data.typeId}- units ${resultArr.length}`
			);
			return resultArr;
		} catch (err) {
			log.error("build nodedata error", err);
		}
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
