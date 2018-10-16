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
	$happn.log.info("Initializing Queue Service..............STARTED");

	let init = async () => {
		try {
			this.__incomingQueue = $happn.exchange.incomingFileQueue;
			this.__outgoingQueue = $happn.exchange.outgoingFileQueue;

			$happn.log.info("Initializing Queue Service..............PASS");
		} catch (err) {
			$happn.log.error("Initializing Queue Service..............FAIL", err);
		}
	};

	return init();
};

/***
 * @summary Looping service to WATCH INCOMING QUEUE
 * Started in the App.js
 * @param $happn
 */
QueueService.prototype.watchIncomingQueue = function($happn) {
	$happn.log.info("starting incoming queue watcher...");
	const { packetService, dataService } = $happn.exchange;
	const { info, error, warn } = $happn.log;

	let timeout = ms => {
		return new Promise(resolve => setTimeout(resolve, ms));
	};

	let watchInQueueAsync = async () => {
		try {
			let message = await this.getFromIncomingQueue($happn);

			if (message != null) {
				info("message found > extracting message data: " + message);
				let parsedPacket = await packetService.extractData(message);

				//info("inserting raw packet data...");
				if (parsedPacket.length === 0) {
					warn("no data found in parsed packet!");
					watchInQueueAsync();
				}

				//made non-await to see if it speeds up this process
				await dataService.insertPacketArr(parsedPacket);

				let nodeData = await packetService.buildNodeData(parsedPacket);

				//made non-await to see if it speeds up this process
				await dataService.upsertNodeDataArr(nodeData);
				watchInQueueAsync();
			} else {
				await timeout(1000);
				watchInQueueAsync();
			}
		} catch (err) {
			error(`Watch Incoming Queue .............. - ${err}`);
		}
	};

	return watchInQueueAsync();
};

/***
 * @summary Looping service to WATCH OUTGOING QUEUE
 * Started in the App.js
 * @param $happn
 */
QueueService.prototype.watchOutgoingQueue = function($happn) {
	const { portService } = $happn.exchange;
	const { info, error } = $happn.log;

	info("starting outgoing queue watcher...");

	function timeout(ms) {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	let watchQueue = async () => {
		try {
			let message = await this.getFromOutgoingQueue($happn);

			if (message != null) {
				await portService.sendMessage(message);
				watchQueue();
			} else {
				await timeout(1000);
				watchQueue();
			}
		} catch (err) {
			error(`Watch Outgoing Queue .............. - ${err}`);
		}
	};

	return watchQueue().then(() => {
		info("Watch Outgoing Queue ..............PASS");
	});
};

/***
 * @summary Add to the Incoming Queue
 * @param $happn
 * @param $item - the parsed serial data
 */
QueueService.prototype.addToIncomingQueue = function($happn, item) {
	const { incomingFileQueue } = $happn.exchange;
	const { info, error } = $happn.log;

	const addToIncoming = async () => {
		try {
			await incomingFileQueue.push(item);
			info("adding to queue");
		} catch (err) {
			error("addToIncomingQueue error", err);
		}
	};

	return addToIncoming();
};

/***
 * @summary Get from the Incoming Queue
 * @param $happn
 * @param $item - the parsed serial data
 */
QueueService.prototype.getFromIncomingQueue = function($happn) {
	const { incomingFileQueue } = $happn.exchange;
	const { info, error } = $happn.log;

	info("checking for incoming messages...");

	let getFromIncomingAsync = async () => {
		try {
			let mypath = process.env["ROUTER_INCOMING_QUEUE_DIR"];

			let queueLength = await readdir(mypath + "/new/")
				.then(files => {
					let list = files.filter(item => item.indexOf(".") > 0);
					return list.length;
				})
				.catch(err => {
					error("error in outgoing queue", err);
				});

			if (queueLength > 0) {
				info(`incoming queue length - ${queueLength}`);

				try {
					let message = await incomingFileQueue.pop();
					info("popped incoming message: " + message);
					return message;
				} catch (err) {
					error("popped incoming message err: " + err);
				}
			} else {
				return null;
			}
		} catch (err) {
			error("get from incoming error", err);
		}
	};
	return getFromIncomingAsync();
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

QueueService.prototype.getFromOutgoingQueue = function($happn) {
	const { outgoingFileQueue } = $happn.exchange;
	const { info, error } = $happn.log;

	info("checking for outgoing messages...");

	const getFromOutgoingAsync = async () => {
		try {
			let mypath = process.env["ROUTER_OUTGOING_QUEUE_DIR"];

			let queueLength = await readdir(mypath + "/new/")
				.then(files => {
					let list = files.filter(item => item.indexOf(".") > 0);
					return list.length;
				})
				.catch(err => {
					error("error in outgoing queue", err);
				});

			if (queueLength > 0) {
				info("current outgoing queue length: ", queueLength);

				let message = await outgoingFileQueue.pop();
				info("popped outgoing message: " + message);
				return message;
			}
		} catch (err) {
			error("popped outgoing message: " + err);
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
