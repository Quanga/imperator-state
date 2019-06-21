/* eslint-disable no-unused-vars */
var Queue = require("better-queue");
const ENDPOINT = process.env.ENDPOINT_NAME;

function QueueService() {
	this._eventRef = null;
	this._epRef = null;
}

QueueService.prototype.checkQueue = function($happn) {
	const { queueService: epQueueService } = $happn.exchange[ENDPOINT];

	const checkQueueAsync = async () => {
		let queueCount = await epQueueService.size();
		for (let i = 0; i < queueCount; i++) {
			let packet = await epQueueService.dequeue();
			this.incomingQueue.push(packet);
		}
	};
	return checkQueueAsync();
};

QueueService.prototype.addToQueue = function($happn, packet) {
	this.incomingQueue.push(packet);
};

QueueService.prototype.start = function($happn) {
	const { queueService, stateService, nodeRepository } = $happn.exchange;
	const { error: logError, info: logInfo } = $happn.log;

	const startAsync = async () => {
		try {
			this.incomingQueue = new Queue((input, cb) => {
				queueService.processIncoming(input).then((err, res) => {
					if (err) logError("cannot process queue");
					cb(null, res);
				});
			});

			this.outgoingQueue = new Queue((input, cb) => {
				//this will send to the transmission service
			});

			stateService.updateState({ service: $happn.name, state: "PENDING" });

			logInfo("Initializing Queue Service..............");
		} catch (err) {
			logError("Error starting queueService", err);
		}
	};
	return startAsync();
};

QueueService.prototype.stop = function($happn) {
	const { queueService: epQueueService } = $happn.event[ENDPOINT];
	const { error: logError } = $happn.log;

	epQueueService.off(this._epRef, function(error) {
		if (error) {
			logError("could not unsubscribe from ep queue");
			// failed to unsubscribe
			return;
		}
	});
};

/***
 * @summary Initialize the Queue Service
 * Check Directories and set the incoming and outgoing directories
 * @param $happn
 */
QueueService.prototype.initialise = function($happn) {
	const { error: logError, info: logInfo } = $happn.log;
	const { stateService, queueService, nodeRepository } = $happn.exchange;

	let init = async () => {
		try {
			if (process.env.USE_ENDPOINT === "true") {
				const { queueService: evQueueService } = $happn.event[ENDPOINT];
				const { queueService: epQueueService } = $happn.exchange[ENDPOINT];

				//check the last received item
				let lastPacket = await nodeRepository.getLastPacketTime();
				await epQueueService.clearQueue();
				await epQueueService.buildQueue(lastPacket);

				//check the queue on the main packet store
				await queueService.checkQueue();

				evQueueService.on(
					"enqueue",
					(data, meta) => {
						queueService.checkQueue();
					},
					function(error, _eventRef) {
						if (error) {
							// failed to subscribe
							return;
						}
						this._epRef = _eventRef;
					}
				);
			}

			stateService.updateState({ service: $happn.name, state: "STARTED" });

			logInfo(`Initializing Queue Service..............PASSED`);
		} catch (err) {
			stateService.updateState({ service: $happn.name, state: "FAILED" });

			logError(`Initializing Queue Service..............FAILED - ${err}`);
			return Promise.reject(err);
		}
	};
	return init();
};

/* ************************************************************
 * PROCESS QUEUE
 **************************************************************
 { message, created }
 */
QueueService.prototype.processIncoming = function($happn, msgObj) {
	const { error: logError, info: logInfo, warn: logWarn } = $happn.log;
	const { packetService, dataService } = $happn.exchange;
	const { packet: msg } = msgObj;

	let ProcessAsync = async () => {
		try {
			logInfo(msgObj.packet);
			logInfo("message found > extracting message data: ");
			const parsedPacket = await packetService.extractData(msgObj);

			if (parsedPacket.length === 0)
				return logWarn("no data found in parsed packet!");

			if (parsedPacket.length > 0 && parsedPacket[0].data === null)
				return logWarn("no data found in parsed packet data!");

			const nodeData = await packetService.buildNodeData(parsedPacket);
			await dataService.upsertNodeDataArr(nodeData);
		} catch (err) {
			logError(`Processing Queue Error.............. - ${err}`);
			return Promise.reject(err);
		}
	};

	return ProcessAsync();
};

QueueService.prototype.stop = function($happn) {
	const { info: logInfo } = $happn.log;

	return new Promise(resolve => {
		logInfo("stopping queue service...");
		resolve();
	});
};

module.exports = QueueService;
