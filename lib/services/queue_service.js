/* eslint-disable no-unused-vars */
var Queue = require("better-queue");

function QueueService() {
	this._eventRef = null;
	this._epRef = null;
}

QueueService.prototype.start = function($happn) {
	const { queueService, stateService } = $happn.exchange;
	const { error: logError, info: logInfo } = $happn.log;
	const { Mesh } = $happn;

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
	const { info: logInfo } = $happn.log;

	return (async () => logInfo("stopping queue service..."))();
};

QueueService.prototype.stop = function($happn) {
	const { env } = $happn.config;
	const { queueService: epQueueService } = $happn.event[env.endpointName];
	const { error: logError } = $happn.log;

	if (this._epRef) {
		epQueueService.off(this._epRef, function(error) {
			if (error) {
				return logError("could not unsubscribe from ep queue");
			}
		});
	}
};

/***
 * @summary Initialize the Queue Service
 * Check Directories and set the incoming and outgoing directories
 * @param $happn
 */
QueueService.prototype.initialise = function($happn) {
	const { error: logError, info: logInfo } = $happn.log;
	const { stateService, queueService, nodeRepository } = $happn.exchange;
	const { env } = $happn.config;

	return (async () => {
		try {
			if (env.useEndpoint === "true") {
				const { queueService: evQueueService } = $happn.event[env.endpointName];
				const { queueService: epQueueService } = $happn.exchange[
					env.endpointName
				];

				let activeQueues = await epQueueService.getActiveQueues();

				if (activeQueues.findIndex(i => i === env.endpointUsername) === -1) {
					let lastPacket = await nodeRepository.getLastPacketTime();
					//lastPacket = 0;
					logInfo(
						`No active queue found, creating queue for ${
							env.endpointUsername
						} with last know packet ${lastPacket || 0}`
					);

					await epQueueService.buildQueue(
						env.endpointUsername,
						lastPacket || 0
					);
				}

				await queueService.checkQueue();
				logInfo("Resuming queue processing......");

				evQueueService.on(
					`enqueue/${env.endpointUsername}`,
					data => {
						queueService.checkQueue();
					},
					(error, _eventRef) => {
						if (error) {
							return logError("Failed to subscribe to queue endpoint");
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
	})();
};

QueueService.prototype.checkQueue = function($happn) {
	const { env } = $happn.config;
	const { queueService: epQueueService } = $happn.exchange[env.endpointName];

	const checkQueueAsync = async () => {
		let queueCount = await epQueueService.size(env.endpointUsername);
		for (let i = 0; i < queueCount; i++) {
			let packet = await epQueueService.dequeue(env.endpointUsername);
			this.incomingQueue.push(packet);
		}
	};
	return checkQueueAsync();
};

/* ************************************************************
 * PROCESS QUEUE
 **************************************************************
 { message, created }
 */
QueueService.prototype.processIncoming = function($happn, msgObj) {
	const { error: logError, info: logInfo, warn: logWarn } = $happn.log;
	const { packetService, dataService } = $happn.exchange;

	let ProcessAsync = async () => {
		try {
			logInfo(msgObj.packet);
			logInfo("message found > extracting message data: ", msgObj.created);
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

QueueService.prototype.addToQueue = function($happn, packet) {
	this.incomingQueue.push(packet);
};

module.exports = QueueService;
