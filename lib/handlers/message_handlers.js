/* eslint-disable no-unused-vars */
function MessageHandler() {}

/***
 * @summary Async function that handles the incoming message from the Serialport Service or another Input
 * and parses it and sends it onto the queue

 * @param $happn
 * @param incomingMessage
 *  * @param fromSerialport

 */
MessageHandler.prototype.MessageReceiveHandler = function(
	$happn,
	incomingMessage
) {
	const { error: logError, info: logInfo } = $happn.log;
	const { packetService } = $happn.exchange;

	let handleAsync = async message => {
		try {
			let created = Date.now();
			await packetService.parseBinaryMessage(message, created);
		} catch (err) {
			logError("createMessageReceiveHandler error 2", err);
			return Promise.reject(err);
		}
	};

	return handleAsync(incomingMessage);
};

MessageHandler.prototype.stop = function($happn) {
	const { info: logInfo } = $happn.log;
	return new Promise((resolve, reject) => {
		logInfo(`stopping ${$happn.name}`);
		resolve();
	});
};

module.exports = MessageHandler;
