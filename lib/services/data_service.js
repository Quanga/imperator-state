/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable no-unused-vars */
const PacketTemplate = require("../constants/packetTemplates");
var Queue = require("better-queue");
const DataModel = require("../models/dataModel");
const clone = require("clone");

function DataService() {
	this.__constants = new PacketTemplate();
	this.dataModel = new DataModel();
}

DataService.prototype.start = function($happn) {
	const { stateService, nodeRepository } = $happn.exchange;
	const { info: logInfo } = $happn.log;
	const { emit } = $happn;

	const startAsync = async () => {
		logInfo("starting data service");
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
				batchSize: 16,
				batchDelay: 100,
				batchDelayTimeout: 1500
			}
		);
		const units = await nodeRepository.getAllNodes();

		for (const unit of units) {
			await this.dataModel.upsertUnit(unit);
		}

		stateService.updateState({ service: $happn.name, state: "STARTED" });
	};

	return startAsync();
};

DataService.prototype.stop = function($happn) {
	const { info: logInfo } = $happn.log;

	return new Promise(resolve => {
		logInfo("stopping data service");
		resolve();
	});
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
	const { info: logInfo, error: logError } = $happn.log;
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
			logInfo("NODE UPSERT - UPDATE EXISTING NODES...", updates.length);
			await this.__updateExistingNodes($happn, updates);
		}

		if (inserts.length > 0) {
			logInfo("NODE UPSERT - INSERT NEW NODES...", inserts.length);
			await this.__insertNewNodes($happn, inserts);
		}

		return { updates, inserts };
	};

	const processUpsert = async () => {
		try {
			//var hrstart = process.hrtime();

			const checkClear = await dataService.preProcess(nodeArr);

			switch (checkClear.type) {
			case "EDD_CLEARSIG":
				{
					let clearRes = await this.dataModel.clearEdds(nodeArr[0]);
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
			case "CLEAR": {
				let updateRes = await updateState(nodeArr);

				if (updateRes.updates.length > 0) {
					await dataService.postProcess(updateRes.updates);
				}
				break;
			}
			}

			// let hrend = process.hrtime(hrstart);
			// console.info(
			// 	"Execution time (hr): %ds %dms",
			// 	hrend[0],
			// 	hrend[1] / 1000000
			// );
		} catch (err) {
			logError("Process Upsert error.............", err);
			return Promise.reject(err);
		}
	};

	return processUpsert();
};

DataService.prototype.preProcess = function($happn, arr) {
	let result = [...arr];
	const parentType = arr[0].data.typeId;

	let preProcessAsync = async () => {
		if (parentType === 3) {
			//clear EDDs when typeId is 4, and UID is 255.255.255.255
			if (arr[0].dataType === "list" && arr.length === 2) {
				if (arr[1].data.typeId === 4 && arr[1].data.serial === 4294967295)
					return { type: "EDD_CLEARSIG" };
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
		}
		return { type: "CLEAR" };
	};
	return preProcessAsync();
};

DataService.prototype.postProcess = function($happn, updatesArr) {
	const { blastService, dataService } = $happn.exchange;

	const postProcessAsync = async () => {
		const { data } = updatesArr[0].value;
		const { diff } = updatesArr[0];

		switch (data.typeId) {
		case 0:
			{
				if (
					data.keySwitchStatus === 1 &&
						data.fireButton === 1 &&
						diff &&
						diff.fireButton === 1
				) {
					await blastService.createNewBlast(data.modified);
					//create a list of CBBS and send to the update cycle recurively
					let boosters = await this.dataModel.updateBoosterConnections(
						false,
						data.modified
					);
					if (boosters.length > 0) {
						await this.__updateExistingNodes($happn, boosters);
					}
				}
			}
			break;
		case 3:
			{
				if (
					data.keySwitchStatus === 0 &&
						diff &&
						diff.keySwitchStatus === 0
				) {
					let dets = await this.dataModel.updateEDDConnections(
						data.serial,
						data.modified
					);
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
	};
	return postProcessAsync();
};

/***
 * @summary clears the dets
 * @param $happn
 * @param nodeArr - node array containing 1 cbb and 1 edd
 */
DataService.prototype.clearEddSignal = function($happn, parent) {
	const { nodeRepository, archiveRepository } = $happn.exchange;
	const { emit } = $happn;

	let clearEddsAsync = async () => {
		const cutData = await nodeRepository.cutPath(parent.data.path);
		const cutMapped = cutData.map(x => {
			delete x._meta;
			return x;
		});

		const archive = {
			date: parent.meta.storedPacketDate,
			path: parent.data.path,
			data: cutMapped
		};

		emit("EDDSIG", parent.data.path);

		await archiveRepository.insertArchives(archive);

		return true;
	};

	return clearEddsAsync();
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
						path: "node/added",
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

	let updateExistingAsync = async () => {
		for (const update of updates) {
			const { data, meta } = update.value;
			try {
				if (data.typeId !== 4) {
					let changedObject = {
						serial: data.serial,
						typeId: data.typeId,
						path: data.path,
						modified: data.modified,
						changes: update.diff,
						counts: update.counts
					};

					emit("nodes/updated", changedObject);
				}
				nodeRepository.insertNodeData({ ...data });
			} catch (err) {
				logError(
					`error updating  ${JSON.stringify(update, null, 2)} -  ${err} `
				);
				return Promise.reject(err);
			}
		}
	};
	return updateExistingAsync();
};

/**
 * DATA MODEL GETTERS
 */
DataService.prototype.getControlUnit = function($happn) {
	const getAsync = async () => {
		return this.dataModel.controlUnit;
	};
	return getAsync();
};

DataService.prototype.getUnits = function($happn, withChildren) {
	const getAsync = async () => {
		let result = clone(this.dataModel.units);
		let unitKeys = Object.keys(result);

		if (!withChildren) {
			for (let i = 0; i < unitKeys.length; i++) {
				await delete result[unitKeys[i]].children;
			}
		}

		return result;
	};
	return getAsync();
};

module.exports = DataService;
