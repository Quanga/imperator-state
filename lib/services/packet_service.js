function PacketService() {
	const PacketUtils = require("../utils/packet_utils");
	this._utils = new PacketUtils();
}

/***
 * @summary Parse Binary data and return converted message once the
 * CRC has qualified
 * Incoming form the MESSAGE HANDLER
 * @param $happn
 * @param data - the incoming data
 */
PacketService.prototype.parseBinaryMessage = function($happn, data) {
	const { error: logError, info: logInfo } = $happn.log;

	let parseBinaryAsync = async () => {
		try {
			let message = data.toString("hex");
			logInfo("checking CRC in message: ", message);
			// extract the last 4 characters (the crc)
			let checkCrc = message.substr(message.length - 4).toLowerCase();
			let checkStr = message.substr(0, message.length - 4);
			let genCrc = this._utils
				.generateCRC(checkStr)
				.toString(16)
				.toLowerCase();
			let padCrc = this._utils.pad(genCrc, 4);

			if (padCrc == checkCrc) {
				return message;
			} else {
				throw new Error(
					`--Invalid CRC | Check string: ${checkStr} Check CRC: ${checkCrc} Generated CRC: ${padCrc}`
				);
			}
		} catch (err) {
			logError("parseBinaryMessage error", err);
		}
	};

	return parseBinaryAsync();
};

/***
 * @summary Extract data from a message return converted message once the
 * CRC has qualified
 * Incoming form the QUEUE SERVICE > INCOMING QUEUE
 * returnes a PARSED PACKET
 * @param $happn
 * @param message - the incoming message
 */
PacketService.prototype.extractData = function($happn, incomingMsg) {
	const { parserFactory } = $happn.exchange;
	const { error: logError } = $happn.log;

	const PacketModel = require("../models/packetModel");

	const PacketTemplate = require("../constants/packetTemplates");
	const packetTemplate = new PacketTemplate();

	let extraxtAsync = async () => {
		try {
			let packetType = parseInt(incomingMsg.message.substr(6, 2));
			let deviceTemplate = packetTemplate.incomingCommTemplate[packetType];

			const splitPacket = new PacketModel(
				deviceTemplate,
				incomingMsg.message,
				incomingMsg.created,
				0
			);

			let parser = await parserFactory.getParser(splitPacket); // use a factory to get the right parser...
			let result = await parser.parse($happn, splitPacket);
			return result;
		} catch (err) {
			logError("extractData error", err);
		}
	};

	return extraxtAsync();
};

PacketService.prototype.buildNodeData = function($happn, parsedPacketArr) {
	const { parserFactory } = $happn.exchange;
	const { error: logError } = $happn.log;

	let buildNodeDataAsync = async () => {
		try {
			if (parsedPacketArr.length > 0) {
				if (parsedPacketArr[0]._data === null) return null;
				let parser = await parserFactory.getParser(parsedPacketArr[0]); // use a factory to get the right parser...
				let result = await parser.buildNodeData($happn, parsedPacketArr);
				return result;
			} else {
				return null;
			}
		} catch (err) {
			logError("buildNodeData error", err);
		}
	};

	return buildNodeDataAsync();
};

PacketService.prototype.buildOutgoingPacket = function($happn, cmd, srl) {
	const { error: logError } = $happn.log;

	let buildOutgoingAsync = async () => {
		try {
			let result = this._utils.buildOutgoingPacket($happn, cmd, srl);
			return result;
		} catch (err) {
			logError("buildOutgoingPacket error", err);
		}
	};

	return buildOutgoingAsync();
};

module.exports = PacketService;
