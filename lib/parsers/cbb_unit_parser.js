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
			let unit = 1;

			let dataMatch = splitPacket.data.match(/.{1,8}/g);
			//console.log("datamatch", JSON.stringify(dataMatch, null, 2));
			for (const item of dataMatch) {
				//packet, start, length, command, serial, data, crc, parent, parentType, pos, delay
				let parentType = null;
				if (unit === 1) {
					let splitDataDelayWindow = utils.extractCbbData(item);
					console.log(
						`CBB splitdata delay - ${JSON.stringify(
							splitDataDelayWindow,
							null,
							2
						)}`
					);

					parentType = this.__constant.data.first_byte.parent_type;

					let payload = {
						packet: splitPacket.complete,
						start: splitPacket.start,
						length: splitPacket.length,
						command: splitPacket.command,
						serial: splitPacket.serial,
						data: splitDataDelayWindow.cbbData,
						crc: splitPacket.crc,
						parent: null,
						parentType: parentType,
						position: splitDataDelayWindow.window,
						data2: splitDataDelayWindow.crc,
						typeId: 3,
						led_state: 0
					};
					let result = utils.createPacketResult(payload);

					console.log("CBB extract", JSON.stringify(result, null, 2));

					resultArr.push(result);
				} else {
					let splitDataDelayWindow = utils.extractEddData(item);
					console.log(
						`EDD splitdata delay - ${JSON.stringify(
							splitDataDelayWindow,
							null,
							2
						)}`
					);

					parentType = this.__constant.data.remaining_bytes.parent_type;

					let payload = {
						packet: splitPacket.complete,
						start: splitPacket.start,
						length: splitPacket.length,
						command: splitPacket.command,
						serial: splitPacket.serial,
						data: splitDataDelayWindow.eddData,
						crc: splitPacket.crc,
						parent: null,
						parentType: parentType,
						position: splitDataDelayWindow.window,
						data2: splitDataDelayWindow.delay,
						typeId: 4
					};
					let result = utils.createPacketResult(payload);

					await resultArr.push(result);
					console.log("EDD extract", JSON.stringify(result, null, 2));
				}
				unit++;
			}

			console.log(`RESULT from edd parser
			${JSON.stringify(resultArr, null, 2)}
			`);
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
			console.log(`RESULT from CBB parser
			${JSON.stringify(resultArr, null, 2)}
			`);
			return resultArr;
		} catch (err) {
			$happn.log.error("build nodedata error", err);
		}
	};

	return buildNodeDataAsync();
};

module.exports = DataListParser;
