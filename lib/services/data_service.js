function DataService() {
	const NodeTreeUtils = require("../utils/node_tree_utils");
	this.__nodeTreeUtil = new NodeTreeUtils();

	const PacketTemplate = require("../constants/packetTemplates");
	this.__constants = new PacketTemplate();

	this.state = { mode: "STOPPED" };
}

DataService.prototype.getState = function ($happn) {
	return new Promise((resolve, reject) => {
		try {
			return resolve(this.state.state);
		} catch (err) { return reject(err); }
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
DataService.prototype.upsertNodeDataArr = function ($happn, nodeArr) {
	const Context = require("../models/contextModel");
	const { performance } = require("perf_hooks");

	const { config } = $happn;
	const { eventService } = $happn.exchange;
	const { info: logInfo, error: logError } = $happn.log;

	let allNodes = [];
	// the branch or branch is a subset of existing tree, starting from the incoming parent node
	let branch = [];
	let context;

	const buildTreeAsync = async () => {
		try {
			allNodes = await eventService.getModelStructureFlat();

			//type 3 doesnt come in from a list query so need to insert the parentID here
			let arrParent = nodeArr[0].data;
			if (arrParent.type_id === 3 && arrParent.parent_id === null) {
				let controlunit = allNodes.find(x => x.data.type_id === 0);
				arrParent.parent_id =
					controlunit !== undefined ? controlunit.data.id : null;
			}

			//get sub tree for the begining node of this packet (eg if this packet is for isc3
			//if should find the ibc, and then any connected i651s)
			if (allNodes.length > 0) {
				if (arrParent.type_id === 0) {
					branch = [allNodes[0]];
				} else {
					branch = await this.__nodeTreeUtil.findBranch(
						allNodes,
						arrParent.serial,
						arrParent.type_id
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
			logInfo("NODE UPSERT -  REORDERING WINDOW IDS");
			try {
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
				logInfo(
					"NODE UPSERT - UPDATE COMMS ON MISSING...",
					nodesMissing.length
				);
				await this.__updateMissingNodes($happn, context);
			}
		} catch (err) {
			logError("Updating Missing Error -", err);
			return Promise.reject(err);
		}
	};

	const processUpsert = async () => {
		try {
			var t0 = performance.now();
			this.state.mode = "PROCESSING";

			await eventService.checkEddClearSignal(nodeArr);
			await buildTreeAsync();
			await checkTreeAsync();
			await reorderWindowIdsAsync();
			await performUpdateAsync();
			await performInsertAsync();
			await performMissingAsync();

			await eventService.processLogs(context);
			this.state.mode = "IDLE";

			var t1 = performance.now();
			logInfo("Call to Upsert Node took " + (t1 - t0) + " milliseconds.");
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
 * @param context - data context which stores context.newnodes
 * @param nodeRepository - the repository to handle db writing
 */
DataService.prototype.__insertNewNodes = function ($happn, context) {
	const { error: logError } = $happn.log;
	let parentId = null;

	let insertNewAsync = async () => {
		for (const node of context.newNodes) {
			const { data: nodeData } = node;

			try {
				if (
					nodeData.serial !== null &&
					context.branch &&
					context.branch.length > 0
				) {
					await this.__setParentId(node, context.allNodes);
				} else {
					if (nodeData.parent_id === null) {
						nodeData.parent_id = parentId;
					}
				}

				let newNodeId = await this.__insertNode($happn, node);
				if (parentId === null) {
					parentId = newNodeId;
				}
			} catch (err) {
				logError(`Insert Node Error: ${JSON.stringify(node, null, 2)}`);
				return Promise.reject(err);
			}
		}
	};

	return insertNewAsync();
};

DataService.prototype.__insertNode = function ($happn, node) {
	const { nodeRepository, eventService } = $happn.exchange;

	let insNode = async () => {
		// eg: DISALLOWED_INSERTS=0 disallows all IBC inserts (IBC has type_id=0)
		if (node.data.serial != null) {
			try {
				//let nodeClone = JSON.parse(JSON.stringify(node));
				let timestamp = new Date(node.meta.storedPacketDate)
					.toISOString()
					.slice(0, 19)
					.replace("T", " ");

				node.data.created = timestamp;
				node.data.modified = timestamp;

				let nodeClone = JSON.parse(JSON.stringify(node));

				delete nodeClone.meta.storedPacketDate;

				let nodeId = await nodeRepository.insertNodeData(nodeClone.data);

				//ADD the model to the eventservice
				node.data.id = nodeId;
				await eventService.addNode(node);

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

DataService.prototype.__updateExistingNodes = function ($happn, context) {
	const { error: logError } = $happn.log;

	let updateExistingAsync = async () => {
		for (const node of context.updateNodes) {
			const { data: nodeData } = node;
			try {
				if (nodeData.serial != null && node.meta.dirty) {
					await this.__updateNode($happn, node);
				}
			} catch (err) {
				logError(`error updating  ${JSON.stringify(node, null, 2)} -  ${err} `);
				return Promise.reject(err);
			}
		}
	};
	return updateExistingAsync();
};

DataService.prototype.__updateMissingNodes = function ($happn, context) {
	const { error: logError } = $happn.log;

	let updateMissingAsync = async () => {
		for (const node of context.missingNodes) {
			const { data: nodeData } = node;

			try {
				//change the communication_status to 0 for all missing nodes
				if (nodeData.type_id == 2 || nodeData.type_id == 3) {
					nodeData.communication_status = 0;
				}

				//also change the window_id to 0 so the node will be excluded from data mapping
				if (nodeData.type_id != 4) {
					nodeData.window_id = 0;
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
DataService.prototype.__updateNode = function ($happn, node) {
	const { error: logError } = $happn.log;
	const { nodeRepository, eventService } = $happn.exchange;

	let updateNodeAS = async () => {
		try {
			//UPDATE the database
			let nodeClone = JSON.parse(JSON.stringify(node.data));
			nodeRepository.updateNodeData(nodeClone);
			//UPDATE the model in the eventservice
			await eventService.updateNode(node);
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
DataService.prototype.__reshuffleWindowIds = function (nodeArr, updateNodes) {
	let reshuffleAsync = async () => {
		try {
			for (const inNode of nodeArr) {
				let { data: inNodeData } = inNode;

				if (inNodeData.type_id === 2) {
					for (const nodeUpdate of updateNodes) {
						if (
							inNodeData.type_id == nodeUpdate.data.type_id &&
							inNodeData.serial == nodeUpdate.data.serial
						) {
							nodeUpdate.data.window_id = inNodeData.window_id;
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
 * @summary Modifies a specific node's parent_id, coordinates and window_id by reference.
 * @param currentNode
 * @param branch
 * @private
 */
DataService.prototype.__setParentId = function (currentNode, branch) {
	let parentId = null;

	let parent = this.__nodeTreeUtil.findParent(branch, currentNode.data.type_id);

	if (parent !== null) {
		parentId = parent.data.id;
		currentNode.data.parent_id = parentId;
	}

	switch (currentNode.data.type_id) {
	case 1: // ISC
		currentNode.data.window_id = 0;
		break;
	}
};

module.exports = DataService;
