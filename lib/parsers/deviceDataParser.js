/* eslint-disable no-mixed-spaces-and-tabs */
const { PacketModelData } = require("../models/packetModel");
const PacketValidation = require("./packetValidataion");

class DeviceListParser {
	constructor(packetTemplate) {
		this.packetTemplate = packetTemplate;
		this.packetValidataion = new PacketValidation();
	}
	parse($happn, packetObject) {
		const { error: logError, info: logInfo } = $happn.log;
		const { chunk } = this.packetTemplate;
		const { packet, created } = packetObject;

		logInfo(":: DEVICE DATA PARSER ::");

		try {
			let resultArr = [];

			const validPacket = this.packetValidataion.validatePacket(
				packetObject,
				chunk
			);

			if (!validPacket) {
				logError(`Packet Validation Failed for ${packet}`);
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
			logError("parsing error", err);
			return Promise.reject(err);
		}
	}

	async buildNodeData($happn, parsedPacketArr) {
		const {
			ControlUnitModel,
			SectionControlModel,
			BoosterModel,
			CBoosterModel,
			EDDModel
		} = require("../models/unitModels");

		const deviceTemplate = parsedPacketArr[0].template;

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
					result = new ControlUnitModel(serial, parentSerial);
					break;
				case 1:
					result = new SectionControlModel(serial, parentSerial);
					break;
				case 2:
					result = new BoosterModel(null, parentSerial);
					break;
				case 3:
					result = new CBoosterModel(serial, parentSerial);
					//TODO - this may not work
					result.data.ledState = parsedPacket.data.ledState;
					result.data.childCount = parsedPacket.data.childCount;
					break;
				case 4:
					result = new EDDModel(serial, parentSerial);
					result.data.delay = parsedPacket.data.delay;
					result.data.windowId = parsedPacket.data.windowId;
					break;
				}

				result.dataType = "data";

				await this.extractRawData(bitTemplate, parsedPacket.data, result);
				//result.data.windowId = parsedPacket.data.windowId;
				//result.data.modified = parsedPacket.data.modified;
				result.meta.storedPacketDate = parsedPacket.data.created;

				resultArr.push(result);
				nodePos++;
			}

			//console.log("PROCESSED NODE ARRAY", JSON.stringify(resultArr, null, 2));

			return resultArr;
		} catch (err) {
			$happn.log.error("build nodedata error", err);
			return Promise.reject(err);
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

module.exports = DeviceListParser;
