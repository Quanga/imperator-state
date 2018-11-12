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
			if (fromSerialport !== null) {
				let parsedMessage = await packetService.parseBinaryMessage(message);
				incomingMessage = { created: Date.now(), message: parsedMessage };
			}

			await queueService.addToIncomingQueue(incomingMessage);
			logInfo(
				`msg added to incomingQ: ${JSON.stringify(incomingMessage, null, 2)}`
			);

			if (config.useEndpoint === "true") {
				await queueService.addToEndpointQueue(incomingMessage);
				logInfo(
					`msg added to endpointQ: ${JSON.stringify(incomingMessage, null, 2)}`
				);
			}
		} catch (err) {
			logError("createMessageReceiveHandler error 2", err);
		}
	};

	return handleAsync(incomingMessage);
};

module.exports = MessageHandlers;
