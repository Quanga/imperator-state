/* eslint-disable no-unused-vars */
const moment = require("moment");

function NodeRepository() {}

NodeRepository.prototype.getLastPacketTime = function($happn) {
	const { nodeRepository } = $happn.exchange;
	const { log } = $happn;

	return (async () => {
		try {
			let persistedNodes = await nodeRepository.get("*");

			if (!persistedNodes || persistedNodes.length === 0) return 0;

			const modifiedList = persistedNodes.map(d => {
				if (d.data.modifiedAt) {
					return d.data.modifiedAt;
				} else {
					return 0;
				}
			});

			const latest = Math.max(...modifiedList);
			log.info(
				`lastPacket time found - ${latest} - ${moment(latest).format("DD-MM-YYYY HH:mm:ss.SSS")}`,
			);
			return latest;
		} catch (err) {
			log.error("Error getting last packet", err);
		}
	})();
};

NodeRepository.prototype.get = function($happn, path) {
	const { data } = $happn.exchange;
	const { error: logError } = $happn.log;

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

/***
 * @summary Async function that inserts the node data to a path from the nodeObject
 * @param $happn
 * @param nodeObj
 */
NodeRepository.prototype.insertNodeData = function($happn, nodeObj) {
	const { log } = $happn;
	const { data } = $happn.exchange;

	return new Promise((resolve, reject) => {
		if (!nodeObj.data.path) return reject("No Path suppied in object");

		const { path } = nodeObj.data;
		if (path === "") {
			return reject("Cannot write node to path - path empty", nodeObj);
		}

		data.set(`persist/nodes/${path}`, nodeObj, {}, (error, response) => {
			if (error) return reject(error);

			return resolve(response);
		});
	});
};

/***
 * @summary Async function that return all the node data from the nodeObject
 * @param $happn
 * @param nodeObj
 */
NodeRepository.prototype.cutPath = function($happn, parentPath) {
	const { data } = $happn.exchange;

	return new Promise((resolve, reject) => {
		data.remove(`persist/nodes/${parentPath}/*`, null, (error, result) => {
			if (error) return reject(error);

			return resolve(result);
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
	const { log } = $happn;

	return new Promise((resolve, reject) => {
		data.remove(`persist/nodes/${path}`, null, (error, result) => {
			if (error) return reject(error);

			log.info("All Nodes successfully removed");
			return resolve(result);
		});
	});
};

module.exports = NodeRepository;
