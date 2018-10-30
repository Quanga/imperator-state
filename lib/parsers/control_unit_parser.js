/***
 * @summary Parser which handles incoming communication for the Control Unit
 * @param commandConstant - incoming command
 * @param splitPacket - initial parse phase incoming data
 * @param parsedPacketArr - second phase parsed packet array of data is converted to a unit
 */

function DataParser() {
	const commTemplate = require("../constants/comm_templates");
	this.commTemplate = commTemplate.incomingCommTemplate[8];
}

const PacketUtils = require("../utils/packet_utils");

DataParser.prototype.parse = function($happn, splitPacket) {
	const { info, error } = $happn.log;
	const utils = new PacketUtils();

	let resultArr = [];

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
				parentType: null,
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
	const { UnitModel } = require("../models/unitModels");
	const utils = new PacketUtils();

	let resultArr = [];
	let bytePos = 0;

	const buildNodeDataAsync = async () => {
		try {
			for (const parsedPacket of parsedPacketArr) {
				let result = new UnitModel();

				result.serial = parseInt(parsedPacket.serial, 2);
				utils.extractRawData(this.__constant, bytePos, parsedPacket, result);
				result.parent_serial = parseInt(parsedPacket.parentSerial, 2);
				result.type_id = this.__constant.data.first_byte.device_type;
				result.parent_type = this.__constant.data.first_byte.parent_type;

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
