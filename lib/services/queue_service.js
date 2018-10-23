function QueueService() {}
const { promisify } = require("util");
let fs = require("fs");
const readdir = promisify(fs.readdir);

/***
 * @summary Initialize the Queue Service
 * Check Directories and set the incoming and outgoing directories
 * @param $happn
 */
QueueService.prototype.initialise = function($happn) {
	const { error: logError, info: logInfo } = $happn.log;
	const { incomingFileQueue, outgoingFileQueue } = $happn.exchange;

	$happn.log.info("Initializing Queue Service..............STARTED");

	let init = async () => {
		try {
			this.__incomingQueue = incomingFileQueue;
			this.__outgoingQueue = outgoingFileQueue;

			logInfo("Initializing Queue Service..............PASS");
		} catch (err) {
			logError("Initializing Queue Service..............FAIL", err);
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
	$happn.log.info("starting incoming queue watcher...");
	const { packetService, dataService } = $happn.exchange;
	const { info: logInfo, error: logError, warn: logWarn } = $happn.log;
	const { queueFetchInterval } = $happn.config;

	let timeout = ms => {
		return new Promise(resolve => setTimeout(resolve, ms));
	};

	let watchInQueueAsync = async () => {
		try {
			let message = await this.getFromIncomingQueue($happn);

			if (message != null) {
				let parsedPacket = await packetService.extractData(message);
				logInfo("message found > extracting message data: ");

				if (parsedPacket.length === 0) {
					logWarn("no data found in parsed packet!");
					watchInQueueAsync();
				}

				dataService.insertPacketArr(parsedPacket);
				let nodeData = await packetService.buildNodeData(parsedPacket);

				//ISSUE if this is async then a call cal be made to get info which hasnt been written yet
				await dataService.upsertNodeDataArr(nodeData);
				watchInQueueAsync();
			} else {
				await timeout(queueFetchInterval);
				watchInQueueAsync();
			}
		} catch (err) {
			logError(`Watch Incoming Queue .............. - ${err}`);
		}
	};

	return watchInQueueAsync().then(() => {
		logInfo("Watch Incomming Queue ..............PASS");
	});
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

	function timeout(ms) {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

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
	const { incomingFileQueue } = $happn.exchange;
	const { info, error } = $happn.log;

	const addToIncomingAsync = async () => {
		try {
			await incomingFileQueue.push(item);
			info("adding to queue");
		} catch (err) {
			error("addToIncomingQueue error", err);
		}
	};

	return addToIncomingAsync();
};

/***
 * @summary Add to the Outgoing Queue
 * @param $happn
 * @param $item - the parsed serial data
 */
QueueService.prototype.addToOutgoingQueue = function($happn, item) {
	const { outgoingFileQueue } = $happn.exchange;
	const { error } = $happn.log;

	const addToOutGoing = async () => {
		try {
			await outgoingFileQueue.push(item);
		} catch (err) {
			error("addToOutgoingQueue error", err);
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
	const { incomingFileQueue } = $happn.exchange;
	const { info: logInfo, error: logError } = $happn.log;

	logInfo("checking for incoming messages...");

	let getFromIncomingAsync = async () => {
		try {
			let mypath = process.env["ROUTER_INCOMING_QUEUE_DIR"];

			//remove when off mac
			let queueLength = await readdir(mypath + "/new/")
				.then(files => {
					let list = files.filter(item => item.indexOf(".") > 0);
					return list.length;
				})
				.catch(err => {
					logError("error in outgoing queue", err);
				});

			if (queueLength > 0) {
				logInfo(`incoming queue length ---------------- ${queueLength}`);

				let message = await incomingFileQueue.pop();
				logInfo("popped incoming message: " + message);
				return message;
			} else {
				return null;
			}
		} catch (err) {
			logError("Error getting from incoming error", err);
		}
	};
	return getFromIncomingAsync();
};

/***
 * @summary Get from the outgoing queue - called by the outgoing queue watcher
 * @param $happn
 */
QueueService.prototype.getFromOutgoingQueue = function($happn) {
	const { outgoingFileQueue } = $happn.exchange;
	const { info: logInfo, error: logError } = $happn.log;

	logInfo("checking for outgoing messages...");

	const getFromOutgoingAsync = async () => {
		try {
			let mypath = process.env["ROUTER_OUTGOING_QUEUE_DIR"];

			//remove when off mac
			let queueLength = await readdir(mypath + "/new/")
				.then(files => {
					let list = files.filter(item => item.indexOf(".") > 0);
					return list.length;
				})
				.catch(err => {
					logError("error in outgoing queue", err);
				});

			if (queueLength > 0) {
				logInfo("current outgoing queue length: ", queueLength);

				let message = await outgoingFileQueue.pop();
				logInfo("popped outgoing message: " + message);
				return message;
			}
		} catch (err) {
			logError("popped outgoing message: " + err);
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
