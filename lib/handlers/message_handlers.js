function MessageHandlers() {}

/***
 * @summary Async function that handles the incoming message from the Serialport Service and parses it and
 * sends it onto the queue
 * @param $happn
 * @param incomingMessage
 */
MessageHandlers.prototype.MessageReceiveHandler = function(
	$happn,
	incomingMessage
) {
	const { error, info } = $happn.log;
	const { packetService, queueService } = $happn.exchange;

	let handleAsync = async message => {
		try {
			//let addedDelimiter = `aaaa${message.toString("hex")}`;
			let parsedMessage = await packetService.parseBinaryMessage(message);

			await queueService.addToIncomingQueue(parsedMessage);

			info(`message added to incoming queue: ${parsedMessage}`);
		} catch (err) {
			error("createMessageReceiveHandler error 2", err);
		}
	};

	return handleAsync(incomingMessage);
};

module.exports = MessageHandlers;
