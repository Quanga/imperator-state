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
	// const { performance } = require("perf_hooks");

	let handleAsync = async message => {
		try {
			// let funcStart = performance.now();

			let addedDelimiter = `aaaa${message.toString("hex")}`;
			let parsedMessage = await packetService.parseBinaryMessage(
				addedDelimiter
			);
			console.log(
				`!!!!!!!!!!!!!message parsed by message handler ${parsedMessage}`
			);

			await queueService.addToIncomingQueue(parsedMessage);

			info("message added to incoming queue: ");
			// let funcEnd = performance.now();
			// warn(`MESSAGE PARSING TOOK ${funcEnd - funcStart} MS.`);
		} catch (err) {
			error("createMessageReceiveHandler error 2", err);
		}
	};

	return handleAsync(incomingMessage);
};

module.exports = MessageHandlers;
