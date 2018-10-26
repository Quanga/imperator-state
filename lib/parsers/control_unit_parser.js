/***
 * @summary Parser which handles incoming communication for the Control Unit
 * @param commandConstant - incoming command
 * @param splitPacket - initial parse phase incoming data
 * @param parsedPacketArr - second phase parsed packet array of data is converted to a unit
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
			info(":: CONTROL UNIT PARSER ::");

			let payload = {
				packet: splitPacket.complete,
				start: splitPacket.start,
				length: splitPacket.length,
				command: splitPacket.command,
				serial: splitPacket.serial,
				data: splitPacket.data,
				crc: splitPacket.crc,
				parent: splitPacket.serial,
				parentType: this.__constant.serial_type,
				position: null,
				data2: null,
				typeId: 0,
				led_state: 0
			};

			let result = await utils.createPacketResult(payload);

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
				//console.log("result from CCB -", JSON.stringify(resultArr, null, 2));
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
