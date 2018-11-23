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
			if (!childUnits || childUnits.length < 1) {
				logError("NO CHILDREN IN LIST");
				return resultArr;
			}
			let bytePos = 1;

			for (let childData of childUnits) {
				let child = new PacketModel(
					splitPacket.template,
					childData,
					splitPacket.created,
					bytePos
				);
				child.parentSerial = splitPacket.serial;

				resultArr.push(child);

				bytePos++;
			}
			resultArr[0].windowId = bytePos - 1;

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

		let resultArr = [];
		try {
			for (const parsedPacket of parsedPacketArr) {
				let result;
				const { serial, parentSerial } = parsedPacket;

				switch (parsedPacket.typeId) {
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
					break;
				case 4:
					result = new EDDModel(serial, parentSerial);
					break;
				}

				result.data.window_id = parsedPacket.windowId;
				result.meta.storedPacketDate = parsedPacket.created;
				await resultArr.push(result);
			}
			//console.log("DATA LIST RESULT", JSON.stringify(resultArr, null, 2));

			return resultArr;
		} catch (err) {
			$happn.log.error("build nodedata error", err);
		}
	}
}

module.exports = DeviceListParser;
