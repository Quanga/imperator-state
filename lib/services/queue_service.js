/* eslint-disable no-unused-vars */
var Queue = require("better-queue");
let server = require("../../server.js");

/**
 * @category Transport
 * @module lib/services/queueService
 */

/**
 * @category Transport
 * @class QueueService
 * @requires better-queue
 * @requires server.js
 */
function QueueService() {
	this._eventRef = null;
	this._epRef = null;
}

/**
 *  <ul><li>Start the component when Happner starts.</li>
 * <li> Starts a listener for a BLAST_STARTED event emitted from the dataService</li></ul><br>
 * @param {$happn} $happn
 * @returns {Promise}
 */
QueueService.prototype.componentStart = function($happn) {
	const { queueService, stateService } = $happn.exchange;
	const { log } = $happn;

	return (async () => {
		try {
			await queueService.subscribeToMesh();

			this.incomingQueue = new Queue((input, cb) => {
				queueService.processIncoming(input).then((err, res) => {
					if (err) log.error("cannot process queue", err);
					cb(null, res);
				});
			});

			this.outgoingQueue = new Queue((input, cb) => {
				//this will send to the transmission service
			});

			stateService.updateState({ service: $happn.name, state: "PENDING" });

			log.info("Initializing Queue Service..............");
		} catch (err) {
			log.error("Error starting queueService", err);
		}
	})();
};

/**
 *  <ul><li>Stop the component when Happner starts.</li>
 * <li> </li></ul><br>
 * @param {$happn} $happn
 * @returns {Promise}
 * @todo HANDLE REMOVAL OF MESH LISTNERS
 */
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

/**
 *  <ul><li>Subscribe to mesh events</li>
 * <li> Handle by event</li></ul><br>
 * @param {$happn} $happn
 * @returns {Promise}
 * @listens  endpoint-reconnect-scheduled
 * @listens endpoint-reconnect-successful
 * @listens connection-ended
 */
QueueService.prototype.subscribeToMesh = function($happn) {
	const { queueService } = $happn.exchange;
	const { log } = $happn;

	return (async () => {
		server.mesh.on("endpoint-reconnect-scheduled", evt => {
			queueService.stop();
			log.warn("ERROR RECONNECTING", evt.endpointName);
		});

		server.mesh.on("endpoint-reconnect-successful", evt => {
			queueService.initialise();
			log.info("RECONNECTED", evt.endpointName);
		});

		server.mesh.on("connection-ended", evt => {
			queueService.stop();
			log.warn("CONNECTION ENDED", evt.endpointName);
		});
	})();
};

/**
 * @summary Initialize the Queue Service
 * Check Directories and set the incoming and outgoing directories
 * @param {$happn} $happn
 */
QueueService.prototype.initialise = function($happn) {
	const { log } = $happn;
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

					log.info(
						`No active queue found, creating queue for ${
							env.endpointUsername
						} with last know packet ${lastPacket || 0}`
					);

					await epQueueService.buildQueue(env.endpointUsername, lastPacket || 0);
				}

				await queueService.checkQueue();
				log.info("Queue drained > Resuming queue processing......");

				evQueueService.on(
					`enqueue/${env.endpointUsername}`,
					data => {
						queueService.checkQueue();
					},
					(error, _eventRef) => {
						if (error) {
							return log.error("Failed to subscribe to queue endpoint");
						}
						this._epRef = _eventRef;
					}
				);
			}

			stateService.updateState({ service: $happn.name, state: "STARTED" });
			log.info(`Initializing Queue Service..............PASSED`);
		} catch (err) {
			stateService.updateState({ service: $happn.name, state: "FAILED" });
			log.error(`Initializing Queue Service..............FAILED - ${err}`);
		}
	})();
};

/**
 * @summary Check the queue and dequeue the items
 * @param {$happn} $happn
 */
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

/**
 * @summary Process the incoming item
 * @param {$happn} $happn
 * @param {object} msgObj
 * @example { message, created }
 */
QueueService.prototype.processIncoming = function($happn, msgObj) {
	const { log } = $happn;
	const { packetService, dataService } = $happn.exchange;

	return (async () => {
		try {
			log.info(`${msgObj.created} - message ${msgObj.packet} > received`);
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

/**
 * @summary Add an item to the outgoing queue
 * @param {$happn} $happn
 * @param {string} packet
 * @todo THIS IS NOT FLESHED OUT YET
 */
QueueService.prototype.addToQueue = function($happn, packet) {
	const { log } = $happn;

	return (async () => {
		log.info(`packet - ${packet} added to outgoing queue`);
		this.incomingQueue.push(packet);
	})();
};

module.exports = QueueService;
