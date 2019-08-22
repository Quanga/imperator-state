/* eslint-disable no-unused-vars */
const diff = require("deep-object-diff").diff;
const moment = require("moment");

function NodeRepository() {
	this.status = {
		status: "STOPPED",
		nodeCount: 0
	};
}

NodeRepository.prototype.start = function($happn) {
	const { log } = $happn;
	const { nodeRepository, data } = $happn.exchange;

	return (async () => {
		const persistedNodes = await nodeRepository.getPersisted("*");
		if (!persistedNodes) return;

		persistedNodes.forEach(item => {
			data.set(`mem/nodes/${item.path}`, item, {}, err => {
				if (err) return log.error("ISSUE WRITING NODE TO MEM STORE");
			});
		});

		log.info("Happn NodeRepository Initialize.................PASS");
	})();
};

NodeRepository.prototype.getLastPacketTime = function($happn) {
	const { nodeRepository } = $happn.exchange;
	const { log } = $happn;

	return (async () => {
		try {
			let persistedNodes = await nodeRepository.getPersisted("*");

			if (!persistedNodes || persistedNodes.length === 0) return 0;

			const modifiedList = persistedNodes.map(d => {
				if (d.modified) {
					return d.modified;
				} else {
					return 0;
				}
			});

			const latest = Math.max(...modifiedList);
			log.info(
				`lastPacket time found - ${latest} - ${moment(latest).format("DD-MM-YYYY HH:mm:ss.SSS")}`
			);
			return latest;
		} catch (err) {
			log.error("Error getting last packet", err);
		}
	})();
};

NodeRepository.prototype.getPersisted = function($happn, path) {
	const { data } = $happn.exchange;
	const { error: logError } = $happn.log;

	let getFromPath = () => {
		return new Promise(resolve => {
			data.get(`persist/nodes/${path}`, null, (err, response) => {
				if (err) {
					logError("cannot get from path", err);
					resolve([]);
				}

				resolve(response);
			});
		});
	};
	return getFromPath();
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
	const { nodeRepository } = $happn.exchange;

	let getAll = async () => {
		try {
			let allNodesRaw = await nodeRepository.getPersisted("*");
			return allNodesRaw;
		} catch (err) {
			return logError("Error getting all NODES", err);
		}
	};

	return getAll();
};

/***
 * @summary Async function that gets all nodes of a type
 * @param $happn
 */
NodeRepository.prototype.getNodeType = function($happn, typeId) {
	const { error: logError } = $happn.log;
	const { data } = $happn.exchange;

	let getFromPath = () => {
		var options = {};

		var criteria = {
			typeId: parseInt(typeId, 10)
		};

		return new Promise((resolve, reject) => {
			data.get(
				`mem/nodes/${typeId}/*`,
				{
					criteria: criteria,
					options: options
				},
				(err, response) => {
					if (err) {
						logError("cannot get from path", err);
						return reject(err);
					}
					resolve(response);
				}
			);
		});
	};

	let getAll = async () => {
		try {
			let allNodesRaw = await getFromPath();
			return allNodesRaw;
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
NodeRepository.prototype.getNodeTree = function($happn, typeId, serial) {
	const { data } = $happn.exchange;
	const { error: logError } = $happn.log;

	let getFromPath = () => {
		return new Promise((resolve, reject) => {
			data.get(`mem/nodes/${typeId}/${serial}`, null, (err, response) => {
				if (err) {
					logError("cannot get from path", err);
					return reject(err);
				}

				resolve(response);
			});
		});
	};

	let getFromPathChildren = () => {
		return new Promise((resolve, reject) => {
			data.get(`mem/nodes/${typeId}/${serial}/*`, null, (err, response) => {
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

			if (allNodesRaw) {
				let allNodesRawChildren = await getFromPathChildren();

				if (allNodesRawChildren) {
					allNodesRaw = [allNodesRaw, ...allNodesRawChildren];
				}

				return allNodesRawChildren;
			}
			return [];
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
		data.get(`mem/nodes/${typeId}/${serial}`, null, (err, response) => {
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

	return new Promise((resolve, reject) => {
		if (!nodeObj.path) return reject("No Path suppied in object");

		const { path } = nodeObj;
		if (path === "") {
			return reject("Cannot write node to path - path empty", nodeObj);
		}

		data.set(`persist/nodes/${path}`, nodeObj, {}, (err, response) => {
			if (err) {
				logError("cannot write to path");
				return reject(err);
			}
		});

		data.set(`mem/nodes/${path}`, nodeObj, {}, (err, response) => {
			if (err) {
				return logError("cannot write to path");
			}

			return resolve(response);
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
			data.get(`mem/nodes/${path}`, null, (err, response) => {
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
				const error = new Error("Cannot write node to path - path empty", nodeObj);
				logError(error);
				return reject(error);
			}

			data.set(`persist/nodes/${path}`, nodeObj, {}, (err, response) => {
				if (err) {
					$happn.log.error("updateNodeData error", err);
					return reject(err);
				}
			});

			data.set(`mem/nodes/${path}`, nodeObj, {}, (err, response) => {
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
			if (filteredResObjKeys.length !== 0 && differences.constructor === Object) {
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

/***
 * @summary Async function that return all the node data from the nodeObject
 * @param $happn
 * @param nodeObj
 */
NodeRepository.prototype.cutPath = function($happn, parentPath) {
	const { data } = $happn.exchange;
	return new Promise((resolve, reject) => {
		//here I need to do the get
		data.get(`mem/nodes/${parentPath}/*`, null, (err, response) => {
			if (err) {
				return Promise.reject("error getting on path");
			}

			data.remove(`persist/nodes/${parentPath}/*`, null, function(e, result) {
				if (e) {
					return reject(e);
				}
			});

			data.remove(`mem/nodes/${parentPath}/*`, null, function(e, result) {
				if (e) {
					return reject(e);
				}
				resolve(response);
			});
		});
	});
};

/***
 * @summary Async function that deletes all the node data from the nodeObject
 * @param $happn
 * @param nodeObj
 */
NodeRepository.prototype.delete = function($happn, path) {
	const { data } = $happn.exchange;
	const { info: logInfo } = $happn.log;
	return new Promise((resolve, reject) => {
		data.remove(`persist/nodes/${path}`, null, function(e, result) {
			if (e) {
				return reject(e);
			}
			logInfo("All Nodes successfully removed");
		});

		data.remove(`mem/nodes/${path}`, null, function(e, result) {
			if (e) {
				return reject(e);
			}
			logInfo("All Nodes successfully removed");

			resolve(result);
		});
	});
};

NodeRepository.prototype.getAll = function($happn) {
	//$happn.emit("nodeChange", "working");

	const { error: logError } = $happn.log;
	const { data } = $happn.exchange;

	let getAll = () => {
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

	return getAll();
};

NodeRepository.prototype.getDetonators = function($happn, path) {
	const { data } = $happn.exchange;
	const { error: logError } = $happn;
	//get the path for the serial
	let getPath = () => {
		return new Promise((resolve, reject) => {
			data.get(`mem/nodes/${path}/*`, null, (err, response) => {
				if (err) {
					logError("cannot get from path", err);
					return reject(err);
				}

				resolve(response);
			});
		});
	};

	const getDets = async () => {
		let result = [];
		const dets = await getPath();
		// let cbbIndex = dets.findIndex(x => x.typeId === 3);
		// if (cbbIndex !== -1) {
		// 	result = dets.splice(cbbIndex, 1);
		// }
		return dets.map(x => {
			delete x._meta;
			return x;
		});
	};

	return getDets();
};

module.exports = NodeRepository;
