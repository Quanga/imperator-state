/**
 * Created by grant on 2016/08/23.
 */

function DataListParser(commandConstant) {
	this.__constant = commandConstant;
}

DataListParser.prototype.parse = function($happn, splitPacket) {
	const PacketUtils = require("../utils/packet_utils");
	var utils = new PacketUtils();
	var resultArr = [];

	$happn.log.info(":: data list parser ::");

	let buildNodeDataAsync = async () => {
		try {
			var count = 1;

			if (splitPacket.data == "") return resultArr;

			splitPacket.data.match(/.{1,4}/g).forEach(item => {
				//packet, start, length, command, serial, data, crc, parent, parentType
				var parentType = null;

				if (count == 1) {
					parentType = this.__constant.data.first_byte.parent_type;
				} else {
					parentType = this.__constant.data.remaining_bytes.parent_type;
				}

				var resultItem = utils.createPacketResult(
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

				//const { command: rcommand, data: rdata } = resultItem;

				// $happn.log.info(
				// 	`CMD: ${resultItem.command} ID: ${resultItem.data.deviceId} raw:" ${
				// 		resultItem.data.raw
				// 	}`
				// );

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
					$happn.log.info("Invalid data detected and ignored!");
				}

				count++;
			});
			//$happn.log.info(">>> PARSED DATA LIST: " + JSON.stringify(resultArr));
			return resultArr;
		} catch (err) {
			$happn.log.error("parsing error", err);
		}
	};

	return buildNodeDataAsync();
};

DataListParser.prototype.buildNodeData = function($happn, parsedPacketArr) {
	const PacketUtils = require("../utils/packet_utils");
	const utils = new PacketUtils();

	var resultArr = [];
	var bytePos = 0;

	let buildNodeDataAsync = async () => {
		try {
			for (const parsedPacket of parsedPacketArr) {
				var result = utils.createNodeResultObj();
				//$happn.log.info("result---- ", result);

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
					result.parent_type = this.__constant.data.remaining_bytes.parent_type;
					break;
				}

				utils.extractRawData(this.__constant, bytePos, parsedPacket, result);

				await resultArr.push(result);
				bytePos++;
			}
			//$happn.log.info("resultarray ", resultArr);

			return resultArr;
		} catch (err) {
			$happn.log.error("build nodedata error", err);
		}
	};
	return buildNodeDataAsync();
};

module.exports = DataListParser;
