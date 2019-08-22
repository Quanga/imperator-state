/* eslint-disable no-unused-vars */
var Queue = require("better-queue");
const PacketTemplate = require("../constants/packetTemplates");

function EventService() {
	this.__constants = new PacketTemplate();

	this.__logConstants = this.__constants.loggables;
	this.__warnConstants = this.__constants.warnables;

	this.dataModel = [];
	this.activeBlast = null;
	this.blastModels = [];
	this.eventRef = null;
}

EventService.prototype.startAsync = function($happn) {
	const { eventService } = $happn.exchange;
	const { dataService } = $happn.event;
	const { emit, log } = $happn;

	return (async () => {
		log.info("initialise Event Service .................. STARTED");
		this.emitQueue = new Queue(
			(task, cb) => {
				task.forEach(taskItem => {
					emit(taskItem.path, taskItem.value);
				});
				cb(task);
			}
			// {
			// 	merge: (oldTask, newTask, cb) => {
			// 		oldTask.value = oldTask.value.concat(newTask.value);
			// 		cb(null, oldTask);
			// 	},
			// 	batchSize: 10,
			// 	batchDelay: 100,
			// 	batchDelayTimeout: 1000
			// }
		);

		dataService.on(
			"EVENT_LOG",
			data => {
				//eventService.processLogs(data);
			},
			(err, eventRef) => {
				if (err) return log.error("Cannot subscribe to the data service", err);

				this.eventRef = eventRef;
			}
		);
	})();
};

EventService.prototype.stopAsync = function($happn) {
	const { log } = $happn;

	return (async () => {
		log.info("Event Service stopped");
	})();
};

EventService.prototype.processLogs = function($happn, eventObj) {
	return (async () => {
		const { logsRepository } = $happn.exchange;

		switch (eventObj.logType) {
		case "UNIT_INSERT": {
			if (eventObj.typeId !== 4) {
				await logsRepository.insertLog(eventObj);

				//

				//await eventService.processWarnings(obj);
			} else {
				// this.emitQueue.push({
				// 	id: "det",
				// 	path: "UPDATE_DET",
				// 	value: [eventObj]
				// });
			}
		}
		}
	})();
};

/**
 * @summary Handles the emitting of the Data Service Events to other services
 * @param {$happn} $happn
 * @param {object} updates - eventObj
 */
EventService.prototype.handleEvent = function($happn, eventObj) {
	const { logsRepository } = $happn.exchange;
	const { emit, log } = $happn;
	//types UNIT_ADDED, UNIT_UPDATED, DET_ADDED, DET_UPDATED,
	//      EDD_SIG

	//this should be a list of standard objects
	//???????????????????

	return (async () => {
		try {
			let logResults;
			const { payload } = eventObj;

			switch (eventObj.type) {
			case "EDD_SIG":
				{
					let ob = {
						logType: "EDD_SIG",
						serial: payload.data.serial,
						typeId: payload.data.typeId,
						path: payload.data.path,
						modified: payload.data.created
					};
					await logsRepository.insertLog(ob);

					//console.log("WILL BE HANDLING EDDSIG", eventObj);
					// const unit = payload[0];
					// let logObj = {
					// 	logType: "EDD_SIG",
					// 	serial: unit.serial,
					// 	path: unit.path,
					// 	typeId: unit.typeId,
					// 	modified: unit.modified || unit.created
					// };
					//emit("EVENT_LOG", eddObj);
				}
				break;
			case "INSERT":
				{
					//console.log("WILL BE HANDLING INSERT");

					// payload.forEach(logInsert=>{
					// 	logObj = {
					// 		logType: "UNIT_INSERT",
					// 		serial: logInsert.data.serial,
					// 		typeId: logInsert.data.typeId,
					// 		path: logInsert.data.path,
					// 		modified: logInsert.data.modified || logInsert.data.created,
					// 		payload
					// 	};

					// })
					logResults = payload.reduce((acc, cur) => {
						if (!acc.hasOwnProperty(cur.data.typeId)) {
							acc[cur.data.typeId] = [];
						}

						acc[cur.data.typeId].push(cur);
						return acc;
					}, {});

					const updateTypes = Object.keys(logResults);

					for (const logItem of updateTypes) {
						let ob = {
							typeId: logResults[logItem][0].data.typeId,
							path: logResults[logItem][0].data.path,
							modified: logResults[logItem][0].data.created
						};

						switch (logItem) {
						case "4":
							ob.logType = "DET_INSERT";
							ob.serial = logResults[logItem][0].data.parentSerial;
							ob.changes = logResults[logItem].map(d => {
								return { serial: d.data.serial, windowId: d.data.windowId, diff: d.diff };
							});
							await logsRepository.insertLog(ob);
							break;
						default:
							ob.logType = "UNIT_INSERT";
							ob.serial = logResults[logItem][0].data.serial;
							ob.changes = logResults[logItem].map(d => {
								return { serial: d.data.serial, windowId: d.data.windowId, diff: d.diff };
							});
							await logsRepository.insertLog(ob);
							break;
						}

						//await logsRepository.insertLog(logItem);
					}
				}
				break;
			case "UPDATE":
				{
					logResults = payload.reduce((acc, cur) => {
						if (!acc.hasOwnProperty(cur.data.typeId)) {
							acc[cur.data.typeId] = [];
						}

						acc[cur.data.typeId].push(cur);
						return acc;
					}, {});

					const updateTypes = Object.keys(logResults);

					for (const logItem of updateTypes) {
						let ob = {
							logType: "UNIT_UPDATE",
							typeId: logResults[logItem][0].data.typeId,
							path: logResults[logItem][0].data.path,
							modified: logResults[logItem][0].data.modified
						};

						switch (logItem) {
						case "4":
							ob.logType = "DET_UPDATE";
							ob.serial = logResults[logItem][0].data.parentSerial;
							ob.changes = logResults[logItem].map(d => {
								return { serial: d.data.serial, windowId: d.data.windowId, diff: d.diff };
							});
							await logsRepository.insertLog(ob);
							break;
						default:
							ob.serial = logResults[logItem][0].data.serial;
							ob.changes = logResults[logItem].map(d => {
								return { serial: d.data.serial, windowId: d.data.windowId, diff: d.diff };
							});
							await logsRepository.insertLog(ob);
							break;
						}

						//await logsRepository.insertLog(logItem);
					}

					//const { data, diff } = eventObj.payload;
					// lelogObj = {
					// 	logType: "UNIT_UPDATE",
					// 	serial: data.serial,
					// 	typeId: data.typeId,
					// 	path: data.path,
					// 	modified: data.modified,
					// 	changes: diff
					// };
					// switch (data.typeId) {
					// case 4:
					// 	logObj.logType = "DET_UPDATE";
					// 	logObj.parentSerial = data.parentSerial;
					// 	logObj.windowId = data.windowId;
					// 	break;
					// }
					// if (logObj.changes) {
					// 	emit("EVENT_LOG", logObj);
					// }
				}
				break;
			default:
				log.error("emitter was called with unknow TYPE");
			}

			//await logsRepository.insertLog(logObj);

			// this.emitQueue.push({
			// 	path: "UPDATE_LOG",
			// 	value: [eventObj]
		} catch (err) {
			log.error(err);
		}
		// });
	})();
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

/* 
  "type": "INSERT",
  "payload": {
    "updates": [],
    "inserts": [
      {
        "action": "INSERT",
        "value": {
          "data": {
            "serial": 2131501510,
            "typeId": 4,
            "parentType": 3,
            "created": 1565226440000,
            "modified": null,
            "path": "3/39/4/1",
            "parentSerial": 39,
            "detonatorStatus": 0,
            "bridgeWire": 0,
            "calibration": 0,
            "program": 0,
            "boosterFired": 0,
            "tagged": 0,
            "logged": 0,
            "delay": null,
            "windowId": 1
          },
          "dataType": "list"
        }
      },
      {
        "action": "INSERT",
        "value": {
          "data": {
            "serial": 2131599491,
            "typeId": 4,
            "parentType": 3,
            "created": 1565226440000,
            "modified": null,
            "path": "3/39/4/2",
            "parentSerial": 39,
            "detonatorStatus": 0,
            "bridgeWire": 0,
            "calibration": 0,
            "program": 0,
            "boosterFired": 0,
            "tagged": 0,
            "logged": 0,
            "delay": null,
            "windowId": 2
          },
          "dataType": "list"
        }
      },
      {
        "action": "INSERT",
        "value": {
          "data": {
            "serial": 2131760388,
            "typeId": 4,
            "parentType": 3,
            "created": 1565226440000,
            "modified": null,
            "path": "3/39/4/3",
            "parentSerial": 39,
            "detonatorStatus": 0,
            "bridgeWire": 0,
            "calibration": 0,
            "program": 0,
            "boosterFired": 0,
            "tagged": 0,
            "logged": 0,
            "delay": null,
            "windowId": 3
          },
          "dataType": "list"
        }
      },
      {
        "action": "INSERT",
        "value": {
          "data": {
            "serial": 2131387621,
            "typeId": 4,
            "parentType": 3,
            "created": 1565226440000,
            "modified": null,
            "path": "3/39/4/4",
            "parentSerial": 39,
            "detonatorStatus": 0,
            "bridgeWire": 0,
            "calibration": 0,
            "program": 0,
            "boosterFired": 0,
            "tagged": 0,
            "logged": 0,
            "delay": null,
            "windowId": 4
          },
          "dataType": "list"
        }
      },
      {
        "action": "INSERT",
        "value": {
          "data": {
            "serial": 2132329143,
            "typeId": 4,
            "parentType": 3,
            "created": 1565226440000,
            "modified": null,
            "path": "3/39/4/5",
            "parentSerial": 39,
            "detonatorStatus": 0,
            "bridgeWire": 0,
            "calibration": 0,
            "program": 0,
            "boosterFired": 0,
            "tagged": 0,
            "logged": 0,
            "delay": null,
            "windowId": 5
          },
          "dataType": "list"
        }
      },
      {
        "action": "INSERT",
        "value": {
          "data": {
            "serial": 2131467492,
            "typeId": 4,
            "parentType": 3,
            "created": 1565226440000,
            "modified": null,
            "path": "3/39/4/6",
            "parentSerial": 39,
            "detonatorStatus": 0,
            "bridgeWire": 0,
            "calibration": 0,
            "program": 0,
            "boosterFired": 0,
            "tagged": 0,
            "logged": 0,
            "delay": null,
            "windowId": 6
          },
          "dataType": "list"
        }
      },
      {
        "action": "INSERT",
        "value": {
          "data": {
            "serial": 2131517473,
            "typeId": 4,
            "parentType": 3,
            "created": 1565226440000,
            "modified": null,
            "path": "3/39/4/7",
            "parentSerial": 39,
            "detonatorStatus": 0,
            "bridgeWire": 0,
            "calibration": 0,
            "program": 0,
            "boosterFired": 0,
            "tagged": 0,
            "logged": 0,
            "delay": null,
            "windowId": 7
          },
          "dataType": "list"
        }
      },
      {
        "action": "INSERT",
        "value": {
          "data": {
            "serial": 2131492466,
            "typeId": 4,
            "parentType": 3,
            "created": 1565226440000,
            "modified": null,
            "path": "3/39/4/8",
            "parentSerial": 39,
            "detonatorStatus": 0,
            "bridgeWire": 0,
            "calibration": 0,
            "program": 0,
            "boosterFired": 0,
            "tagged": 0,
            "logged": 0,
            "delay": null,
            "windowId": 8
          },
          "dataType": "list"
        }
      },
      {
        "action": "INSERT",
        "value": {
          "data": {
            "serial": 2131242148,
            "typeId": 4,
            "parentType": 3,
            "created": 1565226440000,
            "modified": null,
            "path": "3/39/4/9",
            "parentSerial": 39,
            "detonatorStatus": 0,
            "bridgeWire": 0,
            "calibration": 0,
            "program": 0,
            "boosterFired": 0,
            "tagged": 0,
            "logged": 0,
            "delay": null,
            "windowId": 9
          },
          "dataType": "list"
        }
      },
      {
        "action": "INSERT",
        "value": {
          "data": {
            "serial": 2131433113,
            "typeId": 4,
            "parentType": 3,
            "created": 1565226440000,
            "modified": null,
            "path": "3/39/4/10",
            "parentSerial": 39,
            "detonatorStatus": 0,
            "bridgeWire": 0,
            "calibration": 0,
            "program": 0,
            "boosterFired": 0,
            "tagged": 0,
            "logged": 0,
            "delay": null,
            "windowId": 10
          },
          "dataType": "list"
        }
      },
      {
        "action": "INSERT",
        "value": {
          "data": {
            "serial": 2131210481,
            "typeId": 4,
            "parentType": 3,
            "created": 1565226440000,
            "modified": null,
            "path": "3/39/4/11",
            "parentSerial": 39,
            "detonatorStatus": 0,
            "bridgeWire": 0,
            "calibration": 0,
            "program": 0,
            "boosterFired": 0,
            "tagged": 0,
            "logged": 0,
            "delay": null,
            "windowId": 11
          },
          "dataType": "list"
        }
      },
      {
        "action": "INSERT",
        "value": {
          "data": {
            "serial": 2131412015,
            "typeId": 4,
            "parentType": 3,
            "created": 1565226440000,
            "modified": null,
            "path": "3/39/4/12",
            "parentSerial": 39,
            "detonatorStatus": 0,
            "bridgeWire": 0,
            "calibration": 0,
            "program": 0,
            "boosterFired": 0,
            "tagged": 0,
            "logged": 0,
            "delay": null,
            "windowId": 12
          },
          "dataType": "list"
        }
      }
    ]
  }
}
*/
