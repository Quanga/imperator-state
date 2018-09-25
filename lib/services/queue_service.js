function QueueService() {}


/***
 * @summary Initialize the Queue Service 
 * Check Directories and set the incoming and outgoing directories
 * @param $happn
 */
QueueService.prototype.initialise = function ($happn) {
	const self = this;
	$happn.log.info('Initializing Queue Service..............STARTED');

	return new Promise((resolve, reject) => {
		return self.__checkQueueDirs($happn)
			.then(() => {
				self.__incomingQueue = $happn.exchange.incomingFileQueue;
				self.__outgoingQueue = $happn.exchange.outgoingFileQueue;
			})
			.then(() => {
				$happn.log.info('Initializing Queue Service..............PASS');
				resolve();
			})
			.catch((err) => {
				$happn.log.error('Initializing Queue Service..............FAIL', err);
				reject(err);
			});
	});
};

QueueService.prototype.__checkQueueDirs = function ($happn) {
	return new Promise((resolve, reject) => {
		try {
			const fs = require('fs');
			const config = $happn.config;

			if (!fs.existsSync(config.incomingQueueDir)) {
				$happn.log.info('creating incoming queue directory...');
				fs.mkdirSync(config.incomingQueueDir);
			}

			if (!fs.existsSync(config.outgoingQueueDir)) {
				$happn.log.info('creating outgoing queue directory...');
				fs.mkdirSync(config.outgoingQueueDir);
			}
			resolve();
		} catch (err) {
			reject(err);
		}
	});
};

/***
 * @summary Add to the Incoming Queue 
 * Check Directories and set the incoming and outgoing directories
 * @param $happn
 * @param $item - the parsed serial data
 */
QueueService.prototype.addToIncomingQueue = function ($happn, item) {
	return new Promise((resolve, reject) => {
		return $happn.exchange.incomingFileQueue.push(item)
			.then(() => {
				resolve();
			})
			.catch((err) => {
				$happn.log.error('addToIncomingQueue error', err);
				reject(err);
			});
	});
};

QueueService.prototype.addToOutgoingQueue = function ($happn, item, callback) {

	$happn.exchange.outgoingFileQueue.push(item)
		.then(function () {
			callback();
		})
		.catch(function (err) {
			$happn.log.error('addToOutgoingQueue error', err);
			callback(err);
		});
};

QueueService.prototype.getFromIncomingQueue = function ($happn, callback) {
	const self = this;

	//$happn.log.info('checking for incoming messages...');

	self.__incomingQueue.length((err, length) => {
		if (err)
			callback(err);
		else {
			if (length > 0) {

				$happn.log.info('current incoming queue length: ', length);

				self.__incomingQueue.pop(function (err, message) {
					$happn.log.info('popped incoming message: ' + message);
					callback(err, message);
				});
			} else {
				callback(null, null);
			}
		}
	});
};

QueueService.prototype.getFromOutgoingQueue = function ($happn, callback) {
	const self = this;
	//$happn.log.info('checking for outgoing messages...');
	self.__outgoingQueue.length(function (err, length) {
		if (err)
			callback(err);
		else {
			if (length > 0) {

				$happn.log.info('current outgoing queue length: ', length);

				self.__outgoingQueue.pop(function (err, message) {
					$happn.log.info('popped outgoing message: ' + message);
					callback(err, message);
				});
			} else
				callback(null, null);
		}
	});
};

QueueService.prototype.watchIncomingQueue = function ($happn, callback) {
	const self = this;

	$happn.log.info('starting incoming queue watcher...');

	try {
		var watch = () => {

			$happn.log.info('checking incoming queue....');

			self.__getFromIncomingQueue($happn)
				.then((message) => {
					if (message != null) {
						//$happn.log.info('message found > extracting message data: ' + message);

						$happn.exchange.packetService.extractData(message)
							.then(function (parsedPacket) {

								//$happn.log.info('inserting raw packet data...');

								if (parsedPacket.length == 0) {
									$happn.log.warn('no data found in parsed packet!');
									return watch();
								}

								$happn.exchange.dataService.insertPacketArr(parsedPacket)
									.then(function () {
										//console.log('## PARSED PACKET DATA:::: ' + JSON.stringify(parsedPacket));
										return $happn.exchange.packetService.buildNodeData(parsedPacket);
									})
									.then(function (nodeData) {
										//console.log('## PARSED NODE DATA:::: ' + JSON.stringify(nodeData));
										//$happn.log.info('inserting node data...');
										return $happn.exchange.dataService.upsertNodeDataArr(nodeData);
									})
									.then(function () {
										return watch();
									})
									.catch(function (err) {
										$happn.log.error('watchIncomingQueue error 2', err);
									});
							});
					} else {
						//$happn.log.info('no message found - retrying...');

						var timer = setTimeout(function () {
							clearTimeout(timer);
							watch();
						}, 1000);
					}
				})
				.catch(function (err) {
					$happn.log.error('watchIncomingQueue error', err);
				});
		};

		watch();

		callback(null);
	} catch (err) {
		$happn.log.error('watchQueue error', err);
		callback(err);
	}
};

QueueService.prototype.watchOutgoingQueue = function ($happn) {
	var self = this;
	$happn.log.info('starting outgoing queue watcher...');

	return new Promise((resolve, reject) => {
		var watch = function () {

			//$happn.log.info('checking outgoing queue....');

			self.__getFromOutgoingQueue($happn)
				.then((message) => {
					if (message != null) {
						//$happn.log.info('sending outgoing message: ' + message.toString());
						return $happn.exchange.portService.sendMessage(message)
							.then(() => {
								watch();
							})
							.catch((err) => {
								$happn.log.error('watchOutgoingQueue error 2', err);
								reject(err);
							});
					} else {
						//$happn.log.info('no outgoing message found - retrying...');

						var timer = setTimeout(() => {
							clearTimeout(timer);
							watch();
						}, 1000);
					}
				})
				.catch((err) => {
					$happn.log.error('watchOutgoingQueue error 1', err);
				});

		};

		watch();

		resolve(null);
	});
};

QueueService.prototype.stop = function ($happn, callback) {

	try {
		$happn.log.info('stopping queue service...');

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

QueueService.prototype.__getFromIncomingQueue = function ($happn) {
	const self = this;

	return new Promise(function (resolve, reject) {
		self.getFromIncomingQueue($happn, function (err, result) {

			if (err)
				return reject(err);

			resolve(result);
		});
	});
};

QueueService.prototype.__getFromOutgoingQueue = function ($happn) {
	const self = this;

	return new Promise(function (resolve, reject) {
		self.getFromOutgoingQueue($happn, function (err, result) {

			if (err)
				return reject(err);

			resolve(result);
		});
	});
};

module.exports = QueueService;