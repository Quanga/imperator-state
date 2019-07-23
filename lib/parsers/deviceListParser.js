const { PacketModelList } = require("../models/packetModel.js");
const PacketValidation = require("./packetValidataion.js");

class DeviceListParser {
	constructor(packetTemplate) {
		this.packetTemplate = packetTemplate;
		this.packetValidataion = new PacketValidation();
	}

	parse($happn, packetObject) {
		const { log } = $happn;
		const { chunk } = this.packetTemplate;
		const { packet, created } = packetObject;

		//logInfo(":: DEVICE LIST PARSER ::");

		let resultArr = [];

		try {
			const validPacket = this.packetValidataion.validatePacket(packetObject, chunk);

			if (!validPacket) {
				log.error(`Packet Validation Failed for ${packet}`);
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

			return resultArr;
		} catch (err) {
			log.error("parsing error", err);
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

		try {
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
				result.data.created = parsedPacket.data.created;
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
