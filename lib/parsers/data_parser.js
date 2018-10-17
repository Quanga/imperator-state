/**
 * Created by grant on 2016/08/23.
 */

function DataParser(commandConstant) {
	this.__constant = commandConstant;
}

var PacketUtils = require("../utils/packet_utils");

DataParser.prototype.parse = function($happn, splitPacket) {
	const { info, error } = $happn.log;
	var utils = new PacketUtils();

	var resultArr = [];

	let buildNodeDataAsync = async () => {
		try {
			info(":: data parser ::");

			//(packet, start, length, command, serial, data, crc, parent, parentType, pos)
			let result = await utils.createPacketResult(
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
			error("parsing error", err);
		}
	};
	return buildNodeDataAsync();
};

DataParser.prototype.buildNodeData = function($happn, parsedPacketArr) {
	const utils = new PacketUtils();
	const self = this;

	let resultArr = [];
	let bytePos = 0;

	const buildNodeDataAsync = async () => {
		try {
			for (const parsedPacket of parsedPacketArr) {
				let result = utils.createNodeResultObj();

				result.serial = parseInt(parsedPacket.serial, 2);
				utils.extractRawData(self.__constant, bytePos, parsedPacket, result);
				result.parent_serial = parseInt(parsedPacket.parentSerial, 2);
				result.type_id = self.__constant.data.first_byte.device_type;
				result.parent_type = self.__constant.data.first_byte.parent_type;

				resultArr.push(result);
				bytePos++;
			}
			return resultArr;
		} catch (err) {
			$happn.log.error("build nodedata error", err);
		}
	};
	return buildNodeDataAsync();
};

module.exports = DataParser;
