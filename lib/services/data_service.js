/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable no-unused-vars */
const PacketTemplate = require("../constants/packetTemplates");
const Context = require("../models/contextModel");
var Queue = require("better-queue");

function DataService() {
	this.__constants = new PacketTemplate();
}

DataService.prototype.start = function($happn) {
	const { stateService } = $happn.exchange;
	const { info: logInfo } = $happn.log;
	const { emit } = $happn;

	return new Promise(resolve => {
		logInfo("starting data service");
		stateService.updateState({ service: $happn.name, state: "STARTED" });

		this.emitQueue = new Queue(
			(task, cb) => {
				//console.log("EMITTING", JSON.stringify(task, null, 2));
				emit(task.path, { value: task.value });

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

		resolve();
	});
};

DataService.prototype.stop = function($happn) {
	const { info: logInfo } = $happn.log;

	return new Promise(resolve => {
		logInfo("stopping data service");
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
	const { nodeRepository, dataService, nodeTreeUtils } = $happn.exchange;
	const { info: logInfo, error: logError } = $happn.log;
	let context;

	const parentType = nodeArr[0].data.typeId;

	const findBranch = async arr => {
		const branch = await nodeRepository.getNodeTree(
			parentType,
			arr[0].data.serial
		);
		return branch;
	};

	const buildContext = async (arr, branch) => {
		try {
			context = await nodeTreeUtils.extractUpdates(new Context(arr, branch));
			return context;
		} catch (err) {
			logError("BuildTree error", err);
			return Promise.reject(err);
		}
	};

	let performUpdateAsync = async () => {
		const { updateNodes, newNodes, missingNodes } = context;

		if (updateNodes.length > 0) {
			logInfo("NODE UPSERT - UPDATE EXISTING NODES...", updateNodes.length);
			await this.__updateExistingNodes($happn, context);
		}
		if (newNodes.length > 0) {
			logInfo("NODE UPSERT - INSERT NEW NODES...", newNodes.length);
			await this.__insertNewNodes($happn, context);
		}
		if (missingNodes.length > 0) {
			logInfo("NODE UPSERT - UPDATE COMMS ON MISSING...", missingNodes.length);
			await this.__updateMissingNodes($happn, context);
		}
	};

	const processUpsert = async () => {
		try {
			const arrChecked = await dataService.clearEddSignal(nodeArr);
			const branch = await findBranch(arrChecked);
			const prepArr = await dataService.preProcess(arrChecked, branch);
			await buildContext(prepArr, branch);
			await performUpdateAsync();
			await dataService.postProcess(context.nodeArr, context.branch);
		} catch (err) {
			logError("Process Upsert error.............", err);
			return Promise.reject(err);
		}
	};

	return processUpsert();
};

DataService.prototype.preProcess = function($happn, arr, branch) {
	const { dataService } = $happn.exchange;

	let result = [...arr];
	const parentType = arr[0].data.typeId;

	let preProcessAsync = async () => {
		if (parentType === 3) {
			//edge case for loading dets in 04 command
			if (arr[0].dataType === "list") {
				if (arr.length > 1) {
					const branchUnits = branch.length > 0 ? branch.length - 1 : 0;
					result[0].data.loadCount = result.length - 1 + branchUnits;
				} else {
					if (result[0].data.loadCount !== null) {
						result[0].data.loadCount =
							branch.length > 0 ? branch[0].data.loadCount : 0;
					} else {
						result[0].data.loadCount = 0;
					}
				}

				return result;
			}

			if (arr[0].dataType === "data") {
				//need to preserve the loadcount from being reset on the 05 command
				if (arr.length > 0) {
					result[0].data.loadCount =
						branch.length > 0 ? branch[0].data.loadCount : 0;
				} else {
					if (result[0].data.loadCount !== null) {
						result[0].data.loadCount =
							branch.length > 0 ? branch[0].data.loadCount : 0;
					} else {
						result[0].data.loadCount = 0;
					}
				}

				//edge case where strange edd comes in after eddsig in an 05 command
				if (
					result.length === 2 &&
					result[1].data.delay === 255 &&
					result[1].data.windowId === 255
				) {
					result = result.slice(0, 1);
				}
				//edge case - turn off edds if the cbb goes from on to off
				const checkedArr = await dataService.checkCBBKeyOff(result, branch);
				//return arr;

				return checkedArr;
			}
		}
		return result;
	};
	return preProcessAsync();
};

DataService.prototype.postProcess = function($happn, nextState, prevState) {
	const { blastService, dataService } = $happn.exchange;

	const { data, meta } = nextState[0];

	const postProcessAsync = async () => {
		switch (data.typeId) {
		case 0:
			{
				if (
					prevState.length > 0 &&
						data.keySwitchStatus === 1 &&
						data.fireButton === 1 &&
						prevState[0].data.fireButton === 0
				) {
					await blastService.createNewBlast(meta.storedPacketDate);
					await dataService.turnOffCBBComms();
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

DataService.prototype.turnOffCBBComms = function($happn) {
	const { nodeRepository, dataService, nodeTreeUtils } = $happn.exchange;

	const turnoffAsync = async () => {
		let result = [];
		let boosters = await nodeRepository.getNodeType(3);

		let switchedOff = boosters.map(x => {
			return { ...x, data: { ...x.data, communicationStatus: 0 } };
		});

		for (let i = 0; i < boosters.length; i++) {
			const next = switchedOff[i];
			const previous = boosters[i];
			let remap = await nodeTreeUtils.updateNode(next, previous);
			result.push(remap);
		}

		let context = { updateNodes: result };
		await this.__updateExistingNodes($happn, context);
	};

	return turnoffAsync();
};

DataService.prototype.checkCBBKeyOff = function($happn, arr, branch) {
	const arrParentData = arr[0].data;

	const checkAsync = async () => {
		if (!branch || branch.length < 1) return arr;
		const branchParentData = branch[0].data;

		//precondition for the key-off on a cbb
		let result = [...arr];
		if (arrParentData.typeId === 3 && arr.length < 2) {
			if (
				arrParentData.keySwitchStatus === 0 &&
				branchParentData.keySwitchStatus !== arrParentData.keySwitchStatus
			) {
				const edds = branch.slice(1);

				for (let i = 0; i < edds.length; i++) {
					const clone = JSON.parse(JSON.stringify(edds[i]));
					clone.data.detonatorStatus = 0;
					await result.push(clone);
				}
			}
		}
		return result;
	};
	return checkAsync();
};
/***
 * @summary Handle the node inserts from the CONTEXT.NEWNODES
 * @param $happn
 * @param nodeArr - node array containing 1 cbb and 1 edd
 */
DataService.prototype.clearEddSignal = function($happn, nodeArr) {
	const { nodeRepository, archiveRepository } = $happn.exchange;
	const { emit } = $happn;
	const parent = nodeArr[0];

	let clearEddsAsync = async () => {
		if (nodeArr.length < 2 || parent.data.typeId !== 3) {
			return nodeArr;
		}

		//clear EDDs when typeId is 4, and UID is 255.255.255.255
		let clearSignal = nodeArr.find(
			node => node.data.typeId === 4 && node.data.serial === 4294967295
		);

		if (!clearSignal) return nodeArr;

		let parentPath = `${parent.data.typeId}/${parent.data.serial}`;
		parent.data.childCount = 0;
		parent.data.loadCount = null;

		const cutData = await nodeRepository.cutPath(parentPath);
		const cutMapped = cutData.map(x => {
			delete x._meta;
			return x;
		});

		const archive = {
			date: parent.meta.storedPacketDate,
			path: parentPath,
			data: cutMapped
		};

		emit("EDDSIG", parentPath);

		await archiveRepository.insertArchives(archive);

		return nodeArr.slice(0, 1);
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

				//$happn.emit("node/added", nodeClone);

				this.emitQueue.push({
					id: nodeClone.parentSerial || 0,
					path: "node/added",
					value: [nodeClone]
				});
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
	const { emit } = $happn;

	let updateExistingAsync = async () => {
		for (const node of context.updateNodes) {
			const { data, meta } = node;
			try {
				if (data.serial != null && meta.dirty) {
					node.data.modified = node.meta.storedPacketDate;
					if (node.data.path === null || node.data.path === "") {
						await node.setPath();
					}

					let changedObject = {
						serial: data.serial,
						typeId: data.typeId,
						path: data.path,
						modified: meta.storedPacketDate,
						changes: meta.dirty
					};

					let nodeClone = { ...node.data };
					this.emitQueue.push({
						id: nodeClone.parentSerial || 0,
						path: "nodes/updated",
						value: [changedObject]
					});

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

module.exports = DataService;
