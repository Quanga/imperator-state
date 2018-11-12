function MessageHandlers() {}

/***
 * @summary Async function that handles the incoming message from the Serialport Service or another Input
 * and parses it and sends it onto the queue

 * @param $happn
 * @param incomingMessage
 *  * @param fromSerialport

 */
MessageHandlers.prototype.MessageReceiveHandler = function(
	$happn,
	incomingMessage,
	fromSerialport
) {
	const { error: logError, info: logInfo } = $happn.log;
	const { packetService, queueService } = $happn.exchange;
	const { config } = $happn;

	let handleAsync = async message => {
		try {
			let storedMessage = incomingMessage;

			if (fromSerialport !== null) {
				let parsedMessage = await packetService.parseBinaryMessage(message);
				let timestamp = Date.now();
				storedMessage = { created: timestamp, message: parsedMessage };
			}

			await queueService.addToIncomingQueue(storedMessage);

			if (config.config.useEndpoint === true) {
				await queueService.addToEndpointQueue(storedMessage);
			}

			logInfo(
				`message added to incoming queue: ${JSON.stringify(
					storedMessage,
					null,
					2
				)}`
			);
		} catch (err) {
			logError("createMessageReceiveHandler error 2", err);
		}
	};

	return handleAsync(incomingMessage);
};

module.exports = MessageHandlers;
