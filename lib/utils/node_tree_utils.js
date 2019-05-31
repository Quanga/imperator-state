const uuidv1 = require("uuid/v1");

function NodeTreeUtils() {}

/**
 * @summary Async function that determines which incoming nodes are new and which already exist,
 *  and hence should be updated. Also determines nodes missing from the incoming packet.
 * @param $happn
 * @param context
 * @param nodeArr
 */
NodeTreeUtils.prototype.extractUpdates = function($happn, context) {
	const { dataMapper } = $happn.exchange;
	const { error: logError } = $happn.log;

	let extractUpdatesAsync = async () => {
		let { branch, newNodes, nodeArr, updateNodes, missingNodes } = context;

		try {
			for (let pos = 0; pos < nodeArr.length; pos++) {
				const { data: nodeData } = nodeArr[pos];

				if (!nodeData.serial) {
					nodeData.serial = await this.setSerialByPosition(context, pos);
				}

				if (nodeData.serial === undefined) {
					nodeData.serial = uuidv1();
				}

				// Check if the node exists in the context
				let nodeToUpdate = branch.find(
					item =>
						nodeData.typeId === item.data.typeId &&
						nodeData.serial === item.data.serial
				);

				if (nodeToUpdate) {
					nodeToUpdate.meta.status = "matched"; // UPDATED NODES

					//edge case for loading dets in 04 command
					if (pos === 0 && nodeArr[0].data.typeId === 3 && nodeArr.length > 1) {
						if (nodeArr[0].data.loadCount !== null) {
							nodeArr[0].data.loadCount += nodeToUpdate.data.loadCount;
						} else {
							nodeArr[0].data.loadCount = nodeToUpdate.data.loadCount;
						}
					}
					console.log("LOADCOUNT------", nodeArr);

					let mappedNode = await dataMapper.mapUpdateNode(
						nodeArr[pos],
						nodeToUpdate
					);

					await updateNodes.push(mappedNode);
				} else {
					await newNodes.push(nodeArr[pos]); // NEW NODES
				}
			}

			for (const node of branch) {
				const { data: nodeData, meta: nodeMeta } = node; // MISSING NODES
				if (
					!nodeMeta.status &&
					nodeData.typeId !== 4 &&
					nodeData.typeId !== 3
				) {
					//add the stored date from when the missing node was found
					nodeMeta.storedPacketDate = nodeArr[0].meta.storedPacketDate;
					missingNodes.push(node);
				} else {
					delete nodeMeta.status;
				}
			}

			return context;
		} catch (err) {
			logError(`Extract trees error -- ${err}`);
		}
	};

	return extractUpdatesAsync();
};

NodeTreeUtils.prototype.findParent = function(branch, childTypeId) {
	if (childTypeId === 3) {
		return branch.find(item => item.data.typeId === 0);
	}
	return branch.find(item => item.data.typeId === childTypeId - 1);
};

NodeTreeUtils.prototype.setSerialByPosition = function(context, pos) {
	const { branch, nodeArr } = context;
	const { data: nodeData } = nodeArr[pos];

	const setSerialAsync = async () => {
		try {
			if (nodeData.typeId === 2) {
				// if (branch[0].data.windowId === len - 1) {
				// 	let ib651 = branch.find(
				// 		c => c.data.typeId === 2 && c.data.windowId === pos
				// 	);
				// 	if (ib651) {
				// 		return ib651.data.serial;
				// 	}
				// }
			} else {
				for (let x = 1; x < branch.length; x++) {
					if (branch[x].data.windowId === nodeData.windowId) {
						return branch[x].data.serial;
					}
				}
			}
		} catch (err) {
			console.log.error("set by serial error", err);
		}
	};
	return setSerialAsync();
};

module.exports = NodeTreeUtils;
