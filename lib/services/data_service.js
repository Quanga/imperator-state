var async = require('async');

function DataService() {
	const NodeTreeUtils = require('../utils/node_tree_utils');
	this.__nodeTreeHelper = new NodeTreeUtils();
}

DataService.prototype.insertPacketArr = function ($happn, packetArr, callback) {
	console.log('Inserting packet------------------------', packetArr);
	const packetRepository = $happn.exchange.packetRepository;
	const dataMapper = $happn.exchange.dataMapper;

	packetArr.forEach(x => {
		dataMapper.mapInsertPacket(x)
			.then((packet) => {
				
				packetRepository.insertPacketArr(packet);
				//
			})
			.then(()=>{
				callback();
			})
			.catch((err) => {
				$happn.log.error('insertPacketArr update error', err);
				callback(err);
			});
	});

	//callback();
};

/***
 * @summary A function that performs an insert or update for each node in a set of incoming nodes, depending
 *  on whether or not a particular node already exists.
 * @param $happn
 * @param nodeArr - parsed node data that has been received from the IBC
 * @param callback
 */
DataService.prototype.upsertNodeDataArr = function ($happn, nodeArr, callback) {

	const self = this;
	const nodeRepository = $happn.exchange.nodeRepository;
	const config = $happn.config;

	// build the full tree from storage as flat array
	self.__buildTree($happn, nodeRepository)
		.then(function (fullTree) {

			// the subtree is a subset of existing tree, starting from the incoming parent node
			let subTree = [];

			// filter the full tree based on the incoming parent node
			if (fullTree.length > 0)
				subTree = self.__nodeTreeHelper.findSubTree(fullTree, nodeArr[0].serial, nodeArr[0].type_id);

			async.waterfall([
				function (cb) {

					// create a context object to manage states
					var context = {
						updateNodes: [],
						newNodes: [],
						missingNodes: [],
						fullTree: fullTree,
						subTree: subTree,
						parentSerial: nodeArr[0].serial,
						parentType: nodeArr[0].type_id,
						updateParent: null
					};

					cb(null, context);
				},
				function (context, cb) {

					//$happn.log.info('UPSERT STEP 0: BUILDING NEW, UPDATED AND MISSING NODES...');

					self.__nodeTreeHelper.extractNewAndUpdatedNodes($happn, context, nodeArr, function (err, extracted) {

						if (err)
							return cb(err);

						//$happn.log.info('### NEW AND UPDATED: ', extracted);

						context.newNodes = extracted.newNodes;
						context.updateNodes = extracted.updateNodes;
						context.missingNodes = extracted.missingNodes;

						cb(null, context);
					});
				},
				function (context, cb) {

					//$happn.log.info('UPSERT STEP 1: REORDERING WINDOW IDS');

					/**
                         * shuffle the window id's for those IB651's that already exist in the DB, but
                         * have a different ordering
                         **/

					self.__reshuffleWindowIds(nodeArr, context.updateNodes);

					cb(null, context);
				},
				function (context, cb) {

					//$happn.log.info('UPSERT STEP 2 - UPDATE EXISTING NODES...');

					if (context.updateNodes.length == 0)
						cb(null, context);
					else {

						self.__updateExistingNodes($happn, config, context, nodeRepository)
							.then(function (context) {
								cb(null, context);
							})
							.catch(function (err) {
								cb(err);
							});
					}
				},
				function (context, cb) {

					//$happn.log.info('UPSERT STEP 3 - INSERT NEW NODES...');

					if (context.newNodes.length == 0)
						cb(null, context);
					else {
						self.__insertNewNodes($happn, config, context, nodeRepository)
							.then(function (context) {
								cb(null, context);
							})
							.catch(function (err) {
								cb(err);
							});
					}
				},
				function (context, cb) {

					//$happn.log.info('UPSERT STEP 4 - UPDATE MISSING NODES...');

					if (context.missingNodes.length == 0)
						cb(null, context);
					else {
						self.__updateMissingNodes($happn, config, context, nodeRepository)
							.then(function () {
								cb(null, context);
							})
							.catch(function (err) {
								cb(err);
							});
					}
				}
			],
			function (err) {
				if (err) {
					$happn.log.error('upsertNodeDataArr error', err);
					return callback(err);
				}
				callback();
			});
		});
};

DataService.prototype.getIbcSerials = function ($happn, callback) {
	var nodeRepository = $happn.exchange.nodeRepository;

	nodeRepository.getIbcSerials()
		.then(function (result) {
			callback(null, result);
		})
		.catch(function (err) {
			$happn.log.error('getIbcSerials error', err);
			callback(err);
		});
};

DataService.prototype.getIscSerials = function ($happn, callback) {
	var nodeRepository = $happn.exchange.nodeRepository;

	nodeRepository.getIscSerials()
		.then(function (result) {
			callback(null, result);
		})
		.catch(function (err) {
			$happn.log.error('getIscSerials error', err);
			callback(err);
		});
};

/*
 This function builds a flat array of node objects, each with the full happn_path (tree position)
 */
DataService.prototype.__buildTree = function ($happn, nodeRepository) {

	return new Promise(function (resolve, reject) {

		nodeRepository.findNodes()
			.then(function (allNodes) {

				var ibc = allNodes.find(item => {
					return item.type_id == 0;
				});

				var iscs = allNodes.filter(item => {
					return item.type_id == 1;
				});

				var ib651s = allNodes.filter(item => {
					return item.type_id == 2;
				});

				var ibcPath = '/0/';
				var currentPath = '';

				if (ibc != null) {
					ibcPath = ibcPath + ibc.serial;
					ibc.happn_path = ibcPath;
				} else
					ibcPath = ibcPath + '*';

				if (iscs.length > 0) {
					iscs.forEach(isc => {
						currentPath = ibcPath + '/1/' + isc.serial;
						isc.happn_path = currentPath;

						ib651s.filter(ib651 => {
							return ib651.parent_id == isc.id;
						}).forEach(ib651 => {
							ib651.happn_path = currentPath + '/2/' + ib651.serial;
						});
					});
				} else if (ib651s.length > 0) {
					currentPath = ibcPath + '/1/*';

					ib651s.forEach(ib651 => {
						ib651.happn_path = currentPath + '/2/' + ib651.serial;
					});
				}

				resolve(allNodes);
			})
			.catch(function (err) {
				reject(err);
			});
	});
};

DataService.prototype.__insertNewNodes = function ($happn, config, context, nodeRepository) {

	var self = this;

	// insertion of nodes will only ever involve one or a maximum of 2 levels, eg:
	// one IBC
	// one IBC & multiple ISCs
	// one or more ISCs - in this case a tree must already exist (with a minimum of 1 IBC in it)
	// one ISC and multiple IB651s - in this case a tree must already exist (with a minimum of 1 IBC in it)
	// one or more IB651s - in this case a tree must already exist (with a minimum of 1 IBC in it)

	return new Promise(function (resolve, reject) {

		var parentId = null;

		async.eachSeries(context.newNodes, function (x, cb) {

			if (x.serial != null && context.subTree.length > 0) {
				// if a tree was found then the parent_id can be derived
				self.__setParentId(x, context.subTree);
			} else {
				// no tree is found which means that this must be a new node/set of nodes
				// just grab the nodeId of the previous insert which should be the parent.

				x.parent_id = parentId;
			}

			self.__insertNode($happn, config, nodeRepository, x)
				.then(function (nodeId) {

					if (parentId == null)
						parentId = nodeId;

					cb();
				})
				.catch(function (err) {
					throw (err);
				});

		}, function (err) {

			if (err)
				return reject(err);

			resolve(context);
		});
	});
};

DataService.prototype.__insertNode = function ($happn, config, repository, node) {

	var self = this;

	return new Promise(function (resolve, reject) {

		if (node.serial != null &&
            node.type_id > process.env.DISALLOWED_INSERTS && // eg: DISALLOWED_INSERTS=0 disallows all IBC inserts (IBC has type_id=0)
            node.serial < process.env.MAX_SERIAL && //ensures no null nodes are inserted as a result of duplicate widows.
            (!config.disableIb651Inserts || (node.type_id != 2 || node.serial >= 100))) {

			var clone = JSON.parse(JSON.stringify(node));

			repository.insertNodeData(clone, function (err, nodeId) {
				if (err)
					return reject(err);

				delete clone.id;

				// do edge insert
				self.__edgeUpsert($happn, config, clone)
					.then(function () {
						resolve(nodeId);
					})
					.catch(function (err) {
						reject(err);
					});
			});
		} else
			resolve();
	});
};

DataService.prototype.__updateExistingNodes = function ($happn, config, context, nodeRepository) {

	var self = this;

	return new Promise(function (resolve, reject) {

		async.eachSeries(context.updateNodes, function (x, cb) {

			if (x.serial != null) {

				//console.log('UPDATING NODE >>>> : ', x);

				self.__updateNode($happn, config, nodeRepository, x)
					.then(function () {
						return cb();
					})
					.catch(function (err) {
						cb(err);
					});
			} else
				cb();

		}, function (err) {

			if (err)
				return reject(err);

			resolve(context);
		});
	});
};

DataService.prototype.__updateMissingNodes = function ($happn, config, context, nodeRepository) {

	var self = this;

	return new Promise(function (resolve, reject) {

		async.eachSeries(context.missingNodes, function (x, cb) {

			//change the communication_status to 0 for all missing nodes
			if (x.type_id == 2) {
				x.communication_status = 0;
			}

			//also change the window_id to 0 so the node will be excluded from data mapping
			if (x.type_id != 4) {
				x.window_id = 0;
			}

			self.__updateNode($happn, config, nodeRepository, x)
				.then(function () {
					return cb();
				})
				.catch(function (err) {
					return cb(err);
				});

		}, function (err) {

			if (err)
				return reject(err);

			resolve(context);
		});
	});
};

DataService.prototype.__updateNode = function ($happn, config, repository, node) {

	var self = this;

	return new Promise(function (resolve, reject) {

		var clone = JSON.parse(JSON.stringify(node));

		//delete clone.children;

		repository.updateNodeData(clone, function (err) {

			if (err)
				return reject(err);

			delete clone.id;

			self.__edgeUpsert($happn, config, clone)
				.then(function (result) {
					resolve(result);
				})
				.catch(function (err) {
					reject(err);
				});
		});
	});
};

DataService.prototype.__edgeUpsert = function ($happn, config, node) {

	return new Promise(function (resolve, reject) {

		// do edge insert
		if (config.replicationEnabled) {

			//$happn.log.info('EDGE UPSERT: ' + JSON.stringify(node));

			$happn.exchange.remoteGateway.upsert(node)
				.then(function () {
					$happn.log.info('edge upsert success...');
					resolve();
				})
				.catch(function (err) {
					$happn.log.info('edge upsert error:' + err);
					reject(err);
				});
		} else
			resolve();
	});
};

/***
 * @summary If the ordering of a set of IB651s change in a ping request, this reshuffles previously saved IB651 window ids
 * @param nodeArr
 * @param updateNodes
 * @private
 */
DataService.prototype.__reshuffleWindowIds = function (nodeArr, updateNodes) {

	// the incoming nodeArr has already had window id's added to IB651 nodes in PacketUtils.createPacketResult
	nodeArr.forEach(x => {
		updateNodes.forEach(y => {
			// TODO: check this - in a situation where the serial of the incoming node is not known?
			if ((x.type_id == y.type_id) && (parseInt(x.serial) == parseInt(y.serial))) {
				//console.log('INCOMING WINDOW ID: ', x.window_id);
				//console.log('UPDATE NODE WINDOW ID: ', y.window_id);

				y.window_id = x.window_id;
			}

			//if ((x.type_id == y.type_id) && (x.window_id != null))

		});
	});
};

/***
 * @summary Modifies a specific node's parent_id, coordinates and window_id by reference.
 * @param currentNode
 * @param subTree
 * @private
 */
DataService.prototype.__setParentId = function (currentNode, subTree) {

	var parent = this.__nodeTreeHelper.findParent(subTree, currentNode.type_id);
	var parentId = null;

	if (parent != null)
		parentId = parent.id;

	//console.log('FOUND PARENT ID: ', parentId);

	switch (currentNode.type_id) {
	case 1: // ISC
		currentNode.parent_id = parentId;
		currentNode.window_id = 0;
		break;
	case 2: // IB651
		currentNode.parent_id = parentId;
		break;
	case 3: //ABB
		currentNode.parent_id = parentId;
		break;
	case 4: //UID
		currentNode.parent_id = parentId;
		break;
	default:
	}
};

module.exports = DataService;