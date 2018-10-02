function QueueService() {}

/***
 * @summary Initialize the Queue Service
 * Check Directories and set the incoming and outgoing directories
 * @param $happn
 */
QueueService.prototype.initialise = function($happn) {
	const self = this;
	$happn.log.info("Initializing Queue Service..............STARTED");

	let init = async function() {
		try {
			//await self.__checkQueueDirs($happn);

			self.__incomingQueue = $happn.exchange.incomingFileQueue;
			self.__outgoingQueue = $happn.exchange.outgoingFileQueue;

			$happn.log.info("Initializing Queue Service..............PASS");
		} catch (err) {
			$happn.log.error("Initializing Queue Service..............FAIL", err);
		}
	};

	return init();
};

/***
 * @summary Add to the Incoming Queue
 * @param $happn
 * @param $item - the parsed serial data
 */
QueueService.prototype.addToIncomingQueue = function($happn, item) {
	async function addToIncoming() {
		try {
			await $happn.exchange.incomingFileQueue.push(item);
		} catch (err) {
			$happn.log.error("addToIncomingQueue error", err);
		}
	}

	return addToIncoming();
};

QueueService.prototype.watchIncomingQueue = function($happn) {
	const self = this;
	$happn.log.info("starting incoming queue watcher...");

	function timeout(ms) {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	const watcher = async function watchInQueue() {
		$happn.log.info("checking incoming queue....");

		try {
			let message = await self.getFromIncomingQueue($happn);

			if (message != null) {
				$happn.log.info("message found > extracting message data: " + message);
				let parsedPacket = await $happn.exchange.packetService.extractData(
					message
				);

				$happn.log.info("inserting raw packet data...");

				if (parsedPacket.length == 0) {
					$happn.log.warn("no data found in parsed packet!");
					return watcher();
				}

				$happn.exchange.dataService.insertPacketArr(parsedPacket);

				let nodeData = await $happn.exchange.packetService.buildNodeData(
					parsedPacket
				);

				//console.log("## PARSED NODE DATA:::: " + JSON.stringify(nodeData));
				$happn.log.info("inserting node data...");

				await $happn.exchange.dataService.upsertNodeDataArr(nodeData);
				watcher();
			} else {
				//$happn.log.info("running wait");
				await timeout(1000);
				watcher();
			}
		} catch (err) {
			$happn.log.error("watch queue error", err);
		}
	};

	return watcher();
};

/***
 * @summary Get from the Incoming Queue
 * @param $happn
 * @param $item - the parsed serial data
 */
QueueService.prototype.getFromIncomingQueue = function($happn) {
	$happn.log.info("checking for incoming messages...");
	var self = this;

	async function getFromIncomingAsync() {
		try {
			let queueLength = await self.__incomingQueue.length();

			if (queueLength > 0) {
				$happn.log.info("current incoming queue length: ", queueLength);
				try {
					let message = await self.__incomingQueue.pop();

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
	}
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
			$happn.exchange.outgoingFileQueue.push(item);
		} catch (err) {
			$happn.log.error("addToOutgoingQueue error", err);
		}
	}
	return addToOutGoing();
};

QueueService.prototype.watchOutgoingQueue = function($happn) {
	var self = this;
	$happn.log.info("starting outgoing queue watcher...");

	function timeout(ms) {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	async function watchQueue() {
		try {
			let message = await self.getFromOutgoingQueue($happn);

			if (message != null) {
				await $happn.exchange.portService.sendMessage(message);
				watchQueue();
			} else {
				await timeout(1000);
				watchQueue();
			}
		} catch (err) {
			$happn.log.err("Queue Service Watch Outgoing error");
		}
	}

	return watchQueue();
};

QueueService.prototype.getFromOutgoingQueue = function($happn) {
	$happn.log.info("checking for outgoing messages...");

	var self = this;

	async function getFromOutgoingAsync() {
		try {
			let queueLength = await self.__outgoingQueue.length();

			if (queueLength > 0) {
				$happn.log.info("current outgoing queue length: ", queueLength);

				let message = await self.__outgoingQueue.pop();
				$happn.log.info("popped outgoing message: " + message);
				return message;
			}
		} catch (err) {
			$happn.log.error("popped outgoing message: " + err);
		}
	}

	return getFromOutgoingAsync();
};

QueueService.prototype.stop = function($happn, callback) {
	try {
		$happn.log.info("stopping queue service...");

		//if (this.__incomingInterval)
		//    clearInterval(this.__incomingInterval);
		//
		//if (this.__outgoingInterval)
		//    clearInterval(this.__outgoingInterval);

		callback();
	} catch (err) {
		callback(err);
	}
};

QueueService.prototype.__checkQueueDirs = function($happn) {
	async function checkDirsAsync() {
		try {
			const fs = require("fs");
			const config = $happn.config;

			if (!fs.existsSync(config.incomingQueueDir)) {
				$happn.log.info("creating incoming queue directory...");
				fs.mkdirSync(config.incomingQueueDir);
			}

			if (!fs.existsSync(config.outgoingQueueDir)) {
				$happn.log.info("creating outgoing queue directory...");
				fs.mkdirSync(config.outgoingQueueDir);
			}
		} catch (err) {
			$happn.log.error("Check Directory Error", err);
		}
	}
	return checkDirsAsync();
};

module.exports = QueueService;
