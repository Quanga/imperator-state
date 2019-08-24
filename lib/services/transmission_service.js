/* eslint-disable no-unused-vars */
const ENDPOINT = process.env.ENDPOINT_NAME;

function TransmissionService() {}

TransmissionService.prototype.componentStart = function($happn) {
	const { stateService } = $happn.exchange;
	const { name } = $happn;

	return (async () => {
		try {
			stateService.updateState({ service: name, state: "STARTED" });
		} catch (error) {
			stateService.updateState({ service: name, state: "FAILED", error });
		}
	})();
};

TransmissionService.prototype.transmit = function($happn, serial, command) {
	const { log } = $happn;
	const { queueService: epQueueService } = $happn.exchange[ENDPOINT];
	const message = { serial, command };

	return (async () => {
		try {
			epQueueService.addToOutputQueue(message);
			log.info("added message to outgoing queue...: ", message);
		} catch (err) {
			log.error("buildAndSend error", err);
		}
	})();
};

module.exports = TransmissionService;
