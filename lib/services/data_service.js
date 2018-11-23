function DataService() {
	const NodeTreeUtils = require("../utils/node_tree_utils");
	this.__nodeTreeUtil = new NodeTreeUtils();

	const PacketTemplate = require("../constants/packetTemplates");
	this.__constants = new PacketTemplate();
}

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
	const { performance } = require("perf_hooks");

	const { eventService } = $happn.exchange;
	const { info: logInfo, error: logError } = $happn.log;

	let fullTree = [];
	// the subtree is a subset of existing tree, starting from the incoming parent node
	let subTree = [];
	let context;

	const buildTreeAsync = async () => {
		try {
			fullTree = await this.buildTree($happn);

			//type 3 doesnt come in from a list query so need to insert the parentID here
			let arrParent = nodeArr[0].data;
			if (arrParent.type_id === 3 && arrParent.parent_id === null) {
				let controlunit = fullTree.find(x => x.data.type_id === 0);
				arrParent.parent_id =
					controlunit !== undefined ? controlunit.data.id : null;
			}

			//get sub tree for the begining node of this packet (eg if this packet is for isc3
			//if should find the ibc, and then any connected i651s)
			if (fullTree.length > 0) {
				if (arrParent.type_id === 0) {
					subTree = fullTree;
				} else {
					subTree = await this.__nodeTreeUtil.findSubTree(
						fullTree,
						arrParent.serial,
						arrParent.type_id
					);
				}
			}

			context = new Context(fullTree, subTree);
		} catch (err) {
			logError("BuildTree error", err);
			return Promise.reject(err);
		}
	};

	let checkTreeAsync = async () => {
		logInfo("NODE UPSERT - NEW, UPDATED & MISSING NODES...");
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
		logInfo("NODE UPSERT -  REORDERING WINDOW IDS");
		const { updateNodes: nodesToUpdate } = context;
		//shuffle the window id's for those IB651's that already exist in the DB, but have a different ordering
		//TODO need to figure this
		try {
			let reshuffle = await this.__reshuffleWindowIds(nodeArr, nodesToUpdate);
			context.updateNodes = reshuffle;
		} catch (err) {
			logError("reorder error", err);
			return Promise.reject(err);
		}
	};

	let performUpdateAsync = async () => {
		const { updateNodes: nodesToUpdate } = context;
		logInfo("NODE UPSERT - UPDATE EXISTING NODES...", nodesToUpdate.length);

		try {
			if (nodesToUpdate.length > 0) {
				await this.__updateExistingNodes($happn, context);
			}
		} catch (err) {
			logError("Perform Update Error", err);
			return Promise.reject(err);
		}
	};

	let performInsertAsync = async () => {
		logInfo("NODE UPSERT - INSERT NEW NODES...", context.newNodes.length);
		try {
			if (context.newNodes.length > 0) {
				await this.__insertNewNodes($happn, context);
			}
		} catch (err) {
			logError("Insert error", err);
			return Promise.reject(err);
		}
	};

	const performMissingAsync = async () => {
		logInfo(
			"NODE UPSERT - UPDATE COMMS FOR MISSING NODES...",
			context.missingNodes.length
		);
		try {
			if (context.missingNodes.length > 0) {
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

			await eventService.checkEddClearSignal(nodeArr);
			await buildTreeAsync();
			await eventService.handleFireButton(nodeArr, context);
			await checkTreeAsync();
			await reorderWindowIdsAsync();
			await performUpdateAsync();
			await performInsertAsync();
			await performMissingAsync();
			//logInfo("Process logs.............");

			await eventService.processLogs(context);
			//logInfo("Process Upsert comlete.............");
			// eslint-disable-next-line no-unused-vars
			let datastructure = await eventService.getModelStructure();
			var t1 = performance.now();
			console.log("Call to doSomething took " + (t1 - t0) + " milliseconds.");
			//console.log("MODEL----", datastructure);
		} catch (err) {
			logError("Process Upsert error.............", err);
			return Promise.reject(err);
		}
	};

	return processUpsert();
};

/***
 * @summary Async function which builds a flat array of node objects, each with the full happn_path (tree position)
 * @param $happn
 * @param nodeRepository
 */
DataService.prototype.buildTree = function($happn) {
	const { error: logError } = $happn.log;
	// eslint-disable-next-line no-unused-vars
	const { nodeRepository, eventService } = $happn.exchange;

	const buildTreeAsync = async () => {
		try {
			//let allNodes = await nodeRepository.getAllNodes();
			let allNodes = await eventService.getModelStructure();

			let controlUnit = allNodes.find(item => item.data.type_id == 0);
			let iscs = allNodes.filter(item => item.data.type_id == 1);
			let ib651s = allNodes.filter(item => item.data.type_id == 2);
			let cbbs = allNodes.filter(item => item.data.type_id == 3);
			let edds = allNodes.filter(item => item.data.type_id == 4);

			let controlUnitPath = "/0/";
			let currentPath = "";

			if (controlUnit) {
				controlUnitPath = `${controlUnitPath}${controlUnit.data.serial}`;
				controlUnit.meta.happn_path = controlUnitPath;
			} else {
				controlUnitPath = `${controlUnitPath}*`;
			}

			if (iscs.length > 0) {
				controlUnit.meta.children = iscs.length;

				iscs.forEach(isc => {
					currentPath = `${controlUnitPath}/1/${isc.data.serial}`;
					isc.meta.happn_path = currentPath;

					let attachedi651s = ib651s.filter(
						ib651 => ib651.data.parent_id === isc.data.id
					);

					isc.meta.children = attachedi651s.length;

					attachedi651s.forEach(
						ib651 =>
							(ib651.meta.happn_path = `${currentPath}/2/${ib651.data.serial}`)
					);
				});
			} else if (ib651s.length > 0) {
				currentPath = `${controlUnitPath}/1/*`;

				ib651s.forEach(
					ib651 => (ib651.meta.happn_path = `${currentPath}/2/${ib651.serial}`)
				);
			}

			if (cbbs.length > 0) {
				controlUnit.meta.children = cbbs.length;

				cbbs.forEach(cbb => {
					currentPath = `${controlUnitPath}/1/${cbb.data.serial}`;
					cbb.meta.happn_path = currentPath;

					let attachedEdds = edds.filter(
						edd => edd.data.parent_id == cbb.data.id
					);

					cbb.meta.children = attachedEdds.length;

					attachedEdds.forEach(edd => {
						edd.meta.happn_path = `${currentPath}/3/${edd.data.serial}`;
					});
				});
			} else if (edds.length > 0) {
				currentPath = `${controlUnitPath}/3/*`;

				edds.forEach(
					edd => (edd.meta.happn_path = `${currentPath}/4/${edds.serial}`)
				);
			}

			return allNodes;
		} catch (err) {
			logError("Build Tree Error error", err);
			return Promise.reject(err);
		}
	};

	return buildTreeAsync();
};

/***
 * @summary Handle the node inserts from the CONTEXT.NEWNODES
 * @param $happn
 * @param context - data context which stores context.newnodes
 * @param nodeRepository - the repository to handle db writing
 */
DataService.prototype.__insertNewNodes = function($happn, context) {
	let parentId = null;

	let insertNewAsync = async () => {
		for (const node of context.newNodes) {
			const { data: nodeData } = node;

			try {
				if (
					nodeData.serial !== null &&
					context.subTree &&
					context.subTree.length > 0
				) {
					await this.__setParentId(node, context.fullTree);
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
				$happn.log.error(`Insert Node Error: ${JSON.stringify(node, null, 2)}`);
				return Promise.reject(err);
			}
		}
	};

	return insertNewAsync();
};

DataService.prototype.__insertNode = function($happn, node) {
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

DataService.prototype.__updateExistingNodes = function($happn, context) {
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

DataService.prototype.__updateMissingNodes = function($happn, context) {
	let updateMissingAsync = async () => {
		for (const node of context.missingNodes) {
			const { data: nodeData } = node;

			try {
				//change the communication_status to 0 for all missing nodes
				if (nodeData.type_id == 2) {
					nodeData.communication_status = 0;
				}

				if (nodeData.type_id == 3) {
					nodeData.communication_status = 0;
				}

				//also change the window_id to 0 so the node will be excluded from data mapping
				if (nodeData.type_id != 4) {
					nodeData.window_id = 0;
				}

				await this.__updateNode($happn, node);
			} catch (err) {
				$happn.log.error(`error updaing missing node ${node}  ${err}`);
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
	const { nodeRepository, eventService } = $happn.exchange;

	let updateNodeAS = async () => {
		try {
			let nodeClone = JSON.parse(JSON.stringify(node.data));
			await eventService.updateNode(node);

			//UPDATE the model in the eventservice
			nodeRepository.updateNodeData(nodeClone);
		} catch (err) {
			$happn.log.error("UPDATING NODE ERROR>>>> : ", err, node);
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
			for (const incomingNode of nodeArr) {
				if (incomingNode.data.type_id === 2) {
					for (const nodeUpdate of updateNodes) {
						if (
							incomingNode.data.type_id === nodeUpdate.data.type_id &&
							incomingNode.data.serial === nodeUpdate.data.serial
						) {
							nodeUpdate.data.window_id = incomingNode.data.window_id;
						}
					}
				}
			}
			return updateNodes;
		} catch (err) {
			console.log("RESHUFFLE NODE ERROR>>>> : ", err);
			return Promise.reject(err);
		}
	};
	return reshuffleAsync();
};

/***
 * @summary Modifies a specific node's parent_id, coordinates and window_id by reference.
 * @param currentNode
 * @param subTree
 * @private
 */
DataService.prototype.__setParentId = function(currentNode, subTree) {
	let parentId = null;

	let parent = this.__nodeTreeUtil.findParent(
		subTree,
		currentNode.data.type_id
	);

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
