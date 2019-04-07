/* eslint-disable no-unused-vars */
const NodeTreeUtils = require("../utils/node_tree_utils");
const PacketTemplate = require("../constants/packetTemplates");

function DataService() {
	this.__nodeTreeUtil = new NodeTreeUtils();
	this.__constants = new PacketTemplate();
	this.state = { mode: "STOPPED" };
	this.emitCount = 0;

	this.useTest = true;
}

DataService.prototype.testData = function($happn, val) {
	this.useTest = true;
};

DataService.prototype.deleteAllTestData = function($happn) {
	$happn.exchange.data.remove("persist/dataservice/test/*", {}, (err, resp) => {
		if (err) console.log("could not remove");
		console.log(resp);
	});
};

DataService.prototype.getTests = function($happn) {
	return new Promise((resolve, reject) => {
		$happn.exchange.data.get(`persist/dataservice/test/*`, {}, (err, resp) => {
			if (err) {
				reject("cannot write to path for tests");
			}
			resolve(resp);
		});
	});
};

DataService.prototype.getState = function($happn) {
	return new Promise((resolve, reject) => {
		try {
			return resolve(this.state.state);
		} catch (err) {
			return reject(err);
		}
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
	if (process.env.NODE_ENV === "test") {
		var { performance } = require("perf_hooks");
	}

	const { config } = $happn;
	const { nodeRepository, eventService, dataService } = $happn.exchange;
	const { info: logInfo, error: logError } = $happn.log;

	let allNodes = [];

	// the branch or branch is a subset of existing tree, starting from the incoming parent node
	let branch = [];
	let context;

	let testObj = {
		packet: nodeArr,
		packetCount: nodeArr.length,
		process: []
	};

	const buildTreeAsync = async () => {
		try {
			//allNodes = await eventService.getModelStructureFlat();
			allNodes = await nodeRepository.getAllNodes();
			//type 3 doesnt come in from a list query so need to insert the parentID here
			let arrParent = nodeArr[0].data;
			if (arrParent.typeId === 3) {
				let controlunit = allNodes.find(x => x.data.typeId === 0);
				arrParent.parentSerial = controlunit.data.serial;
			}

			//get sub tree for the begining node of this packet
			if (allNodes.length > 0) {
				if (arrParent.typeId === 0) {
					branch = [allNodes[0]];
				} else {
					branch = await this.__nodeTreeUtil.findBranch(
						allNodes,
						arrParent.serial,
						arrParent.typeId
					);
				}
			}

			context = new Context(allNodes, branch);
		} catch (err) {
			logError("BuildTree error", err);
			return Promise.reject(err);
		}
	};

	let checkTreeAsync = async () => {
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
		} catch (err) {
			logError("Build new and missing  error", err);
			return Promise.reject(err);
		}
	};

	let reorderWindowIdsAsync = async () => {
		//shuffle the window id's for those IB651's that already exist in the DB, but have a different ordering

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
	};

	let performUpdateAsync = async () => {
		const { updateNodes: nodesToUpdate } = context;

		try {
			if (nodesToUpdate.length > 0) {
				logInfo("NODE UPSERT - UPDATE EXISTING NODES...", nodesToUpdate.length);

				await this.__updateExistingNodes($happn, context);
			}
		} catch (err) {
			logError("Perform Update Error", err);
			return Promise.reject(err);
		}
	};

	let performInsertAsync = async () => {
		const { newNodes: nodesToAdd } = context;
		try {
			if (nodesToAdd.length > 0) {
				logInfo("NODE UPSERT - INSERT NEW NODES...", nodesToAdd.length);
				await this.__insertNewNodes($happn, context);
			}
		} catch (err) {
			logError("Insert error", err);
			return Promise.reject(err);
		}
	};

	const performMissingAsync = async () => {
		const { missingNodes: nodesMissing } = context;

		try {
			if (context.missingNodes.length > 0) {
				// logInfo( "NODE UPSERT - UPDATE COMMS ON MISSING...", nodesMissing.length );
				await this.__updateMissingNodes($happn, context);
			}
		} catch (err) {
			logError("Updating Missing Error -", err);
			return Promise.reject(err);
		}
	};

	const processUpsert = async () => {
		try {
			if (this.useTest) var t0 = performance.now();

			let eddSig = await dataService.clearEddSignal(nodeArr);
			if (eddSig) {
				logInfo(`EDD clear signal for CBB ${eddSig.data.serial}`);
				return Promise.resolve();
			}
			if (this.useTest)
				testObj.process.push({
					proc: "EDD_SIG",
					time: performance.now() - t0
				});

			if (this.useTest) var t1 = performance.now();
			await buildTreeAsync();
			if (this.useTest)
				testObj.process.push({
					proc: "BUILD TREE",
					time: performance.now() - t1
				});

			if (this.useTest) var t2 = performance.now();
			await checkTreeAsync();
			if (this.useTest)
				testObj.process.push({
					proc: "CHECK TREE",
					time: performance.now() - t2
				});

			if (this.useTest) var t3 = performance.now();
			await reorderWindowIdsAsync();
			if (this.useTest)
				testObj.process.push({
					proc: "REORDER ID",
					time: performance.now() - t3
				});

			if (this.useTest) var t4 = performance.now();
			await performUpdateAsync();
			if (this.useTest)
				testObj.process.push({
					proc: "UPDATE",
					time: performance.now() - t4
				});

			if (this.useTest) var t5 = performance.now();
			await performInsertAsync();
			if (this.useTest)
				testObj.process.push({
					proc: "INSEERT",
					time: performance.now() - t5
				});

			if (this.useTest) var t6 = performance.now();
			await performMissingAsync();
			if (this.useTest)
				testObj.process.push({
					proc: "UPDATE",
					time: performance.now() - t6
				});

			if (this.useTest)
				testObj.process.push({
					proc: "TOTAL",
					time: performance.now() - t0
				});

			$happn.exchange.data.set(
				`persist/dataservice/test/${t0}`,
				testObj,
				{},
				(err, resp) => {
					if (err) {
						logError("cannot write to path for tests");
					}
				}
			);

			//await eventService.emit(context);
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

	// 1. check the first node is a CBB
	//2. check the second node is the signal
	//3. if it is, get the node array
	let clearEddsAsync = async () => {
		if (nodeArr.length < 2 || nodeArr[0].data.typeId !== 3)
			return Promise.resolve(null);

		const parent = nodeArr[0];
		let clearSignal = null;
		if (nodeArr[1].data.typeId === 4 && nodeArr[1].data.serial === 4294967295)
			clearSignal = nodeArr[1];
		if (!clearSignal)
		// let clearSignal = nodeArr.find(
		// 	//clear EDDs when typeId is 4, and UID is 255.255.255.255
		// 	node => node.data.typeId === 4 && node.data.serial === 4294967295
		// );

			return Promise.resolve(null);
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

		const archivePath = await archiveRepository.insertArchives(archive);

		return parent;
	};

	return clearEddsAsync();
};

/***
 * @summary Handle the node inserts from the CONTEXT.NEWNODES
 * @param $happn
 * @param context - data context which stores context.newnodes
 * @param nodeRepository - the repository to handle db writing
 */
DataService.prototype.__insertNewNodes = function($happn, context) {
	const { error: logError } = $happn.log;

	let insertNewAsync = async () => {
		for (const node of context.newNodes) {
			const { data: nodeData } = node;

			try {
				// 		if (
				// 			nodeData.serial !== null &&
				//   context.branch &&
				//   context.branch.length > 0
				// 		) {
				// 			//await this.__setParentId(node, context.allNodes);
				// 		} else {
				// 			// if (nodeData.parentSerial === null) {
				// 			// 	nodeData.parentSerial = parentId;
				// 			// }
				// 		}

				await this.__insertNode($happn, node);
			} catch (err) {
				logError(`Insert Node Error: ${JSON.stringify(node, null, 2)}`);
				return Promise.reject(err);
			}
		}
	};

	return insertNewAsync();
};

DataService.prototype.__insertNode = function($happn, node) {
	const { nodeRepository } = $happn.exchange;

	let insNode = async () => {
		if (node.data.serial != null) {
			try {
				node.data.created = node.meta.storedPacketDate;
				node.data.modified = node.meta.storedPacketDate;
				await node.setPath();
				const nodeClone = { ...node.data };

				let nodeId = await nodeRepository.insertNodeData(nodeClone);

				//ADD the model to the eventservice
				//await eventService.addNode(node);

				return nodeId;
			} catch (err) {
				$happn.log.error("___Insert Node error", err);
				return Promise.reject(err);
			}
		} else {
			return null;
		}
	};

	return insNode();
};

DataService.prototype.__updateExistingNodes = function($happn, context) {
	const { error: logError } = $happn.log;

	let updateExistingAsync = async () => {
		for (const node of context.updateNodes) {
			const { data: nodeData } = node;
			try {
				if (nodeData.serial != null && node.meta.dirty) {
					let changedObject = {
						serial: node.data.serial,
						typeId: node.data.typeId,
						modified: node.meta.storedPacketDate,
						changes: node.meta.dirty,
						number: this.emitCount
					};

					$happn.emit("nodes/updated", changedObject);
					this.emitCount++;
					console.log(this.emitCount, node.meta.dirty);
					await this.__updateNode($happn, node);
					//await this.insertNodeData($happn, node);
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

				await this.__updateNode($happn, node);
			} catch (err) {
				logError(`error updaing missing node ${node}  ${err}`);
				return Promise.reject(err);
			}
		}
	};

	return updateMissingAsync();
};

/***
 * @summary Calls the repository to update the node - alled from UPDATE and MISSING COMMS
 * @param $happn
 * @param repository - the repository to use
 * @param node - the node to update
 */
DataService.prototype.__updateNode = function($happn, node) {
	const { error: logError } = $happn.log;
	const { nodeRepository } = $happn.exchange;

	let updateNodeAS = async () => {
		try {
			node.data.modified = node.meta.storedPacketDate;
			await node.setPath();
			let nodeClone = { ...node.data };
			//nodeRepository.updateNodeData(nodeClone);
			nodeRepository.insertNodeData(nodeClone);

			//UPDATE the model in the eventservice
			//await eventService.updateNode(node);
		} catch (err) {
			logError("Error updating node: ", err, node);
			return Promise.reject(err);
		}
	};

	return updateNodeAS();
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
