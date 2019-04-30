/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable no-unused-vars */
const NodeTreeUtils = require("../utils/node_tree_utils");
const PacketTemplate = require("../constants/packetTemplates");
const { performance, PerformanceObserver } = require("perf_hooks");

function DataService() {
	this.componentState = {
		name: "Data Service",
		path: "service/dataService",
		index: 5,
		type: "State Management",
		serviceStatus: "STOPPED",
		enableTest: true
	};

	this.__nodeTreeUtil = new NodeTreeUtils();
	this.__constants = new PacketTemplate();
	this.state = { mode: "STOPPED" };
	this.emitCount = 0;
	this.useTest = true;
}

DataService.prototype.setComponentStatus = function($happn, payload) {
	const { app } = $happn.exchange;
	const { componentState } = this;

	const update = { ...componentState, ...payload };
	app.setAppInfo(update, componentState.path);
	this.componentState = update;
};

DataService.prototype.start = function($happn) {
	const { dataService } = $happn.exchange;
	const { error: logError, info: logInfo } = $happn.log;

	return new Promise((resolve, reject) => {
		logInfo("starting data service");
		dataService.startTestObserver();
		dataService.setComponentStatus({ serviceStatus: "STARTED" });
		resolve();
	});
};

DataService.prototype.stop = function($happn) {
	const { dataService } = $happn.exchange;
	const { error: logError, info: logInfo } = $happn.log;

	return new Promise((resolve, reject) => {
		logInfo("stopping data service");
		//dataService.setComponentStatus({ serviceStatus: "STOPPED" });
		resolve();
	});
};

DataService.prototype.startTestObserver = function($happn) {
	this.tests = [];
	this.observer = new PerformanceObserver(list => {
		const entry = list.getEntries()[0];
		if (entry.name.split("-")[0] === "dataService")
			this.tests.push(JSON.stringify(list.getEntries()));
	});
	this.observer.observe({ entryTypes: ["measure"] });
};

DataService.prototype.stopTestObserver = function($happn) {
	delete this.observer;
	performance.clearMarks();
};

DataService.prototype.markPerf = function(perfname, end) {
	if (end) {
		performance.mark(`${perfname} - end`);
		performance.measure(perfname, `${perfname} - start`, `${perfname} - end`);
	} else {
		performance.mark(`${perfname} - start`);
	}
};

DataService.prototype.writeTest = function($happn) {
	const { error: logError } = $happn.log;
	const { data } = $happn.exchange;

	return new Promise((resolve, reject) => {
		data.set(
			`persist/dataService/test/${Date.now()}`,
			this.tests,
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

DataService.prototype.getTests = function($happn) {
	const { error: logError } = $happn.log;
	const { data } = $happn.exchange;

	return new Promise((resolve, reject) => {
		data.get(`persist/dataService/test/*`, null, (err, resp) => {
			if (err) {
				logError("cannot write to path for tests");
				return reject(err);
			}
			return resolve(resp);
		});
	});
};

DataService.prototype.deletetTests = function($happn) {
	const { error: logError } = $happn.log;
	const { data } = $happn.exchange;

	return new Promise((resolve, reject) => {
		data.remove(`persist/dataService/test/*`, null, (err, resp) => {
			if (err) {
				logError("cannot write to path for tests");
				return reject(err);
			}
			return resolve(resp);
		});
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
DataService.prototype.upsertNodeDataArr = function($happn, nodeArr) {
	const Context = require("../models/contextModel");
	const { config } = $happn;
	const { nodeRepository, dataService } = $happn.exchange;
	const { info: logInfo, error: logError } = $happn.log;

	let allNodes = [];

	// the branch or branch is a subset of existing tree, starting from the incoming parent node
	let branch = [];
	let context;

	const buildTreeAsync = async () => {
		try {
			const perfName = "dataService-buildTree";
			if (this.useTest) this.markPerf(perfName);

			const arrParent = nodeArr[0].data;
			const { typeId, serial } = arrParent;
			allNodes = await nodeRepository.getNodeTree(typeId, serial);

			if (allNodes.length > 0) {
				branch = arrParent.typeId === 0 ? [allNodes[0]] : allNodes;
			}

			context = new Context(allNodes, branch);

			if (this.useTest) this.markPerf(perfName, true);
		} catch (err) {
			logError("BuildTree error", err);
			return Promise.reject(err);
		}
	};

	let checkTreeAsync = async () => {
		const perfName = "dataService-checkTree";
		if (this.useTest) this.markPerf(perfName);
		//logInfo("NODE UPSERT - NEW, UPDATED & MISSING NODES...");
		try {
			let extracted = await this.__nodeTreeUtil.extractNewAndUpdatedNodes(
				$happn,
				context,
				nodeArr
			);

			context.newNodes = extracted.newNodes;
			context.updateNodes = extracted.updateNodes;
			context.missingNodes = extracted.missingNodes;

			if (this.useTest) this.markPerf(perfName, true);
		} catch (err) {
			logError("Build new and missing  error", err);
			return Promise.reject(err);
		}
	};

	let reorderWindowIdsAsync = async () => {
		//shuffle the window id's for those IB651's that already exist in the DB, but have a different ordering
		const perfName = "dataService-reorder";
		if (this.useTest) this.markPerf(perfName);

		if (config.systemType === "IBS") {
			const { updateNodes: nodesToUpdate } = context;
			try {
				logInfo("NODE UPSERT -  REORDERING WINDOW IDS");
				let reshuffle = await this.__reshuffleWindowIds(nodeArr, nodesToUpdate);
				context.updateNodes = reshuffle;
			} catch (err) {
				logError("reorder error", err);
				return Promise.reject(err);
			}
		}
		if (this.useTest) this.markPerf(perfName, true);
	};

	let performUpdateAsync = async () => {
		const {
			updateNodes: nodesToUpdate,
			newNodes: nodesToAdd,
			missingNodes
		} = context;

		try {
			const perfName = "dataService-performUpdate";
			if (this.useTest) this.markPerf(perfName);

			if (nodesToUpdate.length > 0) {
				logInfo("NODE UPSERT - UPDATE EXISTING NODES...", nodesToUpdate.length);
				await this.__updateExistingNodes($happn, context);
			}
			if (nodesToAdd.length > 0) {
				logInfo("NODE UPSERT - INSERT NEW NODES...", nodesToAdd.length);
				await this.__insertNewNodes($happn, context);
			}
			if (missingNodes.length > 0) {
				logInfo(
					"NODE UPSERT - UPDATE COMMS ON MISSING...",
					missingNodes.length
				);
				await this.__updateMissingNodes($happn, context);
			}

			if (this.useTest) this.markPerf(perfName, true);
		} catch (err) {
			logError("Perform Update Error", err);
			return Promise.reject(err);
		}
	};

	const processUpsert = async () => {
		try {
			const perfName = "dataService-total";
			if (this.useTest) this.markPerf(perfName);

			let eddSig = await dataService.clearEddSignal(nodeArr);

			if (eddSig) {
				logInfo(`EDD clear signal for CBB ${eddSig.data.serial}`);
				nodeArr = nodeArr.slice(0, 1);
				return Promise.resolve();
			}

			await buildTreeAsync();
			await checkTreeAsync();
			//await reorderWindowIdsAsync();
			await performUpdateAsync();

			if (this.useTest) await this.writeTest($happn);
			if (this.useTest) this.markPerf(perfName, true);

			//console.log(await this.getTests($happn));

			this.state.mode = "IDLE";
		} catch (err) {
			logError("Process Upsert error.............", err);
			return Promise.reject(err);
		}
	};

	return processUpsert();
};

/***
 * @summary Handle the node inserts from the CONTEXT.NEWNODES
 * @param $happn
 * @param nodeArr - node array containing 1 cbb and 1 edd
 */
DataService.prototype.clearEddSignal = function($happn, nodeArr) {
	const { nodeRepository, archiveRepository } = $happn.exchange;

	let clearEddsAsync = async () => {
		const perfName = "dataService-eddSig";
		if (this.useTest) this.markPerf(perfName);

		if (nodeArr.length < 2 || nodeArr[0].data.typeId !== 3) {
			if (this.useTest) this.markPerf(perfName, true);

			return Promise.resolve(null);
		}

		const parent = nodeArr[0];

		//clear EDDs when typeId is 4, and UID is 255.255.255.255
		let clearSignal = nodeArr.find(
			node => node.data.typeId === 4 && node.data.serial === 4294967295
		);

		if (!clearSignal) {
			if (this.useTest) this.markPerf(perfName, true);
			return Promise.resolve(false);
		}

		let parentPath = `${parent.data.typeId}/${parent.data.serial}`;

		const cutData = await nodeRepository.cutPath(parentPath);
		const cutMapped = cutData.map(x => {
			delete x._meta;
			return x;
		});

		let archive = {
			date: parent.meta.storedPacketDate,
			path: parentPath,
			data: cutMapped
		};

		await archiveRepository.insertArchives(archive);

		if (this.useTest) this.markPerf(perfName, true);

		return true;
	};

	return clearEddsAsync();
};

/***
 * @summary Handle the node inserts from the CONTEXT.NEWNODES
 * @param $happn
 * @param context - data context which stores context.newnodes
 */
DataService.prototype.__insertNewNodes = function($happn, context) {
	const { error: logError } = $happn.log;
	const { nodeRepository } = $happn.exchange;

	let insertNewAsync = async () => {
		for (const node of context.newNodes) {
			try {
				node.data.created = node.meta.storedPacketDate;
				node.data.modified = node.meta.storedPacketDate;
				await node.setPath();
				const nodeClone = { ...node.data };

				await nodeRepository.insertNodeData(nodeClone);
			} catch (err) {
				logError(`Insert Node Error: ${JSON.stringify(node, null, 2)}`);
				return Promise.reject(err);
			}
		}
	};

	return insertNewAsync();
};

DataService.prototype.__updateExistingNodes = function($happn, context) {
	const { error: logError } = $happn.log;
	const { nodeRepository } = $happn.exchange;

	let updateExistingAsync = async () => {
		for (const node of context.updateNodes) {
			const { data, meta } = node;
			try {
				if (data.serial != null && meta.dirty) {
					let changedObject = {
						serial: data.serial,
						typeId: data.typeId,
						modified: meta.storedPacketDate,
						changes: meta.dirty
					};

					$happn.emit("nodes/updated", changedObject);
					//await this.__updateNode($happn, node);
					node.data.modified = node.meta.storedPacketDate;
					await node.setPath();
					let nodeClone = { ...node.data };
					nodeRepository.insertNodeData(nodeClone);
				}
			} catch (err) {
				logError(`error updating  ${JSON.stringify(node, null, 2)} -  ${err} `);
				return Promise.reject(err);
			}
		}
	};
	return updateExistingAsync();
};

DataService.prototype.__updateMissingNodes = function($happn, context) {
	const { error: logError } = $happn.log;

	let updateMissingAsync = async () => {
		for (const node of context.missingNodes) {
			const { data: nodeData } = node;

			try {
				//change the communicationStatus to 0 for all missing nodes
				if (nodeData.typeId == 2 || nodeData.typeId == 3) {
					nodeData.communicationStatus = 0;
				}

				//also change the windowId to 0 so the node will be excluded from data mapping
				if (nodeData.typeId != 4) {
					nodeData.windowId = 0;
				}

				//await this.__updateNode($happn, node);
			} catch (err) {
				logError(`error updaing missing node ${node}  ${err}`);
				return Promise.reject(err);
			}
		}
	};

	return updateMissingAsync();
};

/*************************************************************
 * PARENT AND WINDOW ID FUNCTIONS
 **************************************************************
 */

/***
 * @summary If the ordering of a set of IB651s change in a ping request, this reshuffles previously saved IB651 window ids
 * @param nodeArr
 * @param updateNodes
 * @private
 */
DataService.prototype.__reshuffleWindowIds = function(nodeArr, updateNodes) {
	let reshuffleAsync = async () => {
		try {
			for (const inNode of nodeArr) {
				let { data: inNodeData } = inNode;

				if (inNodeData.typeId === 2) {
					for (const nodeUpdate of updateNodes) {
						if (
							inNodeData.typeId == nodeUpdate.data.typeId &&
							inNodeData.serial == nodeUpdate.data.serial
						) {
							nodeUpdate.data.windowId = inNodeData.windowId;
						}
					}
				}
			}
			return updateNodes;
		} catch (err) {
			console.log("Error reshuffling nodes : ", err);
			return Promise.reject(err);
		}
	};
	return reshuffleAsync();
};

/***
 * @summary Modifies a specific node's parent_id, coordinates and windowId by reference.
 * @param currentNode
 * @param branch
 * @private
 */
DataService.prototype.__setParentId = function(currentNode, branch) {
	let parentId = null;

	let parent = this.__nodeTreeUtil.findParent(branch, currentNode.data.typeId);

	if (parent !== null) {
		parentId = parent.data.id;
		currentNode.data.parentSerial = parentId;
	}

	switch (currentNode.data.typeId) {
	case 1: // ISC
		currentNode.data.windowId = 0;
		break;
	}
};

module.exports = DataService;
