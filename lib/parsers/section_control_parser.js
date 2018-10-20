/**
 * Created by grant on 2016/08/23.
 */

function SerialListParser(commandConstant) {
	this.__constant = commandConstant;
}

SerialListParser.prototype.parse = function($happn, splitPacket) {
	const { info: logInfo, error: logError } = $happn.log;
	const PacketUtils = require("../utils/packet_utils");
	const utils = new PacketUtils();

	let resultArr = [];
	let parseAsync = async () => {
		logInfo(":: SECTION CONTOL PARSER ::");

		let payload = {
			packet: splitPacket.complete,
			start: splitPacket.start,
			length: splitPacket.length,
			command: splitPacket.command,
			serial: splitPacket.serial,
			data: null,
			crc: splitPacket.crc,
			parent: null,
			parentType: this.__constant.parent_type,
			typeId: 0
		};

		try {
			let parent = utils.createPacketResult(payload);

			await resultArr.push(parent);

			if (splitPacket.data == "") {
				return resultArr;
			}

			// now add the child list
			let childData = splitPacket.data.match(/.{1,4}/g);
			let childPosition = 0;

			for (const childD of childData) {
				childPosition++;

				let payload = {
					packet: splitPacket.complete,
					start: splitPacket.start,
					length: splitPacket.length,
					command: splitPacket.command,
					serial: childD,
					crc: splitPacket.crc,
					parent: splitPacket.serial,
					parentType: this.__constant.data.remaining_bytes.parent_type,
					position: childPosition,
					typeId: 1
				};
				let result = utils.createPacketResult(payload);

				if (utils.checkForNoDuplicate(resultArr, result)) {
					resultArr.push(result);
				}
			}

			resultArr[0].windowId = childPosition; //update the parent's window_id for a ping request to the number of nodes in the packet;
			return resultArr;
		} catch (err) {
			logError("parsing error", err);
		}
	};

	return parseAsync();
};

SerialListParser.prototype.buildNodeData = function($happn, parsedPacketArr) {
	const { error } = $happn.log;
	const PacketUtils = require("../utils/packet_utils");
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
					result.type_id = this.__constant.serial_type;
					result.parent_type = this.__constant.parent_type;
					//console.log("WIINDOW ID - ", parsedPacket.windowId);

					result.window_id = parsedPacket.windowId; //update the window_id for a ping request to the number of nodes in the packet;
					break;
				case 1:
					result.type_id = this.__constant.data.first_byte.device_type;
					result.serial =
							result.type_id == 2
								? utils.reverseSerialBytes(parseInt(parsedPacket.serial, 2))
								: parseInt(parsedPacket.serial, 2);
					result.parent_serial = parseInt(parsedPacketArr[0].serial, 2);
					result.parent_type = this.__constant.data.first_byte.parent_type;
					result.window_id =
							parsedPacket.windowId != null
								? parseInt(parsedPacket.windowId)
								: null;
					break;
				default:
					result.type_id = this.__constant.data.first_byte.device_type;
					result.serial =
							result.type_id == 2
								? utils.reverseSerialBytes(parseInt(parsedPacket.serial, 2))
								: parseInt(parsedPacket.serial, 2);
					result.parent_serial = parseInt(parsedPacketArr[0].serial, 2);
					result.parent_type = this.__constant.data.first_byte.parent_type;
					result.window_id =
							parsedPacket.windowId != null
								? parseInt(parsedPacket.windowId)
								: null;
				}
				bytePos++;

				await resultArr.push(result);
			}

			return resultArr;
		} catch (err) {
			error("build nodedata error", err);
		}
	};

	return buildNodeDataAsync();
};

module.exports = SerialListParser;
