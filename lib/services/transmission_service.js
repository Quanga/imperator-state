/* eslint-disable no-unused-vars */
const ENDPOINT = process.env.ENDPOINT_NAME;

function TransmissionService() {}

TransmissionService.prototype.start = function($happn) {
	const { info: logInfo, error: logError } = $happn.log;

	const startAsync = async () => {
		logInfo("starting transmission service");
	};

	return startAsync();
};

TransmissionService.prototype.transmit = function($happn, message) {
	const { info: logInfo, error: logError } = $happn.log;
	const { queueService: epQueueService } = $happn.exchange[ENDPOINT];

	let transmitAsync = async () => {
		try {
			epQueueService.addToOutputQueue(message);
			logInfo("added message to outgoing queue...: ", message);
		} catch (err) {
			logError("buildAndSend error", err);
		}
	};

	return transmitAsync();
};

module.exports = TransmissionService;
