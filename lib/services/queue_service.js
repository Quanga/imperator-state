/* eslint-disable no-unused-vars */
var Queue = require("better-queue");
let server = require("../../server.js");

function QueueService() {
	this._eventRef = null;
	this._epRef = null;
}

QueueService.prototype.componentStart = function($happn) {
	const { queueService, stateService } = $happn.exchange;
	const { error: logError, info: logInfo } = $happn.log;

	server.mesh.on("endpoint-reconnect-scheduled", evt => {
		queueService.stop();
		console.log("ERROR RECONNECTING", evt.endpointName);
	});

	server.mesh.on("endpoint-reconnect-successful", evt => {
		queueService.initialise();

		console.log("RECONNECTED", evt.endpointName);
	});

	server.mesh.on("connection-ended", evt => {
		queueService.stop();

		console.log("CONNECTION ENDED", evt.endpointName);
	});

	return (async () => {
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
	})();
};

QueueService.prototype.componentStop = function($happn) {
	const { env } = $happn.config;
	const { queueService: epQueueService } = $happn.event[env.endpointName];
	const { error: logError, info: logInfo } = $happn.log;

	return (async () => {
		try {
			logInfo("stopping queue service...");

			if (this._epRef) {
				epQueueService.off(this._epRef, function(error) {
					if (error) {
						return logError("could not unsubscribe from ep queue");
					}
				});
			}
		} catch (err) {
			logError("Error stopping queueService", err);
		}
	})();
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
				const { queueService: epQueueService } = $happn.exchange[env.endpointName];

				let activeQueues = await epQueueService.getActiveQueues();

				if (activeQueues.findIndex(i => i === env.endpointUsername) === -1) {
					let lastPacket = await nodeRepository.getLastPacketTime();
					//lastPacket = 0;
					logInfo(
						`No active queue found, creating queue for ${
							env.endpointUsername
						} with last know packet ${lastPacket || 0}`
					);

					await epQueueService.buildQueue(env.endpointUsername, lastPacket || 0);
				}

				await queueService.checkQueue();
				logInfo("Queue drained > Resuming queue processing......");

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

	return (async () => {
		let queueCount = await epQueueService.size(env.endpointUsername);
		for (let i = 0; i < queueCount; i++) {
			let packet = await epQueueService.dequeue(env.endpointUsername);
			this.incomingQueue.push(packet);
		}
	})();
};

/* ************************************************************
 * PROCESS QUEUE
 **************************************************************
 { message, created }
 */
QueueService.prototype.processIncoming = function($happn, msgObj) {
	const { log } = $happn;
	const { packetService, dataService } = $happn.exchange;

	return (async () => {
		try {
			log.info(`${msgObj.created} - message ${msgObj.packet} > extracting`);
			const parsedPacket = await packetService.extractData(msgObj);

			if (parsedPacket.length === 0) return log.warn("no data found in parsed packet!");

			if (parsedPacket.length > 0 && parsedPacket[0].data === null)
				return log.warn("no data found in parsed packet data!");

			const nodeData = await packetService.buildNodeData(parsedPacket);
			await dataService.upsertNodeDataArr(nodeData);
		} catch (err) {
			return log.error(`Processing Queue Error.............. - ${err}`);
		}
	})();
};

QueueService.prototype.addToQueue = function($happn, packet) {
	return (async () => {
		this.incomingQueue.push(packet);
	})();
};

module.exports = QueueService;
