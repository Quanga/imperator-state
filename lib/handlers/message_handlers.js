function MessageHandlers() {}

MessageHandlers.prototype.createMessageReceiveHandler = function ($happn) {
    return new Promise((resolve, reject) => {
        try {
            var result = function (message) {
                $happn.exchange.packetService.parseBinaryMessage(message)
                    .then((parsedMessage) => {
                        $happn.exchange.queueService.addToIncomingQueue(parsedMessage)
                            .then((result) => {
                                $happn.log.info('message added to queue: ' + result);
                            })
                            .catch((err) => {
                                $happn.log.error('createMessageReceiveHandler error 2', err);
                            });
                    })
                    .catch(function (err) {
                        $happn.log.error('createMessageReceiveHandler error', err);
                    });
                }
                 resolve(result);
        } catch (err) {
            reject(err);
        }
    });
    
};

module.exports = MessageHandlers;