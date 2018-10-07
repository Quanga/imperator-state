function MessageHandlers() {}

MessageHandlers.prototype.createMessageReceiveHandler = function($happn) {
	try {
		return new Promise((resolve, reject) => {
			var result = function(message) {
				// parse the message
				return $happn.exchange.packetService
					.parseBinaryMessage(message)

					.then(function(parsedMessage) {
						// all ok - add to the queue
						return $happn.exchange.queueService
							.addToIncomingQueue(parsedMessage)
							.then(result => {
								$happn.log.info("message added to queue: " + result);
							})
							.catch(function(err) {
								$happn.log.error("createMessageReceiveHandler error 2", err);
								reject(err);
							});
					})
					.catch(function(err) {
						$happn.log.error("createMessageReceiveHandler error", err);
					});
			};

			resolve(result);
		});
	} catch (err) {
		$happn.log.error("createMessageReceiveHandler error", err);
	}
};

module.exports = MessageHandlers;
