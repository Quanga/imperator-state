/* eslint-disable no-prototype-builtins */
/* eslint-disable no-unused-vars */
/**
 * @module lib/services/dataService
 * @requires module:lib/models/dataModel
 */
const DataModel = require("../models/dataModel");
const clone = require("clone");
const pEachSeries = require("p-each-series");

const { dataServiceEvents } = require("../constants/eventConstants");

const fields = require("../configs/fields/fieldConstants");
const unitSchema = require("../configs/units/unitSchema");

/**
 * @category Data Service
 * @class DataService
 * @prop {DataModel} this.dataModel The Core State DataModel
 */
function DataService() {
	this.dataModel;
}

/**
 * <ul>
 * <li>Called by {@link module:app~App#startRouter}.</li>
 * <li>Starts the listners for the Data Model</li></ul><br>
 * @param {$happn} $happn Dependancy Injection of the Happner Framework
 * @returns {Promise}
 */
DataService.prototype.initialise = function($happn) {
	const { dataService } = $happn.exchange;
	const { log } = $happn;

	return (async () => {
		try {
			this.dataModel = await dataService.createDataModel();

			const persisted = await dataService.getPersistedUnits();
			if (persisted && persisted.length > 0) {
				log.warn("No Units found in Node Repository.... DataModel is empty");
				await dataService.rehydrateData(this.dataModel, persisted);
			}
		} catch (error) {
			log.error(error);
		}
	})();
};

/**
 * <ul><li>Handles DataModel Creationg</li>
 * <li>Gets the persisted units from the datastore</li>
 * @param {$happn} $happn Dependancy Injection of the Happner Framework
 * @returns {Promise}
 */
DataService.prototype.createDataModel = function($happn) {
	const { env } = $happn.config;
	const { log, emit } = $happn;

	return (async () => {
		const model = DataModel.create().withMode(env.systemMode);
		model
			.on("error", err => {
				log.error("DataModel error:", err);
			})
			.on("state", state => {
				emit("state", state);
			})
			.on("message", msg => log.info(`DataModel: ${msg}`));

		return model;
	})();
};

//#region Rehydrate Functions
/**
 * <ul><li>Create and populate the DataModel on startup of this Service.</li>
 * <li>Gets the persisted units from the datastore</li>
 * @param {$happn} $happn Dependancy Injection of the Happner Framework
 * @returns {Promise}
 */
DataService.prototype.rehydrateData = function($happn, model, persisted) {
	const { log } = $happn;

	return (async () => {
		try {
			for (const unit of persisted) {
				await model.stageUpsert(unit, true);
			}
			return model;
		} catch (error) {
			log.error(error);
			throw new Error(`DataModel: Could not rehydrate model from persisted ${error.message}`);
		}
	})();
};

/**
 * <ul><li>Validate the persisted Units and return to the create method</li></ul>
 * @param {$happn} $happn Dependancy Injection of the Happner Framework
 * @returns {(Promise<units[]> | Promise<null>)} result Array or null
 */
DataService.prototype.getPersistedUnits = function($happn) {
	const { nodeRepository } = $happn.exchange;
	const { serial, modifiedAt, windowId, typeId } = fields;
	const { log } = $happn;

	return (async () => {
		try {
			const unitsObj = await nodeRepository.get("*", true);
			let resultArr = [];

			if (!unitsObj) return resultArr;

			Object.keys(unitsObj).forEach(tKey => {
				let units;
				if (unitSchema[tKey].hasOwnProperty("distinct")) {
					if (unitsObj[tKey].length === 1) {
						units = [unitsObj[tKey][0]];
					} else {
						units = [unitsObj[tKey].sort((a, b) => a[modifiedAt] < b[modifiedAt])[0]];
						log.warn(`Found ${unitsObj[tKey].length} ${unitSchema[tKey].name} only one allowed`);
					}
				} else {
					units = [...unitsObj[tKey]];
				}

				resultArr = units ? [...resultArr, ...units] : [...resultArr, ...unitsObj[tKey]];
				log.info(`Adding ${unitSchema[tKey].name} ${units.map(u => u[serial] || u[windowId])}`);
			});

			return resultArr;
		} catch (error) {
			log.error("Persisted Units Validation:", error);
		}
	})();
};

//#endregion

//#region Upsert Functions
/**
 * <ul><li>DataService Entry from Queue Service</li>
 * <li>Starts the upsert Process</li></ul>
 * <li>Checks for a signal<br>
 * <li>sends to upsetArray<br>
 * @param {$happn} $happn Dependancy Injection of the Happner Framework
 * @param {object[]} nodeArr The incoming node array
 * @returns {Promise}
 */
DataService.prototype.processUnitObj = function($happn, unitsObj) {
	const { dataService } = $happn.exchange;
	const { log } = $happn;

	return (async () => {
		try {
			if (Object.prototype.hasOwnProperty.call(unitsObj, "signal")) {
				await dataService.handleSignal(unitsObj);
			} else {
				const result = await dataService.upsertNodeDataArr(unitsObj.units);
				// if (upsert && upsert.updates.length > 0) {
				// 	await dataService.postProcess(unitsObj.resultArr[0], upsert.updates);
				// }
				return result;
			}
		} catch (error) {
			log.error(error);
			throw new Error(error);
		}
	})();
};

/**
 * <ul><li>Primary Pathway for the Node Array</li>
 * <li>Handles upserting and flow</li></ul><br>
 * @param {$happn} $happn Dependancy Injection of the Happner Framework
 * @param {object[]} nodeArr The incoming node array
 * @returns {Promise}
 */
DataService.prototype.upsertNodeDataArr = function($happn, nodeArr) {
	const { dataService } = $happn.exchange;
	const { log } = $happn;

	return (async () => {
		try {
			if (!Array.isArray(nodeArr)) throw new Error("variable NodeArray is not an Array");

			const context = await dataService.createContext(nodeArr);
			const handle = await dataService.commitUpdates(context);

			return handle;
		} catch (error) {
			log.error("DataService Upsert Error: ", error);
			throw new Error(error);
		}
	})();
};

/**
 * <ul><li>Create a Context of updates and inserts</li>
 * <li>Context is an uncommitted overview of the potential changes</li>
 * <li>This is a preflight of the changes and issues</li></ul><br>
 * @param {$happn} $happn Dependancy Injection of the Happner Framework
 * @param {object[]} nodeArr The incoming node array
 * @returns {Promise}
 
 */
DataService.prototype.createContext = function($happn, nodeArr) {
	const { log } = $happn;

	return (async () => {
		try {
			const context = {
				nodeArr,
				upserts: { UPDATE: [], INSERT: [] },
				errors: [],
				none: [],
			};

			const processUpdate = async unit => {
				const upsertResult = await this.dataModel.stageUpsert(unit);

				if (!upsertResult || !upsertResult.action) {
					throw new TypeError("could not get context info");
				}

				switch (upsertResult.action) {
					case "NONE":
						context.none.push(upsertResult.value);
						break;
					case "ERROR":
						context.errors.push(upsertResult.value);
						break;
					default:
						context.upserts[upsertResult.action].push(upsertResult);
				}
			};

			await Promise.all(nodeArr.map(unit => processUpdate(unit)));

			return context;
		} catch (error) {
			log.error(error);
		}
	})();
};

/**
 * <ul><li>Commit the Apply the context to the Data Model</li>
 * <li>Context is an uncommitted overview of the potential changes</li>
 * <li>This is a preflight of the changes and issues</li></ul><br>
 * @param {$happn} $happn Dependancy Injection of the Happner Framework
 * @param {object[]} nodeArr The incoming node array
 * @returns {Promise}
 * const context = {
				upserts: { UPDATE: [], INSERT: [...nodes] },
				errors: [],
				none: [],
			};
 */
DataService.prototype.commitUpdates = function($happn, context) {
	const { dataService } = $happn.exchange;
	const { log } = $happn;
	const { upserts } = context;

	return (async () => {
		try {
			for (const upsertKey of Object.keys(upserts)) {
				const units = [];

				for (const unit of upserts[upsertKey]) {
					const result = await this.dataModel.commitUpsert({ ...unit });
					units.push({ ...result });
				}

				await dataService.reportUpserts(upserts, upsertKey, context);
				await dataService.persistUnits(units);
			}
		} catch (error) {
			log.error(error);
		}
	})();
};

// TODO STILL NEED TO FLESH THIS OUT TO HANDLE THE MESSAGING ON THE SIGNALS
/* I should not be mutating state here as this is now inclusing business logic into the 
process - communicationStatus =0 */
DataService.prototype.handleSignal = function($happn, unitsObj) {
	const { nodeRepository, eventService, dataService } = $happn.exchange;
	const { log } = $happn;

	return (async () => {
		log.warn("SIGNAL RECEIVED", unitsObj.signal);

		const unit = unitsObj.units[0];
		const stage = await this.dataModel.stageDeleteChildren(unit, 4);

		if (stage.action !== "ERROR") {
			const commit = await this.dataModel.commitUpsert(stage);
		}

		unit.data[fields.childCount] = 0;

		await dataService.upsertNodeDataArr([unit]);
		await nodeRepository.cutPath(unit.data.path);

		await eventService.handleEvent({
			type: dataServiceEvents.EDD_SIGNAL_DETECTED,
			serial: unit.data[fields.serial],
			createdAt: unit.data[fields.createdAt],
			typeId: unit.data[fields.typeId],
		});
	})();
};

DataService.prototype.reportUpserts = function($happn, actions, actionKey, context) {
	const { log, emit } = $happn;
	const { serial, createdAt, typeId, windowId, modifiedAt } = fields;

	return (async () => {
		if (actions[actionKey].length > 0) {
			log.info(`${actionKey}: ${actions[actionKey].length}`);
			actions[actionKey].forEach(u => {
				switch (u.action) {
					case "UPDATE":
						{
							const message = u.value.nextState.meta[windowId]
								? `type:${u.value.nextState.meta[typeId]}, windowId: ${u.value.nextState.meta[windowId]}`
								: `type:${u.value.nextState.meta[typeId]}, serial: ${u.value.nextState.meta[serial]}`;
							log.info(message);
							log.info(`diffs: ${JSON.stringify(u.value.diffs)}`);

							emit(dataServiceEvents.DATAMODEL_MOD, {
								type: dataServiceEvents.UNITS_UPDATED,
								serial: context.nodeArr[0].meta[serial],
								createdAt: context.nodeArr[0].meta[modifiedAt],
								typeId: context.nodeArr[0].meta[typeId],
								payload: context.upserts[actionKey],
							});
						}
						break;
					case "INSERT":
						{
							const message = u.value.nextState.data[windowId]
								? `type:${u.value.nextState.meta[typeId]}, serial: ${u.value.nextState.meta[windowId]}`
								: `type:${u.value.nextState.meta[typeId]}, serial: ${u.value.nextState.meta[serial]}`;
							log.info(message);
							log.info(`diffs: ${JSON.stringify(u.value.diffs)}`);

							emit(dataServiceEvents.DATAMODEL_MOD, {
								type: dataServiceEvents.UNITS_UPDATED,
								serial: context.nodeArr[0].meta[serial],
								createdAt: context.nodeArr[0].meta[createdAt],
								typeId: context.nodeArr[0].meta[typeId],
								payload: context.upserts[actionKey],
							});
						}
						break;
				}
			});
		}
	})();
};

/**
 * @summary Handle the node update from the CONTEXT.NEWNODES
 * @param {$happn} $happn
 * @param {units[]} updates - data context which stores context.newnodes
 */
DataService.prototype.persistUnits = function($happn, updates) {
	const { communicationStatus } = fields;
	console.log("SAVING", updates);

	const { nodeRepository } = $happn.exchange;
	const { log } = $happn;

	return (async () => {
		try {
			const insert = async update => {
				if (
					update &&
					Object.prototype.hasOwnProperty.call(update, "data") &&
					Object.prototype.hasOwnProperty.call(update, "meta")
				) {
					const unit = {
						data: { ...update.data },
						meta: { ...update.meta },
						state: { ...update.state },
					};
					await nodeRepository.insertNodeData(unit);
				}
			};
			const tasks = updates.map(update => insert(update));
			await Promise.all(tasks);
		} catch (error) {
			log.error(`error updating`, error);
		}
	})();
};
//#endregion

//#region GET functions
/**
 * @summary Get the control unit
 * @param {$happn} $happn
 */
DataService.prototype.getControlUnit = function($happn) {
	const { log } = $happn;

	return (async () => {
		try {
			const controlUnit = this.dataModel.units[0];
			if (!controlUnit) return null;

			const cu = clone(controlUnit);

			delete cu.event;
			return cu;
		} catch (err) {
			log.error("Error getting control unit", err);
		}
	})();
};

/**
 * @summary Get the booster units
 * @param {$happn} $happn
 * @param {boolean} withChildren Get the units with their children
 */
DataService.prototype.getUnits = function($happn, withChildren) {
	const { log } = $happn;

	return (async () => {
		try {
			let result = clone(this.dataModel.units[3]);
			let unitKeys = Object.keys(result);

			for (let i = 0; i < unitKeys.length; i++) {
				delete result[unitKeys[i]].event;
				delete result[unitKeys[i]].func;
				if (!withChildren) {
					delete result[unitKeys[i]].children;
				}
			}

			return result;
		} catch (err) {
			log.error("Error getting units", err);
		}
	})();
};

DataService.prototype.getSnapShot = function($happn) {
	const { log } = $happn;

	return (async () => {
		try {
			return await this.dataModel.snapShot();
		} catch (err) {
			log.error("Snapshot error", err);
		}
	})();
};

DataService.prototype.getDataModel = function($happn) {
	const { log } = $happn;

	return (async () => {
		try {
			return await this.dataModel.getDataModel();
		} catch (err) {
			log.error("Snapshot error", err);
		}
	})();
};
//#endregion

//#region DataModel Utilities

/**
 * <ul><li>Clears the DataModel by creating a new DataModel instance.</li>
 * <li>Utiliity method for now</li></ul>
 * @param {$happn} $happn Dependancy Injection of the Happner Framework
 * @returns {Promise}
 */
DataService.prototype.clearDataModel = function($happn) {
	const { log } = $happn;
	const { env } = $happn.config;
	const { dataService } = $happn.exchange;
	return (async () => {
		log.warn("DataModel cleared");
		this.dataModel = await dataService.createDataModel();
	})();
};

//#endregion

//#region Doc Defs
/**
 * @category Data Service
 * @event module:lib/services/dataService~DataService#UNIT_COUNT
 * @type {object}
 * @prop {object} Value to deine
 * @todo Document this object correctly
 */

/**
 * @category Data Service
 * @event EDDSIG
 * @summary Fires the Clear signal for a booster
 * @type {object}
 * @prop {string} parent.data.path the path of the unit the EDDSIG is from
 * @memberof module:lib/services/dataService~DataService
 */

/**
 * @typedef {object} action
 * @prop {string} action.type Type of action
 * @prop {object} action.value Value of action
 * @example { type: "FILTERED", value: result }
 * @memberof module:lib/services/dataService~DataService
 *
 */
//#endregion

module.exports = DataService;

/*
DataService.prototype.createDataModelListeners = function($happn) {
	const { eventService } = $happn.exchange;
	const { log } = $happn;
	return (async () => {
		try {
			// this.dataModel.on(dataModelEvents.UNIT_COUNT_UPDATED, val =>
			// 	eventService.handleEvent({
			// 		type: dataServiceEvents.UNIT_COUNT_CHANGED,
			// 		[fields.serial]: val[fields.serial],
			// 		[fields.createdAt]: val[fields.createdAt],
			// 		[fields.typeId]: val[fields.typeId],
			// 		counts: val.counts,
			// 	}),
			// );
			//send a unit update to the events service to notify changes
			// this.dataModel.on(dataModelEvents.UNIT_COMMS_LOST, val => {
			//log.info(`Communication lost for unit - ${val.serial}`);
			// eventService.handleEvent({
			// 	type: dataServiceEvents.UNITS_UPDATED,
			// 	serial: val.serial,
			// 	createdAt: val.createdAt,
			// 	typeId: val.typeId,
			// 	payload: [{ serial: val.serial, diff: { communicationStatus: 0 } }]
			// });
			// });
		} catch (err) {
			log.error(err);
		}
	})();
};
*/

/**
 * <ul>
 * <li>Post Process Actions to update certain states</li>
 * <li>.....</li></ul><br>
 * @param {$happn} $happn Dependancy Injection of the Happner Framework
 * @param {object[]} updatesArr The incoming node array
 * @returns {Promise<action>} Action
 */
// NEED TO MOVE THIS OUT OF THE SERVICE TO BUSINESS LOGIC
/*
DataService.prototype.postProcess = function($happn, parent, updatesArr) {
	const { dataService, blastService } = $happn.exchange;
	const { log } = $happn;
	return (async () => {
		try {
			//const { keySwitchStatus, fireButton, typeId, modifiedAt, serial } = parent.data;
			const { modifiedAt } = fields;
			const { data } = parent;
			const { diff } = updatesArr[0];
			switch (data[fields.typeId]) {
				case 0:
					{
						if (
							data[fields.keySwitchStatus] === 1 &&
							data[fields.fireButton] === 1 &&
							diff &&
							diff[fields.fireButton] === 1
						) {
							const snapShot = await this.dataModel.snapShot();
							let blastCreated = await blastService.createNewBlast(data[modifiedAt], snapShot);
							if (blastCreated) {
								let boosters = await this.dataModel.updateBoosterConnections(data[modifiedAt]);
								if (boosters.length > 0) {
									for (let booster of boosters) {
										const result = await this.dataModel.stageUpsert(booster, true);
										const boosterArr = [result];
										await dataService.persistUnits(boosterArr);
									}
								}
							}
						}
					}
					break;
				case 3:
					{
						// TODO still need to handle this turn off event as it is heavy;
						if (
							data[fields.keySwitchStatus] === 0 &&
							diff &&
							diff[fields.keySwitchStatus] === 0
						) {
							log.info(`Turning off Detonators for unit ${data[fields.serial]}`);
							// const unit = await this.dataModel.getUnit(parent);
							// const childKeys = Object.keys(unit.children);
							// const resent = [];
							// childKeys.forEach(child => {
							// 	let det = clone(unit.children[child]);
							// 	det.data[fields.createdAt] = data[fields.modifiedAt];
							// 	det.data[fields.communicationStatus] = 0;
							// 	resent.push(det);
							// });
							// await dataService.updateState(resent);
						}
					}
					break;
				default: {
					return null;
				}
			}
		} catch (err) {
			log.error("Postprocessing err", err);
		}
	})();
};
*/
