class DeviceListParser {
	constructor() {
		const PacketUtils = require("../utils/packet_utils");
		this.utils = new PacketUtils();
	}

	parse($happn, splitPacket) {
		const PacketModel = require("../models/packetModel");
		const { payload } = splitPacket.template;

		const { error: logError, info: logInfo } = $happn.log;
		logInfo(":: DEVICE LIST PARSER ::");

		let resultArr = [];

		try {
			let parent = splitPacket;
			resultArr.push(parent);

			if (payload.child != null) {
				return resultArr;
			}

			let chunkSize = new RegExp(`.{1,${payload.secondary.chunkSize}}`, "g");
			let childUnits = splitPacket.rawData.match(chunkSize);
			let bytePos = 1;

			for (let childData of childUnits) {
				let child = new PacketModel(splitPacket.template, childData, bytePos);
				child.parentSerial = splitPacket.serial;

				resultArr.push(child);
				bytePos++;
			}
			//console.log("---------resultArr-------", resultArr);
			resultArr[0].windowId = bytePos;

			return resultArr;
		} catch (err) {
			logError("parsing error", err);
		}
	}

	async buildNodeData($happn, parsedPacketArr) {
		const { UnitModel } = require("../models/unitModels");

		let resultArr = [];
		let bytePos = 0;
		try {
			for (const parsedPacket of parsedPacketArr) {
				let result = new UnitModel();

				switch (bytePos) {
				case 0:
					result.type_id = parsedPacket.typeId;
					result.serial = parsedPacket.serial;
					result.parent_type = parsedPacket.typeId;
					result.window_id = parsedPacket.windowId; //update the window_id for a ping request to the number of nodes in the packet;
					break;
				default:
					result.type_id = parsedPacket.typeId;
					result.serial = parsedPacket.serial;
					result.parent_serial = parsedPacket.parentSerial;
					result.parent_type = parsedPacket.parentType;
					result.window_id =
							parsedPacket.windowId != null ? parsedPacket.windowId : null;
				}
				bytePos++;

				await resultArr.push(result);
			}
			console.log("DATA LIST RESULT", JSON.stringify(resultArr, null, 2));

			return resultArr;
		} catch (err) {
			$happn.log.error("build nodedata error", err);
		}
	}
}

module.exports = DeviceListParser;
