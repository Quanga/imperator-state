//var asyncs = require("async");

function DataService() {
	const NodeTreeUtils = require("../utils/node_tree_utils");
	this.__nodeTreeHelper = new NodeTreeUtils();
}

/***
 * @summary Async function that takes the packet array and inserts inserts it into the packet database
 * @param $happn
 * @param packetArr - parsed node data that has been received from the IBC
 */
DataService.prototype.insertPacketArr = function($happn, packetArr) {
	const { packetRepository, dataMapper } = $happn.exchange;
	const { error: logError } = $happn.log;

	const insertPacketArrAsync = async () => {
		for (const packet of packetArr) {
			try {
				let mappedPacket = await dataMapper.mapInsertPacket(packet);
				let result = await packetRepository.insertPacketArr(mappedPacket);
				return result;
			} catch (err) {
				logError("insertPacketArr update error", err);
			}
		}
	};

	return insertPacketArrAsync();
};

/***
 * @summary Async function that performs an insert or update for each node in a set of incoming nodes, depending
 *  on whether or not a particular node already exists.
 * @param $happn
 * @param nodeArr - parsed node data that has been received from the IBC
 */
DataService.prototype.upsertNodeDataArr = function($happn, nodeArr) {
	const { nodeRepository } = $happn.exchange;
	const { info: logInfo, error: logError, warn: logWarn } = $happn.log;
	const { performance } = require("perf_hooks");

	let fullTree = [];
	let subTree = [];
	let context;

	const buildTreeAsync = async () => {
		try {
			//get all
			fullTree = await this.__buildTree($happn, nodeRepository);

			//get sub tree for the begining node of this packet (eg if this packet is for isc3
			//if should find the ibc, and then any connected i651s)
			if (fullTree.length > 0) {
				subTree = await this.__nodeTreeHelper.findSubTree(
					fullTree,
					nodeArr[0].serial,
					nodeArr[0].type_id
				);
			}
		} catch (err) {
			logError("BuildTree error", err);
		}
	};

	//Build a context to hold the data as it is processed
	//note: this context is for the node array packet only
	let buildContextAsync = async () => {
		context = {
			updateNodes: [],
			newNodes: [],
			missingNodes: [],
			fullTree: fullTree,
			subTree: subTree,
			parentSerial: nodeArr[0].serial,
			parentType: nodeArr[0].type_id,
			updateParent: null,
			log: [],
			logCount: []
		};
	};

	let checkTreeAsync = async () => {
		//from the packet determine which nodes with need to be added or updated
		logInfo("NODE UPSERT - BUILD NEW, UPDATED AND MISSING NODES...");
		try {
			let extracted = await this.__nodeTreeHelper.extractNewAndUpdatedNodes(
				$happn,
				context,
				nodeArr
			);

			context.newNodes = extracted.newNodes;
			context.updateNodes = extracted.updateNodes;
			context.missingNodes = extracted.missingNodes;

			let updateNodeCount = extracted.updateNodes.length;
			context.updateParent =
				updateNodeCount && updateNodeCount > 0 ? context.updateNodes[0] : null;
		} catch (err) {
			logError("Build new and missing  error", err);
		}
	};

	// let updateParentLogs = async () => {
	// 	info("NODE UPSERT-  UPDATING PARENT LOG DATA");
	// 	try {
	// 		if (context.updateParent != null) {
	// 			let treeRoot = context.subTree[0];
	// 			context.logCount[0] = 0;

	// 			let result = this.__createLogs(
	// 				$happn,
	// 				context.updateParent,
	// 				treeRoot,
	// 				context.log,
	// 				context.logCount
	// 			);
	// 			// 		self.__createMessages(
	// 			// 			$happn,
	// 			// 			updateParent,
	// 			// 			treeRoot,
	// 			// 			message,
	// 			// 			messageCount
	// 			// 		);
	// 			return result;
	// 		}
	// 	} catch (err) {
	// 		error("Log Error", err);
	// 	}
	// };

	let reorderWindowIdsAsync = async () => {
		logInfo("NODE UPSERT -  REORDERING WINDOW IDS");
		//shuffle the window id's for those IB651's that already exist in the DB, but have a different ordering
		//TODO need to figure this
		try {
			let reshuffle = await this.__reshuffleWindowIds(
				nodeArr,
				context.updateNodes
			);
			context.updateNodes = reshuffle;
		} catch (err) {
			logError("reorder error", err);
		}
	};

	let performUpdateAsync = async () => {
		logInfo(
			"NODE UPSERT - UPDATE EXISTING NODES...",
			context.updateNodes.length
		);
		try {
			if (context.updateNodes.length > 0) {
				await this.__updateExistingNodes($happn, context, nodeRepository);
			}
		} catch (err) {
			logError("Perform Update Error", err);
		}
	};

	let performInsertAsync = async () => {
		logInfo("NODE UPSERT - INSERT NEW NODES...", context.newNodes.length);
		try {
			if (context.newNodes.length > 0) {
				await this.__insertNewNodes($happn, context, nodeRepository);
			}
		} catch (err) {
			logError("Insert error", err);
		}
	};

	const performMissingAsync = async () => {
		logInfo(
			"NODE UPSERT - UPDATE COMMS FOR MISSING NODES...",
			context.missingNodes.length
		);
		try {
			if (context.missingNodes.length > 0) {
				await this.__updateMissingNodes($happn, context, nodeRepository);
			}
		} catch (err) {
			logError("Updating Missing Error -", err);
		}
	};

	const processUpsert = async () => {
		try {
			logWarn(
				`Call to UpdateNode ----------------------------------------------`
			);

			let funcTotalStart = performance.now();
			let funcStart = performance.now();
			await buildTreeAsync();
			let funcEnd = performance.now();
			logWarn(`BuildTree took ${funcEnd - funcStart} ms.`);

			funcStart = performance.now();
			await buildContextAsync();
			funcEnd = performance.now();
			logWarn(`BuildContext took ${funcEnd - funcStart} ms.`);

			funcStart = performance.now();
			await checkTreeAsync();
			funcEnd = performance.now();
			logWarn(`Checktree took ${funcEnd - funcStart} ms.`);

			//await updateParentLogs();
			funcStart = performance.now();

			await reorderWindowIdsAsync();
			funcEnd = performance.now();
			logWarn(`reorder took ${funcEnd - funcStart} ms.`);

			funcStart = performance.now();
			await performUpdateAsync();
			funcEnd = performance.now();
			logWarn(`perform update took ${funcEnd - funcStart} ms.`);

			funcStart = performance.now();
			await performInsertAsync();
			funcEnd = performance.now();
			logWarn(`perform insert took ${funcEnd - funcStart} ms.`);

			funcStart = performance.now();
			await performMissingAsync();
			funcEnd = performance.now();
			logWarn(`perform missing took ${funcEnd - funcStart} ms.`);

			let funcTotalEnd = performance.now();
			logWarn(`Call to UpdateNode took ${funcTotalEnd - funcTotalStart} ms.`);
		} catch (err) {
			logError("Process Upsert error.............", err);
		}
	};

	return processUpsert();
};

/***
 * @summary Async function which builds a flat array of node objects, each with the full happn_path (tree position)
 * @param $happn
 * @param nodeRepository
 */
DataService.prototype.__buildTree = function($happn, nodeRepository) {
	const { error: logError } = $happn.log;

	const buildTreeAsync = async () => {
		try {
			let allNodes = await nodeRepository.getAllNodes();

			let controlUnit = allNodes.find(item => item.type_id == 0);
			let iscs = allNodes.filter(item => item.type_id == 1);
			let ib651s = allNodes.filter(item => item.type_id == 2);
			let cbbs = allNodes.filter(item => item.type_id == 3);
			let edds = allNodes.filter(item => item.type_id == 4);

			let controlUnitPath = "/0/";
			let currentPath = "";

			if (controlUnit) {
				controlUnitPath = `${controlUnitPath}${controlUnit.serial}`;
				controlUnit.happn_path = controlUnitPath;
			} else {
				controlUnitPath = `${controlUnitPath}*`;
			}

			if (iscs.length > 0) {
				iscs.forEach(isc => {
					currentPath = `${controlUnitPath}/1/${isc.serial}`;
					isc.happn_path = currentPath;

					ib651s
						.filter(ib651 => ib651.parent_id == isc.id)
						.forEach(
							ib651 => (ib651.happn_path = `${currentPath}/2/${ib651.serial}`)
						);
				});
			} else if (ib651s.length > 0) {
				currentPath = `${controlUnitPath}/1/*`;

				ib651s.forEach(
					ib651 => (ib651.happn_path = `${currentPath}/2/${ib651.serial}`)
				);
			}

			if (cbbs.length > 0) {
				cbbs.forEach(cbb => {
					currentPath = `${controlUnitPath}/1/${cbb.serial}`;
					cbb.happn_path = currentPath;

					edds.filter(edd => edd.parent_id == cbb.id).forEach(edd => {
						edd.happn_path = `${currentPath}/3/${edd.serial}`;
					});
				});
			} else if (edds.length > 0) {
				currentPath = `${controlUnitPath}/3/*`;

				edds.forEach(
					edd => (edd.happn_path = `${currentPath}/4/${edds.serial}`)
				);
			}

			return allNodes;
		} catch (err) {
			logError("Build Tree Error error", err);
		}
	};

	return buildTreeAsync();
};

DataService.prototype.__insertNewNodes = function(
	$happn,
	context,
	nodeRepository
) {
	// insertion of nodes will only ever involve one or a maximum of 2 levels, eg:
	// one IBC
	// one IBC & multiple ISCs
	// one or more ISCs - in this case a tree must already exist (with a minimum of 1 IBC in it)
	// one ISC and multiple IB651s - in this case a tree must already exist (with a minimum of 1 IBC in it)
	// one or more IB651s - in this case a tree must already exist (with a minimum of 1 IBC in it)
	let parentId = null;

	let insertNewAsync = async () => {
		for (const node of context.newNodes) {
			try {
				if (node.serial != null && context.subTree.length > 0) {
					// if a tree was found then the parent_id can be derived
					await this.__setParentId(node, context.subTree);
				} else {
					// no tree is found which means that this must be a new node/set of nodes
					// just grab the nodeId of the previous insert which should be the parent.
					node.parent_id = parentId;
				}

				let newNode = await this.__insertNode($happn, nodeRepository, node);
				if (parentId == null) {
					parentId = newNode;
				}
				//console.log(`ParentID for ${node.serial} is ${parentId}`);
			} catch (err) {
				$happn.log.error(`error inserting node - ${node} - ${err}`);
			}
		}
	};

	return insertNewAsync();
};

DataService.prototype.__insertNode = function($happn, repository, node) {
	let clone = require("clone");
	//var config = $happn.config;
	let insNode = async () => {
		if (
			node.serial != null
			// eg: DISALLOWED_INSERTS=0 disallows all IBC inserts (IBC has type_id=0)
			//ensures no null nodes are inserted as a result of duplicate widows.
		) {
			try {
				let nodeId = await repository.insertNodeData(clone(node));
				return nodeId;
			} catch (err) {
				$happn.log.error("___Insert Node error", err);
			}
		} else {
			return null;
		}
	};

	return insNode();
};

DataService.prototype.__updateExistingNodes = function(
	$happn,
	context,
	nodeRepository
) {
	let updateExistingAsync = async () => {
		for (const node of context.updateNodes) {
			try {
				if (node.serial != null) {
					await this.__updateNode($happn, nodeRepository, node);
				}
			} catch (err) {
				$happn.log.error(`error updating node ${node} -  ${err} `);
			}
		}
	};
	return updateExistingAsync();
};

DataService.prototype.__updateMissingNodes = function(
	$happn,
	context,
	nodeRepository
) {
	var self = this;

	let updateMissingAsync = async () => {
		for (const node of context.missingNodes) {
			try {
				//change the communication_status to 0 for all missing nodes
				if (node.type_id == 2) {
					node.communication_status = 0;
				}

				//also change the window_id to 0 so the node will be excluded from data mapping
				if (node.type_id != 4) {
					node.window_id = 0;
				}

				await self.__updateNode($happn, nodeRepository, node);
			} catch (err) {
				$happn.log.error(`error updaing missing node ${node}  ${err}`);
			}
		}
	};

	return updateMissingAsync();
};

DataService.prototype.__updateNode = function($happn, repository, node) {
	let updateNodeAS = async () => {
		try {
			let clone = require("clone");
			let nodeClone = clone(node);
			await repository.updateNodeData(nodeClone);
		} catch (err) {
			$happn.log.err("UPDATING NODE ERROR>>>> : ", err);
		}
	};

	return updateNodeAS();
};

/***
 * @summary If the ordering of a set of IB651s change in a ping request, this reshuffles previously saved IB651 window ids
 * @param nodeArr
 * @param updateNodes
 * @private
 */
DataService.prototype.__reshuffleWindowIds = function(nodeArr, updateNodes) {
	// the incoming nodeArr has already had window id's added to IB651 nodes in PacketUtils.createPacketResult
	//console.log("node array", nodeArr);
	let reshuffleAsync = async () => {
		for (const incomingNode of nodeArr) {
			//nodeArr.forEach(incomingNode => {
			if (incomingNode.type_id === 2) {
				for (const nodeUpdate of updateNodes) {
					//updateNodes.forEach(nodeUpdate => {
					// TODO: check this - in a situation where the serial of the incoming node is not known?

					if (
						incomingNode.type_id == nodeUpdate.type_id &&
						parseInt(incomingNode.serial) === parseInt(nodeUpdate.serial)
					) {
						// console.log("INCOMING WINDOW ID: ", incomingNode.window_id);
						// console.log("UPDATE NODE WINDOW ID: ", nodeUpdate.window_id);

						nodeUpdate.window_id = incomingNode.window_id;
					}
				}
			}
		}
		//console.log("NODE UPDATES", updateNodes);
		return updateNodes;
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
	let parent = this.__nodeTreeHelper.findParent(subTree, currentNode.type_id);

	//console.log(`PARENT ID FOR ${currentNode.serial} IS ${parent.serial}`);

	if (parent != null) {
		parentId = parent.id;
	}

	switch (currentNode.type_id) {
	case 1: // ISC
		currentNode.parent_id = parentId;
		currentNode.window_id = 0;
		break;

	case 2: // IB651
		currentNode.parent_id = parentId;
		break;

	case 3: //CBB
		currentNode.parent_id = parentId;
		currentNode.window_id = 0;
		break;

	case 4: //EDD
		currentNode.parent_id = parentId;
		break;
	}
};

/***
 * @summary
 * @param $happn
 * @param updatedNode
 * @param treeNode
 * @param log
 * @param logCount
 * @private
 */
DataService.prototype.__createLogs = function(
	$happn,
	updatedNode,
	treeNode,
	log,
	logCount
) {
	const self = this;

	const Constants = require("../constants/command_constants");
	this.__constants = new Constants();

	let serial = treeNode.serial;

	let commandConstant = this.__constants.ibcToPiCommands[3];

	let constantData;
	if (updatedNode.type_id == 2)
		constantData = commandConstant.data.remaining_bytes.bits;
	else {
		constantData =
			treeNode.type_id == 0
				? this.__constants.ibcToPiCommands[8].data.first_byte.bits
				: commandConstant.data.first_byte.bits;
	}
	if (updatedNode.type_id < 4) {
		if (
			updatedNode.key_switch_status != null &&
			updatedNode.key_switch_status != treeNode.key_switch_status
		)
			self.__getLogFromConstants(
				log,
				updatedNode.key_switch_status,
				constantData.key_switch_status,
				serial,
				logCount
			);

		if (
			updatedNode.fire_button != null &&
			updatedNode.fire_button != treeNode.fire_button
		)
			self.__getLogFromConstants(
				log,
				updatedNode.fire_button,
				constantData.fire_button,
				serial,
				logCount
			);

		if (
			updatedNode.booster_fired_lfs != null &&
			updatedNode.booster_fired_lfs != treeNode.booster_fired_lfs
		)
			self.__getLogFromConstants(
				log,
				updatedNode.booster_fired_lfs,
				constantData.booster_fired_lfs,
				serial,
				logCount
			);
	}
};

DataService.prototype.__createMessages = function(
	$happn,
	updatedNode,
	treeNode,
	message,
	messageCount
) {
	const Constants = require("../constants/command_constants");
	this.__constants = new Constants();

	let serial = treeNode.serial;
	let type_id = treeNode.type_id;
	let parent_serial = treeNode.parent_serial;

	let commandConstant = this.__constants.ibcToPiCommands[3];
	let constantData = null;

	if (updatedNode.type_id == 3 || updatedNode.type_id == 4) return;

	if (updatedNode.type_id == 2)
		constantData = commandConstant.data.remaining_bytes.bits;
	else {
		constantData =
			treeNode.type_id == 0
				? this.__constants.ibcToPiCommands[8].data.first_byte.bits
				: commandConstant.data.first_byte.bits;
	}
	var change = 0;

	console.log(constantData);

	var mess =
		"{ " +
		'"' +
		serial +
		'" : { "type_id" : ' +
		type_id +
		', "parent_id" : ' +
		parent_serial;

	if (
		updatedNode.key_switch_status != null &&
		updatedNode.key_switch_status != treeNode.key_switch_status
	) {
		change = 1;
		mess += ', "key_switch" : ' + updatedNode.key_switch_status;
	}

	if (
		updatedNode.temperature != null &&
		updatedNode.temperature != treeNode.temperature
	) {
		change = 1;
		mess += ', "temperature" : ' + updatedNode.temperature;
	}

	if (
		updatedNode.blast_armed != null &&
		updatedNode.blast_armed != treeNode.blast_armed
	) {
		change = 1;
		mess += ', "blast_armed" : ' + updatedNode.blast_armed;
	}
	if (
		updatedNode.fire_button != null &&
		updatedNode.fire_button != treeNode.fire_button
	) {
		change = 1;
		mess += ', "fire_button" : ' + updatedNode.fire_button;
	}

	if (
		updatedNode.isolation_relay != null &&
		updatedNode.isolation_relay != treeNode.isolation_relay
	) {
		change = 1;
		mess += ', "isolation_relay" : ' + updatedNode.isolation_relay;
	}

	if (
		updatedNode.cable_fault != null &&
		updatedNode.cable_fault != treeNode.cable_fault
	) {
		change = 1;
		mess += ', "cable_fault" : ' + updatedNode.cable_fault;
	}

	if (
		updatedNode.earth_leakage != null &&
		updatedNode.earth_leakage != treeNode.earth_leakage
	) {
		change = 1;
		mess += ', "earth_leakage" : ' + updatedNode.earth_leakage;
	}

	if (
		updatedNode.detonator_status != null &&
		updatedNode.detonator_status != treeNode.detonator_status
	) {
		change = 1;
		mess += ', "detonator_status" : ' + updatedNode.detonator_status;
	}

	if (
		updatedNode.partial_blast_lfs != null &&
		updatedNode.partial_blast_lfs != treeNode.partial_blast_lfs
	) {
		change = 1;
		mess += ', "partial_blast_lfs" : ' + updatedNode.partial_blast_lfs;
	}

	if (
		updatedNode.full_blast_lfs != null &&
		updatedNode.full_blast_lfs != treeNode.full_blast_lfs
	) {
		change = 1;
		mess += ', "full_blast_lfs" : ' + updatedNode.full_blast_lfs;
	}

	if (
		updatedNode.booster_fired_lfs != null &&
		updatedNode.booster_fired_lfs != treeNode.booster_fired_lfs
	) {
		change = 1;
		mess += ', "booster_fired_lfs" : ' + updatedNode.booster_fired_lfs;
	}

	if (
		updatedNode.missing_pulse_detected_lfs != null &&
		updatedNode.missing_pulse_detected_lfs !=
			treeNode.missing_pulse_detected_lfs
	) {
		change = 1;
		mess +=
			', "missing_pulse_detected_lfs" : ' +
			updatedNode.missing_pulse_detected_lfs;
	}

	if (
		updatedNode.AC_supply_voltage_lfs != null &&
		updatedNode.AC_supply_voltage_lfs != treeNode.AC_supply_voltage_lfs
	) {
		change = 1;
		mess += ', "AC_supply_voltage_lfs" : ' + updatedNode.AC_supply_voltage_lfs;
	}

	if (
		updatedNode.DC_supply_voltage != null &&
		updatedNode.DC_supply_voltage != treeNode.DC_supply_voltage
	) {
		change = 1;
		mess += ', "DC_supply_voltage" : ' + updatedNode.DC_supply_voltage;
	}

	if (
		updatedNode.DC_supply_voltage_status != null &&
		updatedNode.DC_supply_voltage_status != treeNode.DC_supply_voltage_status
	) {
		change = 1;
		mess +=
			', "DC_supply_voltage_status" : ' + updatedNode.DC_supply_voltage_status;
	}

	if (updatedNode.mains != null && updatedNode.mains != treeNode.mains) {
		change = 1;
		mess += ', "mains" : ' + updatedNode.mains;
	}
	mess += "}}";
	if (change) {
		message[messageCount[0]] = JSON.parse(mess);
		console.log(message[messageCount[0]]);
		messageCount[0]++;
	}
};

DataService.prototype.__getLogFromConstants = function(
	log,
	data,
	constant,
	serial,
	logCount
) {
	log[logCount[0]] = createLogResultObject();

	log[logCount[0]].message = constant.memo;
	log[logCount[0]].message += " ";

	if (parseInt(data) == 1) log[logCount[0]].message += constant.true;
	else log[logCount[0]].message += constant.false;

	log[logCount[0]].node_serial = serial;
	logCount[0]++;
};

function createLogResultObject() {
	return {
		message: null,
		node_serial: null
	};
}

module.exports = DataService;
