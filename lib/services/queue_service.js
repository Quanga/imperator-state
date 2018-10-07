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

	let timeout = ms => {
		return new Promise(resolve => setTimeout(resolve, ms));
	};

	let watchInQueue = async () => {
		try {
			let message = await this.getFromIncomingQueue($happn);

			if (message != null) {
				$happn.log.info("message found > extracting message data: " + message);
				let parsedPacket = await $happn.exchange.packetService.extractData(
					message
				);

				$happn.log.info("inserting raw packet data...");

				if (parsedPacket.length === 0) {
					$happn.log.warn("no data found in parsed packet!");
					watchInQueue();
				}

				await $happn.exchange.dataService.insertPacketArr(parsedPacket);

				let nodeData = await $happn.exchange.packetService.buildNodeData(
					parsedPacket
				);

				await $happn.exchange.dataService.upsertNodeDataArr(nodeData);
				watchInQueue();
			} else {
				await timeout(1000);
				watchInQueue();
			}
		} catch (err) {
			$happn.log.error(`Watch Incoming Queue .............. - ${err}`);
		}
	};

	return watchInQueue().then(() => {
		$happn.log.info("Watch Incoming Queue ..............PASS");
	});
};

/***
 * @summary Looping service to WATCH OUTGOING QUEUE
 * Started in the App.js
 * @param $happn
 */
QueueService.prototype.watchOutgoingQueue = function($happn) {
	$happn.log.info("starting outgoing queue watcher...");

	function timeout(ms) {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	let watchQueue = async () => {
		try {
			let message = await this.getFromOutgoingQueue($happn);

			if (message != null) {
				await $happn.exchange.portService.sendMessage(message);
				watchQueue();
			} else {
				await timeout(1000);
				watchQueue();
			}
		} catch (err) {
			$happn.log.err(`Watch Outgoing Queue .............. - ${err}`);
		}
	};

	return watchQueue().then(() => {
		$happn.log.info("Watch Outgoing Queue ..............PASS");
	});
};

/***
 * @summary Add to the Incoming Queue
 * @param $happn
 * @param $item - the parsed serial data
 */
QueueService.prototype.addToIncomingQueue = function($happn, item) {
	let addToIncoming = async () => {
		try {
			$happn.log.info("adding to queue", item);
			let pushed = await $happn.exchange.incomingFileQueue.push(item);
			return pushed;
		} catch (err) {
			$happn.log.error("addToIncomingQueue error", err);
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
	$happn.log.info("checking for incoming messages...");

	let getFromIncomingAsync = async () => {
		try {
			let mypath = process.env["ROUTER_INCOMING_QUEUE_DIR"];

			let queueLength = await readdir(mypath + "/new/")
				.then(files => {
					let list = files.filter(item => item.indexOf(".") > 0);
					return list.length;
				})
				.catch(err => {
					$happn.log.error("error in outgoing queue", err);
				});

			if (queueLength > 0) {
				try {
					$happn.log.info(`incoming queue length - ${queueLength}`);

					let message = await $happn.exchange.incomingFileQueue.pop();

					$happn.log.info("popped incoming message: " + message);
					return message;
				} catch (err) {
					$happn.log.err("popped incoming message err: " + err);
				}
			} else {
				return null;
			}
		} catch (err) {
			$happn.log.error("get from incoming error", err);
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
	async function addToOutGoing() {
		try {
			await $happn.exchange.outgoingFileQueue.push(item);
		} catch (err) {
			$happn.log.error("addToOutgoingQueue error", err);
		}
	}
	return addToOutGoing();
};

QueueService.prototype.getFromOutgoingQueue = function($happn) {
	$happn.log.info("checking for outgoing messages...");

	let getFromOutgoingAsync = async () => {
		try {
			let mypath = process.env["ROUTER_OUTGOING_QUEUE_DIR"];

			let queueLength = await readdir(mypath + "/new/")
				.then(files => {
					let list = files.filter(item => item.indexOf(".") > 0);
					return list.length;
				})
				.catch(err => {
					$happn.log.error("error in outgoing queue", err);
				});

			if (queueLength > 0) {
				$happn.log.info("current outgoing queue length: ", queueLength);

				let message = await $happn.exchange.outgoingFileQueue.pop();
				$happn.log.info("popped outgoing message: " + message);
				return message;
			}
		} catch (err) {
			$happn.log.error("popped outgoing message: " + err);
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
