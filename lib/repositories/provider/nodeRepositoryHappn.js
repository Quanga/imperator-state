/* eslint-disable no-unused-vars */
const diff = require("deep-object-diff").diff;

function NodeRepository() {
	this.status = {
		status: "STOPPED",
		nodeCount: 0
	};
}

NodeRepository.prototype.start = function($happn) {
	const { info: logInfo } = $happn.log;

	let initAsync = async () => {
		logInfo("Happn NodeRepository Initialize.................PASS");
	};
	return initAsync();
};

NodeRepository.prototype.stop = function($happn) {
	const { info: logInfo } = $happn.log;

	let stopAsync = async () => {
		logInfo("Happn NodeRepository Initialize.................PASS");
	};
	return stopAsync();
};

/***
 * @summary Async function that gets all nodes from the nodes table of the datastore
 * @param $happn
 */
NodeRepository.prototype.getAllNodes = function($happn) {
	const { error: logError } = $happn.log;
	const { data } = $happn.exchange;

	let getFromPath = () => {
		return new Promise((resolve, reject) => {
			data.get("persist/nodes/*", null, (err, response) => {
				if (err) {
					logError("cannot get from path", err);
					return reject(err);
				}

				resolve(response);
			});
		});
	};

	let getAll = async () => {
		try {
			let allNodesRaw = await getFromPath();
			let transformedResults = await this.transformGet(allNodesRaw, $happn);
			return transformedResults;
		} catch (err) {
			logError("Error getting all NODES from the NODES PATH", err);
			return Promise.reject(err);
		}
	};

	return getAll();
};

/***
 * @summary Async function that gets a node from the nodes store by serial and typeId
 * @param $happn
 * @param serial
 * @param typeId
 */
NodeRepository.prototype.getNode = function($happn, serial, typeId) {
	const { data } = $happn.exchange;
	const { error: logError } = $happn.log;

	return new Promise((resolve, reject) => {
		data.get(`persist/nodes/${typeId}/${serial}`, null, (err, response) => {
			if (err) {
				logError("cannot get from path", err);
				return reject(err);
			}
			resolve(response);
		});
	});
};

/***
 * @summary Async function that inserts the node data to a path from the nodeObject
 * @param $happn
 * @param nodeObj
 */
NodeRepository.prototype.insertNodeData = function($happn, nodeObj) {
	const { error: logError } = $happn.log;
	const { data } = $happn.exchange;

	if (!nodeObj.path) return Promise.reject("No Path suppied in object");

	const { path } = nodeObj;

	return new Promise((resolve, reject) => {
		if (path === "") {
			const error = new Error(
				"Cannot write node to path - path empty",
				nodeObj
			);
			logError(error);
			return reject(error);
		}

		data.set(`persist/nodes/${path}`, nodeObj, {}, (err, response) => {
			if (err) {
				logError("cannot write to path");
				return reject(err);
			}
			resolve(response);
		});
	});
};

/***
 * @summary Async function that updates the node data to a path from the nodeObject
 * @param $happn
 * @param nodeObj
 */
NodeRepository.prototype.updateNodeData = function($happn, nodeObj) {
	const { error: logError } = $happn.log;
	const { data } = $happn.exchange;
	const { path } = nodeObj;

	let getData = () => {
		return new Promise((resolve, reject) => {
			data.get(`persist/nodes/${path}`, null, (err, response) => {
				if (err) {
					logError("cannot get from path", err);
					return reject(err);
				}
				delete response._meta;
				return resolve(response);
			});
		});
	};

	let writePath = () =>
		new Promise((resolve, reject) => {
			if (!path || path === "") {
				const error = new Error(
					"Cannot write node to path - path empty",
					nodeObj
				);
				logError(error);
				return reject(error);
			}

			data.set(`persist/nodes/${path}`, nodeObj, {}, (err, response) => {
				if (err) {
					$happn.log.error("updateNodeData error", err);
					return reject(err);
				}

				resolve(response);
			});
		});

	return getData()
		.then(res => {
			let differences = diff(res, nodeObj);
			//let differences = {};

			let resObjKeys = Object.keys(differences);
			let filteredResObjKeys = resObjKeys.filter(x => x !== "modified");
			if (
				filteredResObjKeys.length !== 0 &&
				differences.constructor === Object
			) {
				let changedObject = {
					serial: nodeObj.serial,
					typeId: nodeObj.typeId,
					modified: nodeObj.modified,
					changes: differences
				};

				$happn.emit("nodes/updated", changedObject);
			}
		})
		.then(() => writePath());
};

NodeRepository.prototype.getSerialsByType = function($happn, typeId) {
	let getSerialsAsync = async () => {};

	return getSerialsAsync();
};

// NodeRepository.prototype.archiveEdds = function($happn, cbb) {
// 	const { error: logError, info: logInfo } = $happn.log;

// 	let archiveAsync = async () => {

// 	};

// 	return archiveAsync();
// };

/***
 * @summary Async function that return all the node data from the nodeObject
 * @param $happn
 * @param nodeObj
 */
NodeRepository.prototype.cutPath = function($happn, parentPath) {
	const { data } = $happn.exchange;
	return new Promise((resolve, reject) => {
		//here I need to do the get
		data.get(`persist/nodes/${parentPath}/*`, null, (err, response) => {
			if (err) {
				return Promise.reject("error getting on path");
			}

			data.remove(`persist/nodes/${parentPath}/*`, null, function(e, result) {
				if (e) {
					return reject(e);
				}
			});

			resolve(response);
		});
	});
};

/***
 * @summary Async function that deletes all the node data from the nodeObject
 * @param $happn
 * @param nodeObj
 */
NodeRepository.prototype.deleteAll = function($happn) {
	const { data } = $happn.exchange;
	const { info: logInfo } = $happn.log;
	return new Promise((resolve, reject) => {
		data.remove("persist/nodes/*", null, function(e, result) {
			if (e) {
				return reject(e);
			}
			logInfo("All Nodes successfully removed");

			resolve(result);
		});
	});
};

/***
 * @summary Async function that transforms the nodes stored as JSON and turns them back
 * into their Unit Models
 * @param $happn
 * @param nodeObj
 */
NodeRepository.prototype.transformGet = function(getResult, $happn) {
	const { config } = $happn;
	const UnitModels = require("../../models/unitModels");
	const {
		ControlUnitModel,
		SectionControlModel,
		BoosterModel,
		CBoosterModel,
		EDDModel
	} = UnitModels;

	let transformAsync = async () => {
		try {
			let resultArr = [];

			for (const item of getResult) {
				let unitObj = null;
				switch (item.typeId) {
				case 0:
					unitObj = new ControlUnitModel(item.serial, null);
					unitObj.meta.type = config.systemType;
					break;
				case 1:
					unitObj = new SectionControlModel(item.serial, null);
					break;
				case 2:
					unitObj = new BoosterModel(item.serial, null);
					break;
				case 3:
					unitObj = new CBoosterModel(item.serial, null);
					break;
				case 4:
					unitObj = new EDDModel(item.serial, null);
					break;
				}

				let remappedObj = await mapProps(item, unitObj);
				if (remappedObj.meta.modified) {
					remappedObj.meta.storedPacketDate = remappedObj.data.modified;
				} else {
					remappedObj.meta.storedPacketDate = remappedObj.data.created;
				}

				resultArr.push(remappedObj);
			}
			return resultArr;
		} catch (err) {
			return Promise.reject(err);
		}
	};

	let mapProps = async (foundNode, newObj) => {
		const { data: newObjData } = newObj;
		try {
			for (let key in newObjData) {
				if (foundNode.hasOwnProperty(key)) {
					let propResult = foundNode[key];
					if (propResult != null) {
						newObjData[key] = foundNode[key];
					}
				}
			}
			return newObj;
		} catch (err) {
			return Promise.reject(err);
		}
	};

	return transformAsync();
};

module.exports = NodeRepository;
