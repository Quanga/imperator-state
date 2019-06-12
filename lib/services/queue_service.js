/* eslint-disable no-unused-vars */
var Queue = require("better-queue");
const NodeCache = require("node-cache");

function QueueService() {
	this.cache = new NodeCache();
	this._eventRef = null;
}

/***
 * @summary Initialize the Queue Service
 * Check Directories and set the incoming and outgoing directories
 * @param $happn
 */
QueueService.prototype.initialise = function($happn) {
	const { error: logError, info: logInfo } = $happn.log;
	const { stateService, queueService } = $happn.exchange;
	const { packetService } = $happn.event;

	stateService.updateState({ service: $happn.name, state: "PENDING" });

	logInfo("Initializing Queue Service..............");
	this.incomingQueue = new Queue((input, cb) => {
		queueService.processIncoming(input).then((err, res) => {
			cb(null, res);
		});
	});

	this.outgoingQueue = new Queue((input, cb) => {
		//this will send to the transmission service
	});

	//in case of startup, need to check if there are any items in the queue awaiting processing
	//packetRepository.getQueueItems
	//foreach item
	//  send item to this queue for processing

	//it the queue is empty, then you can start up the rest of this

	let init = async () => {
		try {
			//subscribe to the packet writes
			packetService.on(
				"INCOMING_PACKET",
				msg => {
					this.incomingQueue.push(msg.data);
				},
				(err, eventRef) => {
					if (err)
						return logError("Cannot subscribe to incomingPacket write", err);

					this.eventRef = eventRef;
				}
			);

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
	const { packetService, dataService, packetRepository } = $happn.exchange;
	const { message: msg } = msgObj;

	let checkCache = key => {
		return new Promise((resolve, reject) => {
			this.cache.get(key, (err, value) => {
				if (err) return reject(logError("cache error", err));

				if (value === undefined) {
					return resolve(false);
				} else {
					return resolve(true);
				}
			});
		});
	};

	let ProcessAsync = async () => {
		try {
			let checkDuplicate = await checkCache(msg);
			if (checkDuplicate) {
				msg.duplicate = true;
				await packetService.routePacket(msgObj);
				return logWarn("duplicate packet skipped");
			}

			logInfo("message found > extracting message data: ");
			const parsedPacket = await packetService.extractData(msgObj);

			if (parsedPacket.length === 0)
				return logWarn("no data found in parsed packet!");

			if (parsedPacket.length > 0 && parsedPacket[0].data === null)
				return logWarn("no data found in parsed packet data!");

			const nodeData = await packetService.buildNodeData(parsedPacket);
			await dataService.upsertNodeDataArr(nodeData);

			msgObj.processed = true;
			await packetService.routePacket(msgObj);

			if (parsedPacket[0].data.command === 4) {
				this.cache.set(msg, msgObj, 15, (err, success) => {
					if (err) {
						return logError("cache error");
					}
				});
			}
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
