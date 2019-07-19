/* eslint-disable no-unused-vars */
const PacketTemplate = require("../constants/packetTemplates");
var Queue = require("better-queue");
const DataModel = require("../models/dataModel");
const DataMapper = require("../mappers/data_mapper");
const clone = require("clone");

function DataService() {
	this.__constants = new PacketTemplate();
	this.dataMapper = new DataMapper();
	this._eventRefs = [];
}

/********************************************************************************
 START AND STOP FUNCTIONS
 ********************************************************************************/

DataService.prototype.start = function($happn) {
	const { stateService, dataService } = $happn.exchange;
	const { info: logInfo, error: logError } = $happn.log;
	const { emit } = $happn;

	return (async () => {
		try {
			logInfo("starting data service");
			this.dataModel = new DataModel();

			this.emitQueue = new Queue(
				(task, cb) => {
					task.forEach(taskItem => {
						emit(taskItem.path, taskItem.value);
					});
					cb();
				},
				{
					merge: (oldTask, newTask, cb) => {
						oldTask.value = oldTask.value.concat(newTask.value);
						cb(null, oldTask);
					},
					batchSize: 10,
					batchDelay: 100,
					batchDelayTimeout: 1000
				}
			);

			await dataService.createDataModel();
			await dataService.listen();

			stateService.updateState({ service: $happn.name, state: "STARTED" });
		} catch (err) {
			logError("Error in dataservice startup", err);
		}
	})();
};

DataService.prototype.stop = function($happn) {
	const { log } = $happn;
	const { dataService } = $happn.exchange;

	return (async () => {
		log.info("stopping data service");
		await dataService.unlisten();
	})();
};

/********************************************************************************
 DATA MODEL FUNCTIONS
 ********************************************************************************/
DataService.prototype.listen = function($happn) {
	const { dataService } = $happn.exchange;
	const { log, emit } = $happn;

	return (async () => {
		this.dataModel.on("UNITCOUNT", val => emit("UNITCOUNT", val));

		this.dataModel.on("UNIT_COMMS_LOST", val => dataService.upsertNodeDataArr(val));

		this.dataModel.on("error", err => log.error(err));
	})();
};

DataService.prototype.unlisten = function($happn) {
	const { log } = $happn;
	const dataModelEvents = ["UNITCOUNT", "error"];

	return (async () => {
		try {
			for (const ev of dataModelEvents) {
				this.dataModel.removeAllListeners(ev);
			}
		} catch (err) {
			log.error(err);
		}
	})();
};

DataService.prototype.createDataModel = function($happn) {
	const { nodeRepository } = $happn.exchange;
	const { error: logError, warn: logWarn } = $happn.log;

	return (async () => {
		try {
			const units = await nodeRepository.getAllNodes();

			if (units && units.length > 0) {
				const remappedUnits = await this.dataMapper.mapToUnits(units);

				for (const unit of remappedUnits) {
					await this.dataModel.upsertUnit(unit);
				}
			} else {
				logWarn("No Units found in Node Repository");
			}
		} catch (err) {
			logError("Error creating datamodel", err);
		}
	})();
};

DataService.prototype.clearDataModel = function($happn) {
	return new Promise((resolve, reject) => {
		this.dataModel = new DataModel();
		resolve();
	});
};
/********************************************************************************
 NODE ARRAY DATA SERVICES
 ********************************************************************************/

/***
 * @summary Async function that performs an insert or update for each node in a set of incoming nodes, depending
 *  on whether or not a particular node already exists.
 * @param $happn
 * @param nodeArr - parsed node data that has been received from the IBC
 */
DataService.prototype.upsertNodeDataArr = function($happn, nodeArr, command) {
	const { log } = $happn;
	const { dataService } = $happn.exchange;

	const updateState = async (checkedArr, force) => {
		let updates = [];
		let inserts = [];

		for (const unit of checkedArr) {
			let result = await this.dataModel.upsertUnit(unit, force);
			if (result.action === "INSERT") inserts.push(result);
			if (result.action === "UPDATE") updates.push(result);
		}

		if (updates.length > 0) {
			log.info("NODE UPSERT - UPDATE EXISTING NODES...", updates.length);
			await this.__updateExistingNodes($happn, updates);
		}

		if (inserts.length > 0) {
			log.info("NODE UPSERT - INSERT NEW NODES...", inserts.length);
			await this.__insertNewNodes($happn, inserts);
		}

		return { updates, inserts };
	};

	return (async () => {
		try {
			if (!Array.isArray(nodeArr)) {
				return log.error("variable NodeArray is not an Array");
			}

			const checkClear = await dataService.preProcess(nodeArr);

			switch (checkClear.type) {
			case "EDD_CLEARSIG":
				{
					let clearRes = await this.dataModel.resetChildCount(nodeArr[0]);
					let updateRes = await updateState(clearRes, true);

					if (updateRes.updates.length > 0) {
						await dataService.clearEddSignal(updateRes.updates[0].value);
					}
				}
				break;
			case "FILTERED":
				{
					let updateRes = await updateState(checkClear.value);

					if (updateRes.updates.length > 0) {
						await dataService.postProcess(updateRes.updates);
					}
				}
				break;
			case "CLEAR":
				{
					let updateRes = await updateState(nodeArr);

					if (updateRes.updates.length > 0) {
						await dataService.postProcess(updateRes.updates);
					}
				}
				break;

				// case "PING":
				// 	{
				// 		let updateRes = await updateState(nodeArr, true);

				// 		if (updateRes.updates.length > 0) {
				// 			await dataService.postProcess(updateRes.updates);
				// 		}
				// 	}
				// 	break;
			case "COMM_LOST":
				{
					let updateRes = await updateState(nodeArr, false);

					if (updateRes.updates.length > 0) {
						await dataService.postProcess(updateRes.updates);
					}
				}
				break;
			default: {
				return null;
			}
			}
		} catch (err) {
			log.error("Process Upsert error.............", err);
			return Promise.reject(err);
		}
	})();
};

DataService.prototype.preProcess = function($happn, arr) {
	const { log } = $happn;
	let result = [...arr];
	const parentType = arr[0].data.typeId;

	return (async () => {
		try {
			if (parentType === 3) {
				//clear EDDs when typeId is 4, and UID is 255.255.255.255
				if (arr[0].dataType === "list" && arr.length === 2) {
					if (arr[1].data.typeId === 4 && arr[1].data.serial === 4294967295) {
						log.info(`EDD_SIG for ${arr[0].data.serial} received`);
						return { type: "EDD_CLEARSIG" };
					}
				}

				if (arr[0].dataType === "data") {
					//edge case where strange edd comes in after eddsig in an 05 command
					if (
						result.length === 2 &&
						result[1].data.delay === 255 &&
						result[1].data.windowId === 255
					) {
						result = result.slice(0, 1);
					}

					//edge case - turn off edds if the cbb goes from on to off
					//////////////const checkedArr = await dataService.checkCBBKeyOff(result);
					//if (checkedArr) return { type: "DETS_OFF", value: checkedArr };

					return { type: "FILTERED", value: result };
				}
				if (arr.length === 1 && arr[0].data.communicationStatus === 0) {
					log.info(`Communication lost for unit - ${arr[0].data.serial}`);
					return { type: "COMM_LOST" };
				}
			}
			return { type: "CLEAR" };
		} catch (err) {
			log.error("Proprocessing error", err);
		}
	})();
};

DataService.prototype.postProcess = function($happn, updatesArr) {
	const { emit } = $happn;
	const { error: logError } = $happn;

	return (async () => {
		const { data } = updatesArr[0].value;
		const { diff } = updatesArr[0];
		try {
			switch (data.typeId) {
			case 0:
				{
					if (
						data.keySwitchStatus === 1 &&
							data.fireButton === 1 &&
							diff &&
							diff.fireButton === 1
					) {
						const snapShot = await this.dataModel.snapShot();
						emit("BLAST_STARTED", {
							created: data.modified,
							snapShot: snapShot
						});

						let boosters = await this.dataModel.updateBoosterConnections(data.modified);

						if (boosters.length > 0) {
							for (let booster of boosters) {
								const result = await this.dataModel.upsertUnit(booster, true);
								const boosterArr = [result];
								await this.__updateExistingNodes($happn, boosterArr);
							}
						}
					}
				}
				break;
			case 3:
				{
					if (data.keySwitchStatus === 0 && diff && diff.keySwitchStatus === 0) {
						let dets = await this.dataModel.updateEDDConnections(data.serial, data.modified);
						if (dets.length > 0) {
							await this.__updateExistingNodes($happn, dets);
						}
					}
				}

				break;
			default: {
				return null;
			}
			}
		} catch (err) {
			logError("Postprocessing err", err);
		}
	})();
};

/***
 * @summary clears the dets
 * @param $happn
 * @param nodeArr - node array containing 1 cbb and 1 edd
 */
DataService.prototype.clearEddSignal = function($happn, parent) {
	const { nodeRepository } = $happn.exchange;
	const { emit } = $happn;

	return (async () => {
		const cutData = await nodeRepository.cutPath(parent.data.path);
		// const cutMapped = cutData.map(x => {
		// 	delete x._meta;
		// 	return x;
		// });

		// const archive = {
		// 	date: parent.data.modified,
		// 	path: parent.data.path,
		// 	data: cutMapped
		// };

		emit("EDDSIG", parent.data.path);

		return true;
	})();
};

/***
 * @summary Handle the node inserts from the CONTEXT.NEWNODES
 * @param $happn
 * @param context - data context which stores context.newnodes
 */
DataService.prototype.__insertNewNodes = function($happn, inserts) {
	const { error: logError } = $happn.log;
	const { nodeRepository } = $happn.exchange;

	let insertNewAsync = async () => {
		for (const insert of inserts) {
			try {
				const nodeClone = { ...insert.value.data };

				await nodeRepository.insertNodeData(nodeClone);

				if (nodeClone.typeId !== 4) {
					this.emitQueue.push({
						id: nodeClone.parentSerial || 0,
						type: "UNIT_ADDED",
						value: [nodeClone]
					});
				}
			} catch (err) {
				logError(`Insert Node Error: ${JSON.stringify(insert, null, 2)}`);
				return Promise.reject(err);
			}
		}
	};

	return insertNewAsync();
};

DataService.prototype.__updateExistingNodes = function($happn, updates) {
	const { error: logError } = $happn.log;
	const { nodeRepository } = $happn.exchange;
	const { emit } = $happn;

	return (async () => {
		try {
			for (const update of updates) {
				const { data } = update.value;

				let changedObject = {
					serial: data.serial,
					typeId: data.typeId,
					path: data.path,
					parentSerial: data.parentSerial,
					modified: data.modified,
					changes: update.diff,
					counts: update.counts,
					windowId: data.typeId === 4 ? data.windowId : null
				};

				emit("UNIT_UPDATED", changedObject);

				nodeRepository.insertNodeData({ ...data });
			}
		} catch (err) {
			logError(`error updating`, err);
			return Promise.reject(err);
		}
	})();
};

/**
 * DATA MODEL GETTERS
 */
DataService.prototype.getControlUnit = function($happn) {
	const { error: logError } = $happn;

	return (async () => {
		try {
			return this.dataModel.controlUnit;
		} catch (err) {
			logError("Error getting control unit", err);
		}
	})();
};

DataService.prototype.getUnits = function($happn, withChildren) {
	const { error: logError } = $happn;

	return (async () => {
		try {
			let result = clone(this.dataModel.units);
			let unitKeys = Object.keys(result);

			if (!withChildren) {
				for (let i = 0; i < unitKeys.length; i++) {
					await delete result[unitKeys[i]].children;
				}
			}

			return result;
		} catch (err) {
			logError("Error getting units", err);
		}
	})();
};

DataService.prototype.getSnapShot = function($happn) {
	const { error: logError } = $happn;

	return (async () => {
		try {
			const snapShot = await this.dataModel.snapShot();
			return snapShot;
		} catch (err) {
			logError("Snapshot error", err);
		}
	})();
};

module.exports = DataService;
