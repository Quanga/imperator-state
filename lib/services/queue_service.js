/* eslint-disable no-unused-vars */
const { promisify } = require("util");
const fs = require("fs");
const readdir = promisify(fs.readdir);
const { performance, PerformanceObserver } = require("perf_hooks");
var Queue = require("better-queue");

function QueueService() {
	this.componentState = {
		name: "Queue Service",
		path: "service/queueService",
		index: 3,
		type: "Flow Control",
		serviceStatus: "STOPPED"
	};
}
QueueService.prototype.timer = function(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
};

QueueService.prototype.setComponentStatus = function($happn, payload) {
	const { app } = $happn.exchange;
	const { componentState } = this;

	const update = { ...componentState, ...payload };
	app.setAppInfo(update, componentState.path);
	this.componentState = update;
};

/***
 * @summary Initialize the Queue Service
 * Check Directories and set the incoming and outgoing directories
 * @param $happn
 */
QueueService.prototype.initialise = function($happn) {
	const { error: logError, info: logInfo } = $happn.log;
	const { packetRepository, queueService } = $happn.exchange;

	this.processQueue = new Queue(function(input, cb) {
		let t0 = performance.now();
		queueService.process(input.message).then((err, res) => {
			console.log(`process took ${performance.now() - t0} ms`);
			cb(null, res);
		});
	});

	$happn.log.info("Initializing Queue Service..............");
	const _this = this;
	let init = async () => {
		try {
			//subscribe to the packet writes
			$happn.event.packetRepository.on(
				"process",
				message => {
					this.processQueue.push({ message });
					//queueService.process(message);
				},
				(error, _eventRef) => {
					if (error) {
						//console.log(_eventRef, error);
						return;
					}
				}
			);

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

/* ************************************************************
 * PROCESS QUEUE
 **************************************************************
 */

QueueService.prototype.process = function($happn, message) {
	const { error: logError, info: logInfo, warn: logWarn } = $happn.log;
	const { packetService, dataService, packetRepository } = $happn.exchange;
	//logInfo("message found > extracting message data: ");

	let ProcessAsync = async () => {
		try {
			if (message.data !== null && message.data.passed) {
				logInfo("message found > extracting message data: ");

				let parsedPacket = await packetService.extractData(message.data);

				if (parsedPacket.length === 0)
					return logWarn("no data found in parsed packet!");

				let nodeData = await packetService.buildNodeData(parsedPacket);

				if (parsedPacket.length > 0 && parsedPacket[0].data === null)
					return logWarn("no data found in parsed packet data!");

				await dataService.upsertNodeDataArr(nodeData);

				await packetRepository.update(message.data);
			}
		} catch (err) {
			logError(`Watch Incoming Queue .............. - ${err}`);
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
