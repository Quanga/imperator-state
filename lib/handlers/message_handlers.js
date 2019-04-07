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
	const { packetService, RxQueue, EpQueue } = $happn.exchange;
	const { config } = $happn;

	let handleAsync = async message => {
		try {
			let parsedMessage = await packetService.parseBinaryMessage(message);

			await RxQueue.writeDataIncrement({
				//send to the RxCache
				path: `cache`,
				data: { created: Date.now(), message: parsedMessage }
			});

			logInfo(
				`msg added to incomingQ: ${JSON.stringify(parsedMessage, null, 2)}`
			);

			// if (config.useEndpoint) {
			// 	//send to the End Point Cache
			// 	// await EpQueue.writeDataIncrement({
			// 	// 	path: `cache`,
			// 	// 	data: { created: Date.now(), message: parsedMessage }
			// 	// });
			// 	// logInfo(
			// 	// 	`msg added to endpointQ: ${JSON.stringify(parsedMessage, null, 2)}`
			// 	// );
			// }
		} catch (err) {
			logError("createMessageReceiveHandler error 2", err);
			return Promise.reject(err);
		}
	};

	return handleAsync(incomingMessage);
};

module.exports = MessageHandler;
