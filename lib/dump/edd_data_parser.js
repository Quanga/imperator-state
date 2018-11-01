/***
 * @summary COMMAND 04 parser - supplied the data inside the EDD - parent is the CBB it is attached to
 * @param $happn
 * @param commandConstant - command constant for 0b000000100
 */

function UidListParser() {
	const commTemplate = require("../constants/comm_templates");
	this.commTemplate = commTemplate.incomingCommTemplate[4];
}

UidListParser.prototype.parse = function($happn, splitPacket) {
	const { error: logError, info: logInfo } = $happn.log;
	const PacketUtils = require("../utils/packet_utils");
	const utils = new PacketUtils();
	let resultArr = [];

	let parseAsync = async () => {
		try {
			logInfo(":: EDD DATA PARSER ::");

			let payload = {
				packet: splitPacket.complete,
				start: splitPacket.start,
				length: splitPacket.length,
				command: splitPacket.command,
				serial: splitPacket.serial,
				data: null,
				crc: splitPacket.crc,
				parent: null,
				parentType: 0,
				position: null,
				data2: null,
				typeId: 3,
				led_state: 0
			};

			let parent = utils.createPacketResult(payload);
			parent.windowId = 0;

			resultArr.push(parent);

			// EDD List
			let eddUnits = splitPacket.data.match(/.{1,10}/g);

			for (let eddData of eddUnits) {
				let splitWindowData = utils.extractEddWindow(eddData);

				let payload = {
					packet: splitPacket.complete,
					start: splitPacket.start,
					length: splitPacket.length,
					command: splitPacket.command,
					serial: splitWindowData.ip,
					data: null,
					crc: splitPacket.crc,
					parent: splitPacket.serial,
					parentType: 3,
					position: splitWindowData.window,
					data2: null,
					typeId: 4,
					led_state: null
				};

				let result = utils.createPacketResult(payload);

				resultArr.push(result);
			}

			return resultArr;
		} catch (err) {
			logError("parsing error", err);
		}
	};
	return parseAsync();
};

UidListParser.prototype.buildNodeData = function($happn, parsedPacketArr) {
	const { error } = $happn.log;
	const { UnitModel } = require("../models/unitModels");

	const buildNodeDataAsync = async () => {
		let resultArr = [];
		let bytePos = 0;

		try {
			for (const parsedPacket of parsedPacketArr) {
				let result = new UnitModel();

				switch (bytePos) {
				case 0:
					result.serial = parseInt(parsedPacket.serial, 2);
					result.type_id = 3;
					result.parent_type = 0;
					result.window_id = parseInt(parsedPacket.windowId, 2); //update the window_id for a ping request to the number of nodes in the packet;
					break;
				default:
					result.type_id = this.__constant.data.first_byte.device_type;
					result.serial = parseInt(parsedPacket.serial, 2);
					result.parent_serial = parseInt(parsedPacketArr[0].serial, 2);
					result.parent_type = 3;
					result.window_id =
							parsedPacket.windowId != null
								? parseInt(parsedPacket.windowId, 2)
								: null;
				}

				resultArr.push(result);
				bytePos++;
			}
			// console.log(`RESULT from EDD list parser
			// ${JSON.stringify(resultArr, null, 2)}
			// `);
			return resultArr;
		} catch (err) {
			error("build nodedata error", err);
		}
	};

	return buildNodeDataAsync();
};

module.exports = UidListParser;
