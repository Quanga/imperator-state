/* eslint-disable no-unused-vars */
/* eslint-disable no-mixed-spaces-and-tabs */
var Queue = require("better-queue");

function EventService() {
	const PacketTemplate = require("../constants/packetTemplates");
	this.__constants = new PacketTemplate();

	this.__logConstants = this.__constants.loggables;
	this.__warnConstants = this.__constants.warnables;

	this.dataModel = [];
	this.activeBlast = null;
	this.blastModels = [];
}

EventService.prototype.startAsync = function($happn) {
	const { eventService } = $happn.exchange;
	const { dataService } = $happn.event;
	const { error: logError, info: logInfo } = $happn.log;
	const { emit } = $happn;

	let initAsync = async () => {
		logInfo("initialise Event Service .................. STARTED");
		this.emitQueue = new Queue(
			(task, cb) => {
				task.forEach(taskItem => {
					emit(taskItem.path, taskItem.value);
				});
				cb(task);
			},
			{
				merge: (oldTask, newTask, cb) => {
					oldTask.value = oldTask.value.concat(newTask.value);
					cb(null, oldTask);
				},
				batchSize: 16,
				batchDelay: 100,
				batchDelayTimeout: 1500
			}
		);

		dataService.on(
			"nodes/updated",
			async data => {
				await eventService.processLogs(data);
			},
			(err, _eventRef) => {
				if (err) {
					logError("initialize Event Service.................... FAIL", err);
					return Promise.reject(err);
				}
			}
		);
	};
	return initAsync();
};

EventService.prototype.stopAsync = function($happn) {
	const { error: logError, info: logInfo } = $happn.log;

	let initAsync = async () => {
		$happn.event.nodeRepository.offPath("nodes/updated", function(
			err,
			_eventRef
		) {
			if (err) {
				logError("Event Service ShutDown.................... FAIL", err);
				return Promise.reject(err);
			}

			logInfo("EventService ShutDown Complete");
		});
	};
	return initAsync();
};

EventService.prototype.processLogs = function($happn, obj) {
	const { eventService } = $happn.exchange;

	let processAsync = async () => {
		const { logsRepository } = $happn.exchange;

		if (obj.typeId !== 4) await logsRepository.insertLog(obj);

		this.emitQueue.push({
			id: "log",
			path: "log",
			value: [obj]
		});

		await eventService.processWarnings(obj);
	};

	return processAsync();
};

EventService.prototype.processWarnings = function($happn, changeEvents) {
	const { warningsRepository } = $happn.exchange;
	/**
	 * let changedObject = {
						serial: node.data.serial,
						typeId: node.data.typeId,
						modified: node.meta.storedPacketDate,
						changes: node.meta.dirty,
						number: this.emitCount
					};
	 */

	let processWarningsAsync = async () => {
		//will process here
		const { changes } = changeEvents;
		const changeKey = Object.keys(changes);
		//const warnings = this.__constants.getWarnables();

		//const loggableWarnings = changeKey.filter(x => x.indexOf(warnings) === -1);

		// 	for (let index = 0; index < filterOut.length; index++) {
		//   const element = filterOut[index];
		//   delete differences[element];
	};

	//3. compare which warnings need to be logged
	//4. send them to the warnings repository
	//5. emit an event for the ui to get the warnings

	//return processWarningsAsync();
};

module.exports = EventService;
