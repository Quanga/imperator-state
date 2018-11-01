/**
 * Created by grant on 2016/08/23.
 */

function DataListParser(commandConstant) {
	this.__constant = commandConstant;
}

const PacketUtils = require("../utils/packet_utils");

DataListParser.prototype.parse = function($happn, splitPacket) {
	const { info: logInfo, error: logError } = $happn.log;
	const utils = new PacketUtils();
	let resultArr = [];

	logInfo(":: 651 DATA PARSER ::");

	let parseAsync = async () => {
		try {
			let unit = 0;

			if (splitPacket.data == "") return resultArr;

			splitPacket.data.match(/.{1,4}/g).forEach(item => {
				let parentType = null;

				if (unit == 0) {
					parentType = this.__constant.data.first_byte.parent_type;
				} else {
					parentType = this.__constant.data.remaining_bytes.parent_type;
				}

				let payload = {
					packet: splitPacket.complete,
					start: splitPacket.start,
					length: splitPacket.length,
					command: splitPacket.command,
					serial: splitPacket.serial,
					data: item,
					crc: splitPacket.crc,
					parent: null,
					parentType: parentType,
					position: null,
					data2: null,
					typeId: 2,
					led_state: null
				};

				let resultItem = utils.createPacketResult(payload);

				if (
					resultItem.data.raw[0] == "1" ||
					resultItem.data.raw[1] == "1" ||
					resultItem.data.raw[2] == "1" ||
					resultItem.data.raw[3] == "1" ||
					resultItem.data.raw[4] == "1" ||
					resultItem.data.raw[5] == "1" ||
					resultItem.data.raw[6] == "1" ||
					resultItem.data.raw[7] == "1"
				) {
					resultArr.push(resultItem);
				} else {
					logInfo("Invalid data detected and ignored!");
				}

				unit++;
			});
			return resultArr;
		} catch (err) {
			logError("parsing error", err);
		}
	};

	return parseAsync();
};

DataListParser.prototype.buildNodeData = function($happn, parsedPacketArr) {
	const { error: logError } = $happn.log;
	const utils = new PacketUtils();
	const { UnitModel } = require("../models/unitModels");

	let resultArr = [];
	let bytePos = 0;

	const buildNodeDataAsync = async () => {
		try {
			for (const parsedPacket of parsedPacketArr) {
				let result = new UnitModel();

				switch (bytePos) {
				case 0:
					result.serial = parseInt(parsedPacket.serial, 2);
					result.type_id = 1;
					result.parent_type = 0;
					break;
				default:
					// NOTE: serial is unknown for the remaining bytes!
					result.type_id = 2;
					result.parent_type = 1;
					result.parent_serial = parseInt(parsedPacketArr[0].serial, 2);
				}

				utils.extractRawData(this.__constant, bytePos, parsedPacket, result);
				bytePos++;
				await resultArr.push(result);
			}

			return resultArr;
		} catch (err) {
			logError("build nodedata error", err);
		}
	};
	return buildNodeDataAsync();
};

module.exports = DataListParser;
