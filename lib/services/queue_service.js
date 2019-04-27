/* eslint-disable no-unused-vars */
const { promisify } = require("util");
const fs = require("fs");
const readdir = promisify(fs.readdir);
const { performance, PerformanceObserver } = require("perf_hooks");

function QueueService() {
	this.componentState = {
		name: "Queue Service",
		path: "service/queueService",
		index: 3,
		type: "Flow Control",
		serviceStatus: "STOPPED"
	};

	this.useTest = false;
	//this.startTestObserver();
}
QueueService.prototype.timer = function(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
};

QueueService.prototype.setComponentStatus = function($happn, payload) {
	const { app } = $happn.exchange;
	const { componentState } = this;

	const update = { ...componentState, ...payload };
	//app.setAppInfo(update, componentState.path);
	this.componentState = update;
};

/***
 * @summary Initialize the Queue Service
 * Check Directories and set the incoming and outgoing directories
 * @param $happn
 */
QueueService.prototype.initialise = function($happn) {
	const { error: logError, info: logInfo } = $happn.log;
	const { RxQueue, TxQueue, EpQueue } = $happn.exchange;

	$happn.log.info("Initializing Queue Service..............");
	const _this = this;
	let init = async () => {
		this.startTestObserver($happn);
		try {
			this.queues = [
				{
					id: "RxQueue",
					queue: RxQueue,
					count: 0,
					enabled: true,
					active: false,
					listenActive: true,
					process: function() {
						_this.processRx($happn);
					}
				},
				{
					id: "TxQueue",
					queue: TxQueue,
					count: 0,
					enabled: false,
					active: false
				},
				{
					id: "EpQueue",
					queue: EpQueue,
					count: 0,
					enabled: false,
					active: false
				}
			];

			/* 
			------- 1. Subscribe to the caches
			*/
			this.queues.forEach(queue => {
				$happn.event[queue.id].on(
					"cache_set",
					message => {
						if (queue.listenActive) {
							queue.listenActive = false;
							queue.process();
							//console.log(`DATA ${queue.id}`, message);
						}
					},
					(error, _eventRef) => {
						if (error) {
							//console.log(_eventRef, error);
							return;
						}
					}
				);
			});

			logInfo(`Initializing Queue Service..............${this.componentState}`);
		} catch (err) {
			logError(
				`Initializing Queue Service..............${
					this.componentState
				} - ${err}`
			);
			return Promise.reject(err);
		}
	};
	return init();
};

QueueService.prototype.startTestObserver = function($happn) {
	this.tests = [];
	this.observer = new PerformanceObserver(list => {
		const entry = list.getEntries()[0];
		if (entry.name.split("-")[0] === "queueService")
			this.tests.push(JSON.stringify(list.getEntries()));
	});
	this.observer.observe({ entryTypes: ["measure"] });
};

QueueService.prototype.stopTestObserver = function($happn) {
	delete this.observer;
	performance.clearMarks();
};

QueueService.prototype.markPerf = function(perfname, end) {
	if (end) {
		performance.mark(`${perfname} - end`);
		performance.measure(perfname, `${perfname} - start`, `${perfname} - end`);
	} else {
		performance.mark(`${perfname} - start`);
	}
};

QueueService.prototype.writeTest = function($happn) {
	const { error: logError } = $happn.log;
	const { data } = $happn.exchange;
	const _this = this;

	return new Promise((resolve, reject) => {
		data.set(
			`persist/queueService/test/${Date.now()}`,
			_this.tests,
			{},
			(err, resp) => {
				if (err) {
					logError("cannot write to path for tests");
					return reject(err);
				}

				this.tests = [];
				return resolve(resp);
			}
		);
	});
};

QueueService.prototype.getTests = function($happn) {
	const { error: logError } = $happn.log;
	const { data } = $happn.exchange;

	return new Promise((resolve, reject) => {
		data.get(`persist/queueService/test/*`, null, (err, resp) => {
			if (err) {
				logError("cannot write to path for tests");
				return reject(err);
			}
			return resolve(resp);
		});
	});
};

QueueService.prototype.deletetTests = function($happn) {
	const { error: logError } = $happn.log;
	const { data } = $happn.exchange;

	return new Promise((resolve, reject) => {
		data.remove(`persist/queueService/test/*`, null, (err, resp) => {
			if (err) {
				logError("cannot write to path for tests");
				return reject(err);
			}

			return resolve(resp);
		});
	});
};

/* ************************************************************
 * PROCESS QUEUE
 **************************************************************
 */

QueueService.prototype.processRx = function($happn) {
	const { error: logError, info: logInfo, warn: logWarn } = $happn.log;
	const { packetService, dataService } = $happn.exchange;
	logInfo("message found > extracting message data: ");

	let ProcessAsync = async message => {
		try {
			if (message !== null) {
				if (this.useTest) this.markPerf("queueService-extractData");
				if (this.useTest) this.markPerf("queueService-queueService");

				logInfo("message found > extracting message data: ");

				let parsedPacket = await packetService.extractData(message);

				if (this.useTest) this.markPerf("queueService-extractData", true);

				if (parsedPacket.length === 0)
					return logWarn("no data found in parsed packet!");

				if (this.useTest) this.markPerf("queueService-parsing");

				let nodeData = await packetService.buildNodeData(parsedPacket);

				if (this.useTest) this.markPerf("queueService-parsing", true);

				if (parsedPacket.length > 0 && parsedPacket[0].data === null)
					return logWarn("no data found in parsed packet data!");

				if (this.useTest) this.markPerf("queueService-dataService");
				console.log("STARTING WORKING 2:::::");

				await dataService.upsertNodeDataArr(nodeData);
				if (this.useTest) this.markPerf("queueService-dataService", true);

				if (this.useTest) this.markPerf("queueService-queueService", true);

				if (this.useTest) await this.writeTest($happn);

				//console.log(await this.getTests($happn));
			}
		} catch (err) {
			logError(`Watch Incoming Queue .............. - ${err}`);
			return Promise.reject(err);
		}
	};

	let ProcessRxUnitlComplete = async () => {
		const { exchange } = $happn;

		let message = await exchange.RxQueue.getFirstItem();

		if (message) {
			await ProcessAsync(message);
			await exchange.RxQueue.removeItem(message);
			await ProcessRxUnitlComplete();

			// setTimeout(async () => {
			// }, 30);
		} else {
			this.queues[0].listenActive = true;
		}
	};

	return new Promise((resolve, reject) => {
		ProcessRxUnitlComplete()
			.then(resolve())
			.catch(e => reject(e));
	});
};

// QueueService.prototype.addToQueue = function ($happn, queue, message) {
// 	// eslint-disable-next-line no-unused-vars
// 	const { info, error } = $happn.log;

// 	const addToQueue = async () => {
// 		try {

// 			const queueItem = await this.queues.find(x => queue = x.id);
// 			await queueItem.writeDataIncrement({
// 				path: `persist/${queue}`,
// 				data: { data: message }
// 			});

// 			await queueItem.counter(`persist/${queue}`, 1);

// 		} catch (err) {
// 			error("addToIncomingQueue error", err);
// 			return Promise.reject(err);
// 		}
// 	};

// 	return addToQueue();
// };

// QueueService.prototype.watchQueues = function ($happn) {
// 	const { error: logError, info: logInfo } = $happn.log;
// 	logInfo("starting incoming queue watcher...");

// 	//this.queues;
// 	let watchQueuesAsync = async function () {

// 		try {
// 			// this.queues.forEach(x => {
// 			// 	$happn.exchange.x.on(`${x.id}persist/${x.id}`, () => { console.log("hearing data"); });
// 			// });
// 			setInterval(async () => {
// 				logInfo("Wastching");
// 				//check if the data service is idle or processing
// 				//if it is idle, send from the queue to the data service
// 				let dataServiceState = await $happn.exchange.dataService.getState();
// 				logInfo(`DATASERVICE STATE ::::: ${dataServiceState}`);

// 				if (dataServiceState == "IDLE") {
// 					logInfo(`DATASERVICE STATE INSIDE BLOCK ::::: ${dataServiceState}`);
// 					let memcache = await $happn.exchange.RxQueue.getItems();
// 					//console.log("ITEMS::::::", memcache);
// 					if (memcache.items.length > 0) {
// 						console.log("ITEM::::::", memcache.items[0]);

// 						await this.processRx($happn, memcache.items[0]);
// 						logInfo("sending");
// 					}

// 				}
// 			}, 1000);

// 		} catch (err) {
// 			logError(`Watch Queue Failure ..... ${err}`);
// 			return Promise.reject(err);
// 		}
// 	};

// 	return watchQueuesAsync();

// };

// var eventKey = 'metrics/';
// var eventData = "metric";

// $happn.log.debug("emitting '%s': '%j'", eventKey, eventData);
// $happn.emit(eventKey, eventData);

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
					await this.timeout(queueFetchInterval);
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
				await this.timeout(queueFetchInterval);
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
	const { showQueueDebug } = $happn.config;

	if (showQueueDebug === "true") logInfo("checking for incoming messages...");

	let getFromIncomingAsync = async () => {
		try {
			let queueData = await this.__incomingQueue.readData("persist/incoming/*");

			if (queueData.length > 0) {
				logInfo(`incoming queue length----------------${queueData.length}`);
				let message = queueData[0];
				logInfo("popped incoming message: " + JSON.stringify(message.data));
				let filename = message._meta.path.split("/").pop();
				await this.__incomingQueue.popData("persist/incoming/" + filename);
				return message.data;
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
				logInfo(`endPoint queue length----------------${queueLength}`);

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
	return new Promise((resolve, reject) => {
		$happn.log.info("stopping queue service...");
		resolve();
	});
};

module.exports = QueueService;
