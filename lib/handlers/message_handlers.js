const PacketUtils = require("../utils/packet_utils");

function MessageHandler() {
	this._utils = new PacketUtils();
}

/***
 * @summary Async function that handles the incoming message from the Serialport Service or another Input
 * parses it and sends it onto the queue

 * @param $happn
 * @param incomingMessage
 */
MessageHandler.prototype.MessageReceiveHandler = function(
	$happn,
	incomingMessage
) {
	const { error: logError } = $happn.log;
	const { packetService, messageHandler } = $happn.exchange;

	let handleAsync = async message => {
		try {
			const created = Date.now();
			const checkedMsg = await messageHandler.checkCRC(message);

			if (checkedMsg) {
				await packetService.routePacket({
					message: message.toString("hex"),
					created,
					passed: checkedMsg,
					route: "INCOMING_PACKET",
					processed: false
				});
			}
		} catch (err) {
			logError("createMessageReceiveHandler error 2", err);
			return Promise.reject(err);
		}
	};

	return handleAsync(incomingMessage);
};

/***
 * @summary Parse Binary data and return converted message once the
 * CRC has qualified
 * Incoming from the MESSAGE HANDLER
 * @param $happn
 * @param message - the incoming data
 * returns { message: string, passed: bool }
 */
MessageHandler.prototype.checkCRC = function($happn, message) {
	const { error: logError } = $happn.log;

	let parseBinaryAsync = async () => {
		try {
			const hexMsg = message.toString("hex");
			let checkCrc = hexMsg.substr(hexMsg.length - 4).toLowerCase();
			let checkStr = hexMsg.substr(0, hexMsg.length - 4);
			let genCrc = this._utils
				.generateCRC(checkStr)
				.toString(16)
				.toLowerCase();
			let padCrc = this._utils.pad(genCrc, 4);

			if (padCrc == checkCrc) {
				return true;
			} else {
				return false;
			}
		} catch (err) {
			logError("parseBinaryMessage error", err);
		}
	};

	return parseBinaryAsync();
};

MessageHandler.prototype.stop = function($happn) {
	const { info: logInfo } = $happn.log;
	return new Promise(resolve => {
		logInfo(`stopping ${$happn.name}`);
		resolve();
	});
};

module.exports = MessageHandler;
