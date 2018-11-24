function QueueService() {}

const { promisify } = require("util");
let fs = require("fs");
const readdir = promisify(fs.readdir);

const timeout = ms => {
	return new Promise(resolve => setTimeout(resolve, ms));
};

/***
 * @summary Initialize the Queue Service
 * Check Directories and set the incoming and outgoing directories
 * @param $happn
 */
QueueService.prototype.initialise = function($happn) {
	const { error: logError, info: logInfo } = $happn.log;
	const {
		incomingFileQueue,
		outgoingFileQueue,
		endpointFileQueue
	} = $happn.exchange;

	$happn.log.info("Initializing Queue Service..............STARTED");

	let init = async () => {
		try {
			this.__incomingQueue = incomingFileQueue;
			this.__outgoingQueue = outgoingFileQueue;
			this.__endpointQueue = endpointFileQueue;

			logInfo("Initializing Queue Service..............PASS");
		} catch (err) {
			logError("Initializing Queue Service..............FAIL", err);
			return Promise.reject(err);
		}
	};

	return init();
};

/*************************************************************
 * QUEUE WATCHERS
 **************************************************************
 */

/***
 * @summary Looping service to WATCH INCOMING QUEUE
 * Started in the App.js
 * @param $happn
 */
QueueService.prototype.watchIncomingQueue = function($happn) {
	const { packetService, dataService } = $happn.exchange;
	const { info: logInfo, error: logError, warn: logWarn } = $happn.log;
	const { queueFetchInterval } = $happn.config;

	logInfo("starting incoming queue watcher...");

	let watchInQueueAsync = async () => {
		try {
			let message = await this.getFromIncomingQueue($happn);

			if (message !== null) {
				logInfo("message found > extracting message data: ");

				let parsedPacket = await packetService.extractData(message);

				if (parsedPacket.length === 0) {
					logWarn("no data found in parsed packet!");
					return watchInQueueAsync();
				}

				let nodeData = await packetService.buildNodeData(parsedPacket);

				if (parsedPacket.length > 0 && parsedPacket[0].data === null) {
					logWarn("no data found in parsed packet data!");
					return watchInQueueAsync();
				}

				await dataService.upsertNodeDataArr(nodeData);
				watchInQueueAsync();
			} else {
				await timeout(queueFetchInterval);
				watchInQueueAsync();
			}
		} catch (err) {
			logError(`Watch Incoming Queue .............. - ${err}`);
			return Promise.reject(err);
		}
	};

	return watchInQueueAsync().then(() => {
		logInfo("Watch Incomming Queue ..............PASS");
	});
};

/***
 * @summary Looping service to WATCH ENDPOINT QUEUE
 * Started in the App.js
 * @param $happn
 */
QueueService.prototype.watchEndpointQueue = function($happn, connected) {
	$happn.log.info("starting endpoint queue watcher...");
	const { serverService } = $happn.exchange;
	const { info: logInfo, error: logError } = $happn.log;
	const { queueFetchInterval } = $happn.config;

	let watchQueue = connected;

	let watchEndQueueAsync = async () => {
		try {
			if (watchQueue === true) {
				let message = await this.getFromEndpointQueue($happn);

				if (message !== null) {
					logInfo("message found > sending to endpoint ");
					await serverService.sendMessage(message);

					watchEndQueueAsync();
				} else {
					await timeout(queueFetchInterval);
					watchEndQueueAsync();
				}
			}
		} catch (err) {
			logError(`Watch Endpoint Queue .............. - ${err}`);
			return Promise.reject(err);
		}
	};

	return watchEndQueueAsync();
};

/***
 * @summary Looping service to WATCH OUTGOING QUEUE
 * Started in the App.js
 * @param $happn
 */
QueueService.prototype.watchOutgoingQueue = function($happn) {
	const { portService } = $happn.exchange;
	const { info: logInfo, error: logError } = $happn.log;
	const { queueFetchInterval } = $happn.config;

	logInfo("Starting outgoing queue watcher..............");

	let watchQueueAsync = async () => {
		try {
			let message = await this.getFromOutgoingQueue($happn);
			if (message != null) {
				await portService.sendMessage(message);
				watchQueueAsync();
			} else {
				await timeout(queueFetchInterval);
				watchQueueAsync();
			}
		} catch (err) {
			logError(`Watch Outgoing Queue .............. - ${err}`);
			return Promise.reject(err);
		}
	};

	return watchQueueAsync().then(() => {
		logInfo("Watch Outgoing Queue ..............PASS");
	});
};

/*************************************************************
 * QUEUE ADDERS
 **************************************************************
 */

/***
 * @summary Add to the Incoming Queue
 * @param $happn
 * @param $item - the parsed serial data
 */
QueueService.prototype.addToIncomingQueue = function($happn, item) {
	// eslint-disable-next-line no-unused-vars
	const { info, error } = $happn.log;

	const addToIncomingAsync = async () => {
		try {
			await this.__incomingQueue.push(item);
			//info("adding to queue");
		} catch (err) {
			error("addToIncomingQueue error", err);
			return Promise.reject(err);
		}
	};

	return addToIncomingAsync();
};

/***
 * @summary Add to the Incoming Queue
 * @param $happn
 * @param $item - the parsed serial data
 */
QueueService.prototype.addToEndpointQueue = function($happn, item) {
	const { info, error } = $happn.log;

	const addToEndpointAsync = async () => {
		try {
			await this.__endpointQueue.push(item);
			info("adding to endpoint queue");
		} catch (err) {
			error("addToIncomingQueue error", err);
			return Promise.reject(err);
		}
	};

	return addToEndpointAsync();
};

/***
 * @summary Add to the Outgoing Queue
 * @param $happn
 * @param $item - the parsed serial data
 */
QueueService.prototype.addToOutgoingQueue = function($happn, item) {
	const { error } = $happn.log;

	const addToOutGoing = async () => {
		try {
			await this.__outgoingQueue.push(item);
		} catch (err) {
			error("addToOutgoingQueue error", err);
			return Promise.reject(err);
		}
	};
	return addToOutGoing();
};

/*************************************************************
 * QUEUE POPPERS
 **************************************************************
 */

/***
 * @summary Get from the Incoming Queue
 * @param $happn
 * @param $item - the parsed serial data
 */
QueueService.prototype.getFromIncomingQueue = function($happn) {
	const { info: logInfo, error: logError } = $happn.log;
	const { showQueueDebug, incomingQueueDir } = $happn.config;

	if (showQueueDebug === "true") logInfo("checking for incoming messages...");

	let getFromIncomingAsync = async () => {
		try {
			//remove when off mac
			let queueLength = await readdir(incomingQueueDir + "/new/")
				.then(files => {
					let list = files.filter(item => item.indexOf(".") > 0);
					return list.length;
				})
				.catch(err => {
					logError("error in outgoing queue", err);
				});

			if (queueLength > 0) {
				logInfo(`incoming queue length ---------------- ${queueLength}`);

				let message = await this.__incomingQueue.pop();
				logInfo("popped incoming message: " + JSON.stringify(message));
				return message;
			} else {
				return null;
			}
		} catch (err) {
			logError("Error getting from incoming error", err);
			return Promise.reject(err);
		}
	};
	return getFromIncomingAsync();
};

/***
 * @summary Get from the Incoming Queue
 * @param $happn
 * @param $item - the parsed serial data
 */
QueueService.prototype.getFromEndpointQueue = function($happn) {
	const { info: logInfo, error: logError } = $happn.log;
	const { endpointQueueDir, showQueueDebug } = $happn.config;

	if (showQueueDebug === "true") logInfo("checking for endpoint messages...");

	let getFromIncomingAsync = async () => {
		try {
			//remove when off mac
			let queueLength = await readdir(endpointQueueDir + "/new/")
				.then(files => {
					let list = files.filter(item => item.indexOf(".") > 0);
					return list.length;
				})
				.catch(err => {
					logError("error in outgoing queue", err);
				});

			if (queueLength > 0) {
				logInfo(`endPoint queue length ---------------- ${queueLength}`);

				let message = await this.__endpointQueue.pop();
				logInfo("popped endpoint message: " + JSON.stringify(message));
				return message;
			} else {
				return null;
			}
		} catch (err) {
			logError("Error getting from incoming error", err);
			return Promise.reject(err);
		}
	};
	return getFromIncomingAsync();
};

/***
 * @summary Get from the outgoing queue - called by the outgoing queue watcher
 * @param $happn
 */
QueueService.prototype.getFromOutgoingQueue = function($happn) {
	const { info: logInfo, error: logError } = $happn.log;
	const { outgoingQueueDir, showQueueDebug } = $happn;

	if (showQueueDebug === "true") logInfo("checking for outgoing messages...");

	const getFromOutgoingAsync = async () => {
		try {
			//remove when off mac
			let queueLength = await readdir(outgoingQueueDir + "/new/")
				.then(files => {
					let list = files.filter(item => item.indexOf(".") > 0);
					return list.length;
				})
				.catch(err => {
					logError("error in outgoing queue", err);
				});

			if (queueLength > 0) {
				logInfo("current outgoing queue length: ", queueLength);

				let message = await this.__outgoingQueue.pop();
				return message;
			}
		} catch (err) {
			logError("popped outgoing message: " + err);
			return Promise.reject(err);
		}
	};

	return getFromOutgoingAsync();
};

QueueService.prototype.stop = function($happn, callback) {
	try {
		$happn.log.info("stopping queue service...");
		callback();
	} catch (err) {
		callback(err);
	}
};

module.exports = QueueService;
