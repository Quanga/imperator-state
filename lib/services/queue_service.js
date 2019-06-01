/* eslint-disable no-unused-vars */
var Queue = require("better-queue");
const NodeCache = require("node-cache");

function QueueService() {
	this.cache = new NodeCache();
}
QueueService.prototype.timer = function(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
};

/***
 * @summary Initialize the Queue Service
 * Check Directories and set the incoming and outgoing directories
 * @param $happn
 */
QueueService.prototype.initialise = function($happn) {
	const { error: logError, info: logInfo } = $happn.log;
	const { stateService, queueService } = $happn.exchange;
	const { packetRepository } = $happn.event;

	stateService.updateState({ service: $happn.name, state: "PENDING" });

	this.processQueue = new Queue(function(input, cb) {
		queueService.process(input).then((err, res) => {
			cb(null, res);
		});
	});

	//in case of startup, need to check if there are any items in the queue awaiting processing
	//packetRepository.getQueueItems
	//foreach item
	//  send item to this queue for processing

	//it the queue is empty, then you can start up the rest of this

	logInfo("Initializing Queue Service..............");
	const _this = this;
	let init = async () => {
		try {
			//subscribe to the packet writes
			packetRepository.on(
				"process",
				msg => {
					this.processQueue.push(msg.data);
				},
				(error, _eventRef) => {
					if (error) return;
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
 { message, created, passed: false }
 */

QueueService.prototype.process = function($happn, message) {
	const { error: logError, info: logInfo, warn: logWarn } = $happn.log;
	const { packetService, dataService, packetRepository } = $happn.exchange;

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
			if (message !== null && message.passed) {
				let checkDuplicate = await checkCache(message.message);
				if (checkDuplicate) {
					message.duplicate = true;
					await packetRepository.update(message);
					return logWarn("duplicate packet skipped");
				}

				logInfo("message found > extracting message data: ");

				let parsedPacket = await packetService.extractData(message);
				//console.log("PARSED PACKET", parsedPacket);

				if (parsedPacket.length === 0)
					return logWarn("no data found in parsed packet!");

				let nodeData = await packetService.buildNodeData(parsedPacket);

				if (parsedPacket.length > 0 && parsedPacket[0].data === null)
					return logWarn("no data found in parsed packet data!");

				await dataService.upsertNodeDataArr(nodeData);

				await packetRepository.update(message);

				if (parsedPacket[0].data.command === 4) {
					this.cache.set(message.message, message, 15, (err, success) => {
						if (err) {
							return logError("cache error");
						}
					});
				}
			}
		} catch (err) {
			logError(`Processing Queue Error.............. - ${err}`);
			return Promise.reject(err);
		}
	};

	return ProcessAsync();
};

QueueService.prototype.stop = function($happn, callback) {
	return new Promise((resolve, reject) => {
		$happn.log.info("stopping queue service...");
		resolve();
	});
};

module.exports = QueueService;
