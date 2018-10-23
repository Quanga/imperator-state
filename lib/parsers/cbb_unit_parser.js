/***
 * @summary COMMAND 05 parser - supplied the data inside the EDD - parent is the CBB it is attached to
 * @param $happn
 * @param commandConstant - command constant for 0b000000101
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
			let unit = 1;

			let dataUnits = splitPacket.data.match(/.{1,8}/g);

			for (const item of dataUnits) {
				if (unit === 1) {
					let splitDataDelayWindow = utils.extractCbbData(item);

					let payload = {
						packet: splitPacket.complete,
						start: splitPacket.start,
						length: splitPacket.length,
						command: splitPacket.command,
						serial: splitPacket.serial,
						data: splitDataDelayWindow.cbbData,
						crc: splitPacket.crc,
						parent: null,
						parentType: parseInt(
							this.__constant.data.first_byte.parent_type,
							2
						),
						position: splitDataDelayWindow.window,
						data2: splitDataDelayWindow.crc,
						typeId: 3,
						led_state: 0
					};
					let result = utils.createPacketResult(payload);

					resultArr.push(result);
				} else {
					let splitDataDelayWindow = utils.extractEddData(item);

					let payload = {
						packet: splitPacket.complete,
						start: splitPacket.start,
						length: splitPacket.length,
						command: splitPacket.command,
						serial: splitPacket.serial,
						data: splitDataDelayWindow.eddData,
						crc: splitPacket.crc,
						parent: null,
						parentType: parseInt(
							this.__constant.data.remaining_bytes.parent_type,
							2
						),
						position: splitDataDelayWindow.window,
						data2: splitDataDelayWindow.delay,
						typeId: 4
					};
					let result = utils.createPacketResult(payload);

					await resultArr.push(result);
				}
				unit++;
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
					result.type_id = 3;
					result.parent_type = 0;
					result.window_id = parseInt(parsedPacket.windowId, 2);
					result.led_state = parseInt(parsedPacket.led_state, 2);
					result.crc = parseInt(parsedPacket.data2, 2);
					break;
				default:
					// NOTE: serial is unknown for the remaining bytes!
					result.type_id = 4;
					result.parent_serial = parseInt(parsedPacketArr[0].serial, 2);
					result.delay = utils.reverseSerialBytes(
						parseInt(parsedPacket.data2, 2)
					);
					result.parent_type = 3;
					result.window_id = parseInt(parsedPacket.windowId, 2);
				}
				utils.extractRawData(this.__constant, bytePos, parsedPacket, result);
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

module.exports = DataListParser;
