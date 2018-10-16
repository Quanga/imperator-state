/**
 * Created by grant on 2016/08/23.
 */

function DataListParser(commandConstant) {
	this.__constant = commandConstant;
}

DataListParser.prototype.parse = function($happn, splitPacket) {
	const { info, error } = $happn.log;
	const PacketUtils = require("../utils/packet_utils");
	const utils = new PacketUtils();

	let buildNodeDataAsync = async () => {
		try {
			info("CBB DATA LIST");

			let resultArr = [];
			let count = 1;

			let dataMatch = splitPacket.data.match(/.{1,8}/g);
			//console.log("datamatch", JSON.stringify(dataMatch, null, 2));
			for (const item of dataMatch) {
				//packet, start, length, command, serial, data, crc, parent, parentType, pos, delay
				let parentType = null;
				if (count === 1) {
					let splitDataDelayWindow = utils.extractCbbData(item);

					parentType = this.__constant.data.first_byte.parent_type;
					let result = utils.createPacketResult(
						splitPacket.complete,
						splitPacket.start,
						splitPacket.length,
						splitPacket.command,
						splitPacket.serial,
						splitDataDelayWindow.cbbData,
						splitPacket.crc,
						null,
						parentType,
						splitDataDelayWindow.window,
						splitDataDelayWindow.crc,
						1
					);
					resultArr.push(result);
					//console.log("CBB extract", JSON.stringify(result, null, 2));
				} else {
					let splitDataDelayWindow = utils.extractEddData(item);

					parentType = this.__constant.data.remaining_bytes.parent_type;
					let result = utils.createPacketResult(
						splitPacket.complete,
						splitPacket.start,
						splitPacket.length,
						splitPacket.command,
						splitPacket.serial,
						splitDataDelayWindow.eddData,
						splitPacket.crc,
						null,
						parentType,
						splitDataDelayWindow.window,
						splitDataDelayWindow.delay
					);
					await resultArr.push(result);
					//console.log("EDD extract", JSON.stringify(result, null, 2));
				}
				count++;
			}
			return resultArr;
		} catch (err) {
			error("parsing error", err);
		}
	};
	return buildNodeDataAsync();
};

DataListParser.prototype.buildNodeData = function($happn, parsedPacketArr) {
	const PacketUtils = require("../utils/packet_utils");
	const utils = new PacketUtils();

	let resultArr = [];
	let bytePos = 0;

	let buildNodeDataAsync = async () => {
		try {
			for (const parsedPacket of parsedPacketArr) {
				let result = utils.createNodeResultObj();

				switch (bytePos) {
				case 0:
					result.serial = parseInt(parsedPacket.serial, 2);
					result.type_id = this.__constant.data.first_byte.device_type;
					result.parent_type = this.__constant.data.first_byte.parent_type;
					result.window_id = parseInt(parsedPacket.windowId, 2);
					result.led_state = parseInt(parsedPacket.led_state, 2);
					result.crc = parseInt(parsedPacket.data2, 2);
					break;
				default:
					// NOTE: serial is unknown for the remaining bytes!
					result.type_id = this.__constant.data.remaining_bytes.device_type;
					result.parent_serial = parseInt(parsedPacketArr[0].serial, 2);
					result.delay = utils.reverseSerialBytes(
						parseInt(parsedPacket.data2, 2)
					);
					result.parent_type = this.__constant.data.remaining_bytes.parent_type;
					result.window_id = parseInt(parsedPacket.windowId, 2);
				}
				utils.extractRawData(this.__constant, bytePos, parsedPacket, result);
				resultArr.push(result);
				bytePos++;
			}
			// console.log(`RESULT from uid data list parser
			// ${JSON.stringify(resultArr, null, 2)}
			// `);
			return resultArr;
		} catch (err) {
			$happn.log.error("build nodedata error", err);
		}
	};

	return buildNodeDataAsync();
};

module.exports = DataListParser;
