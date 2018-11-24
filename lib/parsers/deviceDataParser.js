class DeviceListParser {
	constructor() {
		const PacketUtils = require("../utils/packet_utils");
		this.utils = new PacketUtils();
	}

	parse($happn, splitPacket) {
		const PacketModel = require("../models/packetModel");

		const { error: logError, info: logInfo } = $happn.log;
		logInfo(":: DEVICE DATA PARSER ::");

		let deviceTemplate = splitPacket.template;
		const { payload } = deviceTemplate;

		let resultArr = [];

		try {
			let parent = splitPacket;
			resultArr.push(parent);

			if (deviceTemplate.payload.secondary === null) {
				return resultArr;
			}

			if (splitPacket.rawData) {
				let chunkSize = new RegExp(`.{1,${payload.secondary.chunkSize}}`, "g");
				let childUnits = splitPacket.rawData.match(chunkSize);
				let bytePos = 1;

				for (let childData of childUnits) {
					let child = new PacketModel(
						splitPacket.template,
						childData,
						splitPacket.created,
						bytePos
					);
					child.command = splitPacket.command;
					if (child.typeId === 2) {
						child._serial = null;
						child._windowId = bytePos;
					}

					child.parentSerial = splitPacket.serial;
					resultArr.push(child);

					bytePos++;
				}
			}

			//console.log("DDP PROCESSED PACKET ARRAY", resultArr);

			return resultArr;
		} catch (err) {
			logError("parsing error", err);
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
		let deviceTemplate = parsedPacketArr[0].template;

		let resultArr = [];
		let bitTemplate;

		let nodePos = 0;
		try {
			for (const parsedPacket of parsedPacketArr) {
				bitTemplate =
					nodePos === 0
						? deviceTemplate.payload.primary.bitTemplate.bits
						: deviceTemplate.payload.secondary.bitTemplate.bits;

				const { serial, parentSerial } = parsedPacket;

				let result;
				switch (parsedPacket.typeId) {
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
					result = new CBoosterModel(serial, parsedPacket.parentSerial);
					result.data.led_state = parsedPacket.led_state;

					break;
				case 4:
					result = new EDDModel(serial, parentSerial);
					result.data.delay = parsedPacket.data2;
					result.data.window_id = parsedPacket.windowId;
					break;
				}

				await this.extractRawData(bitTemplate, parsedPacket, result);
				result.data.window_id = parsedPacket.windowId;
				result.meta.storedPacketDate = parsedPacket.created;

				resultArr.push(result);
				nodePos++;
			}

			//console.log("PROCESSED NODE ARRAY", JSON.stringify(resultArr, null, 2));

			return resultArr;
		} catch (err) {
			$happn.log.error("build nodedata error", err);
		}
	}

	async extractRawData(bitTemplate, parsedPacket, result) {
		try {
			if (parsedPacket.data.data !== null) {
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
