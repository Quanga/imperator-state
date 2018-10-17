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

	logInfo(":: data list parser ::");

	let buildNodeDataAsync = async () => {
		try {
			let count = 1;

			if (splitPacket.data == "") return resultArr;

			splitPacket.data.match(/.{1,4}/g).forEach(item => {
				//packet, start, length, command, serial, data, crc, parent, parentType
				let parentType = null;

				if (count == 1) {
					parentType = this.__constant.data.first_byte.parent_type;
				} else {
					parentType = this.__constant.data.remaining_bytes.parent_type;
				}

				let resultItem = utils.createPacketResult(
					splitPacket.complete,
					splitPacket.start,
					splitPacket.length,
					splitPacket.command,
					splitPacket.serial,
					item,
					splitPacket.crc,
					null,
					parentType
				);

				const {
					command: resCommand,
					data: resData,
					windowId: resWindowId
				} = resultItem;

				logInfo(
					`CMD: ${resCommand} 
					WindowId: ${resWindowId}
					ID: ${resData.deviceId} 
					raw:" ${resData.raw}`
				);

				if (
					resData.raw[0] == "1" ||
					resData.raw[1] == "1" ||
					resData.raw[2] == "1" ||
					resData.raw[3] == "1" ||
					resData.raw[4] == "1" ||
					resData.raw[5] == "1" ||
					resData.raw[6] == "1" ||
					resData.raw[7] == "1"
				) {
					resultArr.push(resultItem);
				} else {
					logInfo("Invalid data detected and ignored!");
				}

				count++;
			});
			return resultArr;
		} catch (err) {
			logError("parsing error", err);
		}
	};

	return buildNodeDataAsync();
};

DataListParser.prototype.buildNodeData = function($happn, parsedPacketArr) {
	const { error: logError } = $happn.log;
	const utils = new PacketUtils();

	let resultArr = [];
	let bytePos = 0;

	const buildNodeDataAsync = async () => {
		try {
			for (const parsedPacket of parsedPacketArr) {
				let result = utils.createNodeResultObj();

				switch (bytePos) {
				case 0:
					result.serial = parseInt(parsedPacket.serial, 2);
					result.type_id = this.__constant.data.first_byte.device_type;
					result.parent_type = this.__constant.data.first_byte.parent_type;
					break;
				default:
					// NOTE: serial is unknown for the remaining bytes!
					result.type_id = this.__constant.data.remaining_bytes.device_type;
					result.parent_serial = parseInt(parsedPacketArr[0].serial, 2);
					result.parent_type = parseInt(
						this.__constant.data.remaining_bytes.parent_type,
						2
					);
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
