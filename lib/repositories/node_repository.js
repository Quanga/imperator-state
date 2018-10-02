/**
 * Created by grant on 2016/08/06.
 */

function NodeRepository() {}

NodeRepository.prototype.initialise = function($happn) {
	var DbConnectionService = require("../services/db_connection_service");
	$happn.log.info("NodeRepository Initialize.................");

	var config = $happn.config;
	return new Promise((resolve, reject) => {
		try {
			this.__dbConnectionService = new DbConnectionService();
			this.__dbConnectionService.initialise($happn, config);
			$happn.log.info("NodeRepository Initialize................PASS.");
			resolve();
		} catch (err) {
			$happn.log.error("NodeRepository Initialize.................FAIL");
			reject(err);
		}
	});
};

NodeRepository.prototype.getNodeData = function($happn) {
	var self = this;
	//$happn.log.info("getting node Tree data");

	async function getNode() {
		let connection;
		try {
			let connection = await self.__getConnection($happn);
			var query = "SELECT DISTINCT * FROM nodes";

			let results = await connection.query({ sql: query });
			connection.release();
			return results;
		} catch (err) {
			$happn.log.error("findNodeTreeData error", err);
			connection.release();
		}
	}
	return getNode();
};

NodeRepository.prototype.findNodeTreeData = function($happn, serial, typeId) {
	var self = this;

	//$happn.log.info("getting node Tree data");
	async function findNodeTree() {
		let connection = await self.__getConnection($happn);

		let query =
			"SELECT DISTINCT * FROM nodes p " +
			"LEFT OUTER JOIN nodes c ON " +
			"p.id = c.parent_id " +
			"LEFT OUTER JOIN nodes g ON " +
			"c.id = g.parent_id " +
			"WHERE p.serial = ? " +
			"AND p.type_id = ? " +
			"ORDER BY c.id, g.id ASC";

		try {
			let results = await connection.query({ sql: query, nestTables: "." }, [
				serial,
				typeId
			]);

			return results;
		} catch (err) {
			$happn.log.error("Query error", err);
		}
		$happn.log.info("got node data");
	}
	return findNodeTree();
};

NodeRepository.prototype.findNodes = function($happn) {
	var self = this;
	//$happn.log.info("getting node data");

	async function getAll() {
		let connection;

		try {
			let connection = await self.__getConnection($happn);
			var query = "SELECT * FROM nodes";
			let results = await connection.query({ sql: query });
			connection.release();
			return JSON.parse(JSON.stringify(results));
		} catch (err) {
			$happn.log.error("findNodes error", err);
			connection.release();
		}
	}
	return getAll();
};

NodeRepository.prototype.getCompleteNodeTreeData = function($happn) {
	var self = this;

	async function getTree() {
		let connection;
		try {
			connection = await self.__getConnection($happn);

			// get the complete tree using the IBC as the root
			let query =
				"SELECT DISTINCT * FROM nodes p " +
				"LEFT OUTER JOIN nodes c ON " +
				"p.id = c.parent_id " +
				"LEFT OUTER JOIN nodes g ON " +
				"c.id = g.parent_id " +
				"WHERE p.type_id = 0 " +
				"ORDER BY p.id, c.id, g.id ASC";

			let results = await connection.query({ sql: query, nestTables: "." });
			connection.release();
			return results;
		} catch (err) {
			$happn.log.error("getCompleteNodeTree error", err);
			connection.release();
		}
	}

	return getTree();
};

NodeRepository.prototype.insertLogData = function($happn, logs, callback) {
	var self = this;

	self.__getConnection($happn, function(err, connection) {
		if (err) return callback(err);

		connection.query("INSERT INTO logs SET ?,created=NOW()", logs, function(
			err,
			result
		) {
			//console.log('::: inserting into logs table... ');

			if (err) {
				$happn.log.error("insertNodeData error", err);
				connection.release();
				return callback(err);
			} else {
				//console.log('::: record inserted | id: ' + result.insertId);
				connection.release();
				callback(null, result.insertId);
			}
		});
	});
};

NodeRepository.prototype.getLogData = function($happn, nodeSerial, callback) {
	var self = this;

	self.__getConnection($happn, function(err, connection) {
		if (err) return callback(err);

		var query =
			"SELECT * FROM logs " +
			"WHERE node_serial = ? " +
			"ORDER BY created DESC " +
			"LIMIT 1";

		connection.query({ sql: query }, [nodeSerial], function(err, results) {
			if (err) {
				$happn.log.error("getLogData error", err);
				connection.release();
				return callback(err);
			} else {
				connection.release();
				callback(null, results);
			}
		});
	});
};

// this requires explicit release of connection by consuming module
NodeRepository.prototype.insertNodeData = function($happn, parsedPacket) {
	var self = this;

	//let prom = util.promisify(util.format);
	//$happn.log.info("inserting nodeDate ------------->>>>>>", parsedPacket);

	async function insertNode() {
		let connection;
		try {
			let connection = await self.__getConnection($happn);
			const util = require("util");

			var query = util.format(
				//var query = await prom(
				"INSERT INTO nodes SET " +
					"serial = %s, " +
					"type_id = %s, " +
					"key_switch_status = %s," +
					"communication_status = %s, " +
					"temperature = %s, " +
					"blast_armed = %s, " +
					"fire_button = %s, " +
					"isolation_relay = %s, " +
					"shaft_fault = %s, " +
					"cable_fault = %s," +
					"earth_leakage = %s, " +
					"detonator_status =%s," +
					"partial_blast_lfs = %s, " +
					"full_blast_lfs = %s," +
					"booster_fired_lfs = %s, " +
					"missing_pulse_detected_lfs = %s," +
					"AC_supply_voltage_lfs = %s, " +
					"DC_supply_voltage = %s," +
					"DC_supply_voltage_status = %s, " +
					"mains = %s," +
					"low_bat = %s," +
					"too_low_bat = %s," +
					"delay = %s," +
					"program = %s," +
					"calibration = %s," +
					"det_fired = %s," +
					"tagged = %s," +
					"energy_storing = %s," +
					"bridge_wire = %s," +
					"parent_id = %s, " +
					"window_id = %s, " +
					"x = %s, " +
					"y = %s ",
				parsedPacket.serial,
				parsedPacket.type_id,
				parsedPacket.key_switch_status,
				parsedPacket.communication_status,
				parsedPacket.temperature,
				parsedPacket.blast_armed,
				parsedPacket.fire_button,
				parsedPacket.isolation_relay,
				parsedPacket.shaft_fault,
				parsedPacket.cable_fault,
				parsedPacket.earth_leakage,
				parsedPacket.detonator_status,
				parsedPacket.partial_blast_lfs,
				parsedPacket.full_blast_lfs,
				parsedPacket.booster_fired_lfs,
				parsedPacket.missing_pulse_detected_lfs,
				parsedPacket.AC_supply_voltage_lfs,
				parsedPacket.DC_supply_voltage,
				parsedPacket.DC_supply_voltage_status,
				parsedPacket.mains,
				parsedPacket.low_bat,
				parsedPacket.too_low_bat,
				parsedPacket.delay,
				parsedPacket.program,
				parsedPacket.calibration,
				parsedPacket.det_fired,
				parsedPacket.tagged,
				parsedPacket.energy_storing,
				parsedPacket.bridge_wire,
				parsedPacket.parent_id,
				parsedPacket.window_id,
				parsedPacket.x,
				parsedPacket.y
			);

			let result = await connection.query(query);
			//$happn.log.info("record inserted | id: " + result.insertId);
			connection.release();
			return result.insertId;
		} catch (err) {
			$happn.log.error("insertNodeData error", err);
			connection.release();
		}
	}

	return insertNode();
};

// this requires explicit closing of connection by consuming module
NodeRepository.prototype.updateNodeData = function($happn, nodeItem) {
	//$happn.log.info("updating nodeDate ------------->>>>>>", nodeItem);
	var self = this;
	//const sqlf = util.promisify(util.format);

	async function updateNode() {
		let connection;
		try {
			let connection = await self.__getConnection($happn);
			const util = require("util");

			let query = util.format(
				//let query = await sqlf(
				"UPDATE nodes SET " +
					"type_id = %s, " +
					"key_switch_status = %s," +
					"communication_status = %s, " +
					"temperature = %s, " +
					"blast_armed = %s, " +
					"fire_button = %s, " +
					"isolation_relay = %s, " +
					"shaft_fault = %s, " +
					"cable_fault = %s," +
					"earth_leakage = %s, " +
					"detonator_status =%s," +
					"partial_blast_lfs = %s, " +
					"full_blast_lfs = %s," +
					"booster_fired_lfs = %s, " +
					"missing_pulse_detected_lfs = %s," +
					"AC_supply_voltage_lfs = %s, " +
					"DC_supply_voltage = %s," +
					"DC_supply_voltage_status = %s, " +
					"mains = %s," +
					"low_bat = %s," +
					"too_low_bat = %s," +
					"delay = %s," +
					"program = %s," +
					"calibration = %s," +
					"det_fired = %s," +
					"tagged = %s," +
					"energy_storing = %s," +
					"bridge_wire = %s," +
					"parent_id = %s, " +
					"tree_parent_id = %s, " +
					"window_id = %s " +
					"WHERE id = %s",
				nodeItem.type_id,
				nodeItem.key_switch_status,
				nodeItem.communication_status,
				nodeItem.temperature,
				nodeItem.blast_armed,
				nodeItem.fire_button,
				nodeItem.isolation_relay,
				nodeItem.shaft_fault,
				nodeItem.cable_fault,
				nodeItem.earth_leakage,
				nodeItem.detonator_status,
				nodeItem.partial_blast_lfs,
				nodeItem.full_blast_lfs,
				nodeItem.booster_fired_lfs,
				nodeItem.missing_pulse_detected_lfs,
				nodeItem.AC_supply_voltage_lfs,
				nodeItem.DC_supply_voltage,
				nodeItem.DC_supply_voltage_status,
				nodeItem.mains,
				nodeItem.low_bat,
				nodeItem.too_low_bat,
				nodeItem.delay,
				nodeItem.program,
				nodeItem.calibration,
				nodeItem.det_fired,
				nodeItem.tagged,
				nodeItem.energy_storing,
				nodeItem.bridge_wire,
				nodeItem.parent_id,
				nodeItem.tree_parent_id,
				nodeItem.window_id,
				nodeItem.id
			);
			//$happn.log.info("Query ----", query);

			let result = await connection.query(query);

			// $happn.log.info(
			// 	"----------------------------------------record updated...",
			// 	query
			// );
			//clear fired flag when type_id is 0, and fire button is pressed
			// if (nodeItem.type_id == 0 && nodeItem.fire_button == 1) {
			// 	$happn.log.info("clearing fire flags...");
			// 	var fireFlagQuery = util.format(
			// 		"UPDATE nodes SET booster_fired_lfs = 0 WHERE type_id = 2"
			// 	);
			// 	await connection.query(fireFlagQuery, function(err, fireFlagResult) {});
			// 	var connectedDetLfsQuery = util.format(
			// 		'UPDATE nodes SET detonator_lfs = "Not fired" WHERE type_id=2 AND detonator_status=1'
			// 	);
			// 	await connection.query(connectedDetLfsQuery, function(
			// 		err,
			// 		connectedDetLfsResult
			// 	) {});
			// 	var notConnectedDetLfsQuery = util.format(
			// 		'UPDATE nodes SET detonator_lfs = "No detonator" WHERE type_id=2 AND detonator_status=0'
			// 	);
			// 	await connection.query(notConnectedDetLfsQuery, function(
			// 		err,
			// 		notconnectedDetLfsResult
			// 	) {});
			// }
			await connection.release();
			return result;
		} catch (err) {
			$happn.log.error("updateNodeData error", err);
			connection.release();
		}
	}
	return updateNode();
};

NodeRepository.prototype.deleteNodeData = function($happn) {
	var self = this;
	async function deleteNodes() {
		let connection;
		try {
			let connection = await self.__getConnection($happn);
			let result = await connection.query("DELETE FROM nodes");
			$happn.log.info("records deleted...");
			connection.release();
			return result;
		} catch (err) {
			$happn.log.error("deleteNodeData error", err);
			connection.release();
		}
	}
	return deleteNodes();
};

NodeRepository.prototype.getIbcSerials = function($happn) {
	var self = this;

	async function getIBC() {
		let connection;
		try {
			let connection = await self.__getConnection($happn);
			let results = await connection.query(
				"SELECT DISTINCT serial FROM nodes WHERE type_id = 0"
			);
			connection.release();
			return results;
		} catch (err) {
			$happn.log.error("getIbcSerials error", err);
			connection.release();
		}
	}
	return getIBC();
};

NodeRepository.prototype.getIscSerials = function($happn) {
	var self = this;

	async function getISC() {
		let connection;
		try {
			let connection = await self.__getConnection($happn);
			let results = await connection.query(
				"SELECT DISTINCT serial FROM nodes WHERE type_id = 1"
			);
			connection.release();
			return results;
		} catch (err) {
			$happn.log.error("getIscSerials error", err);
			connection.release();
		}
	}
	return getISC();
};

NodeRepository.prototype.__getConnection = function($happn) {
	var self = this;

	return new Promise((resolve, reject) => {
		self.__dbConnectionService
			.getConnection($happn)
			.then(connection => {
				resolve(connection);
			})
			.catch(err => {
				$happn.log.error("get connection error: " + err);
				reject(err);
			});
	});
};

module.exports = NodeRepository;
