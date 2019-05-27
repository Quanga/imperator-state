const { PacketModelList } = require("../models/packetModel.js");
const PacketValidation = require("./packetValidataion.js");

class DeviceListParser {
	constructor(packetTemplate) {
		this.packetTemplate = packetTemplate;
		this.packetValidataion = new PacketValidation();
	}

	parse($happn, packetObject) {
		const { error: logError, info: logInfo } = $happn.log;
		const { chunk } = this.packetTemplate;
		const { packet, created } = packetObject;

		logInfo(":: DEVICE LIST PARSER ::");

		let resultArr = [];

		try {
			const validPacket = this.packetValidataion.validatePacket(
				packetObject,
				chunk
			);

			if (!validPacket) {
				logError(`Packet Validation Failed for ${packet}`);
				return resultArr;
			}

			const { dataPackets, packetSerial } = validPacket;

			let parent = new PacketModelList({
				packetTemplate: this.packetTemplate,
				packetSerial: packetSerial,
				packet: null,
				created: created,
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
					created: created,
					pos: bytePos
				});

				resultArr.push(unit);
				bytePos++;
			}

			if (this.packetTemplate.packetType === "mixed") {
				resultArr[0].data.loadCount = bytePos - 1;
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

		let resultArr = [];
		try {
			for (const parsedPacket of parsedPacketArr) {
				let result;
				const { serial, parentSerial } = parsedPacket.data;

				switch (parsedPacket.data.typeId) {
				case 0:
					result = new ControlUnitModel(serial, parentSerial);
					break;
				case 1:
					result = new SectionControlModel(serial, parentSerial);
					break;
				case 2:
					result = new BoosterModel(serial, parentSerial);
					break;
				case 3:
					result = new CBoosterModel(serial, parentSerial);
					result.data.loadCount.push(parsedPacket.data.loadCount);
					break;
				case 4:
					result = new EDDModel(serial, parentSerial);
					result.data.windowId = parsedPacket.data.windowId;
					break;
				}

				result.dataType = "list";
				result.meta.storedPacketDate = parsedPacket.data.created;
				await resultArr.push(result);
			}

			return resultArr;
		} catch (err) {
			$happn.log.error("build nodedata error", err);
			return Promise.reject(err);
		}
	}
}

module.exports = DeviceListParser;
