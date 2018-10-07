/**
 * Created by grant on 2016/08/23.
 */

function DataParser(commandConstant) {
	this.__constant = commandConstant;
}

DataParser.prototype.parse = function($happn, splitPacket) {
	var PacketUtils = require("../utils/packet_utils");
	var utils = new PacketUtils();

	var resultArr = [];

	let buildNodeDataAsync = async () => {
		try {
			$happn.log.info(":: data parser ::");

			//(packet, start, length, command, serial, data, crc, parent, parentType, pos)
			var result = utils.createPacketResult(
				splitPacket.complete,
				splitPacket.start,
				splitPacket.length,
				splitPacket.command,
				splitPacket.serial,
				splitPacket.data,
				splitPacket.crc,
				splitPacket.serial,
				this.__constant.serial_type
			);

			resultArr.push(result);
			return resultArr;
		} catch (err) {
			$happn.log.error("parsing error", err);
		}
	};
	return buildNodeDataAsync();
};

DataParser.prototype.buildNodeData = function($happn, parsedPacketArr) {
	var PacketUtils = require("../utils/packet_utils");
	var utils = new PacketUtils();

	var resultArr = [];
	var bytePos = 0;

	let buildNodeDataAsync = async () => {
		try {
			for (const parsedPacket of parsedPacketArr) {
				let result = utils.createNodeResultObj();

				result.serial = parseInt(parsedPacket.serial, 2);
				utils.extractRawData(this.__constant, bytePos, parsedPacket, result);
				result.parent_serial = parseInt(parsedPacket.parentSerial, 2);
				result.type_id = this.__constant.data.first_byte.device_type;
				result.parent_type = this.__constant.data.first_byte.parent_type;

				await resultArr.push(result);
				bytePos++;
			}
			//$happn.log.info(">>> PARSED DATA : " + JSON.stringify(resultArr));

			return resultArr;
		} catch (err) {
			$happn.log.error("build nodedata error", err);
		}
	};
	return buildNodeDataAsync();
};

module.exports = DataParser;
