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

			let chunkSize = new RegExp(`.{1,${payload.secondary.chunkSize}}`, "g");

			let childUnits = splitPacket.rawData.match(chunkSize);
			let bytePos = 1;

			for (let childData of childUnits) {
				//let splitWindowData = this.utils.extractEddWindow(childData);
				let child = new PacketModel(splitPacket.template, childData, bytePos);
				child.parentSerial = splitPacket.serial;
				resultArr.push(child);
				bytePos++;
			}

			//console.log("PROCESSED PACKET ARRAY", JSON.stringify(resultArr, null, 2));

			return resultArr;
		} catch (err) {
			logError("parsing error", err);
		}
	}

	async buildNodeData($happn, parsedPacketArr) {
		const { UnitModel } = require("../models/unitModels");
		let deviceTemplate = parsedPacketArr[0].template;

		let resultArr = [];
		let bitTemplate;

		let nodePos = 0;
		try {
			for (const parsedPacket of parsedPacketArr) {
				let result = new UnitModel();
				if (nodePos === 0) {
					bitTemplate = deviceTemplate.payload.primary.bitTemplate.bits;
				} else {
					bitTemplate = deviceTemplate.payload.secondary.bitTemplate.bits;
				}

				result.type_id = parsedPacket.typeId;
				result.parent_type = parsedPacket.parentType;
				result.parent_serial = parsedPacket.parentSerial;

				if (parsedPacket.typeId === 2) {
					result.serial = null;
				} else {
					result.serial = parsedPacket.serial;
				}

				if (result.type_id === 4) {
					result.delay = parsedPacket.data2;
					result.window_id = parsedPacket.windowId;
				}

				this.utils.extractRawData(bitTemplate, parsedPacket, result);

				resultArr.push(result);
				nodePos++;
			}
			//console.log("PROCESSED NODE ARRAY", JSON.stringify(resultArr, null, 2));

			return resultArr;
		} catch (err) {
			$happn.log.error("build nodedata error", err);
		}
	}
}

module.exports = DeviceListParser;
