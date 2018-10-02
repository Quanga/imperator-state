function MessageHandlers() {}

MessageHandlers.prototype.createMessageReceiveHandler = function($happn) {
	return new Promise((resolve, reject) => {
		try {
			var result = function(message) {
				//$happn.log.info('parsing message... ' + message.length);

				// parse the message
				$happn.exchange.packetService
					.parseBinaryMessage(message)

					.then(function(parsedMessage) {
						// all ok - add to the queue
						$happn.exchange.queueService
							.addToIncomingQueue(parsedMessage)
							.then(function(result) {
								$happn.log.info("message added to queue: " + result);
							})
							.catch(function(err) {
								$happn.log.error("createMessageReceiveHandler error 2", err);
							});
					})
					.catch(function(err) {
						$happn.log.error("createMessageReceiveHandler error", err);
					});
			};

			resolve(result);
		} catch (err) {
			reject(err);
		}
	});
};

module.exports = MessageHandlers;
