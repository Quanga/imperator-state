/**
 * Created by grant on 2016/08/06.
 */

function NodeRepository() {}

NodeRepository.prototype.initialise = function($happn) {
	let DbConnectionService = require("../services/db_connection_service");
	$happn.log.info("NodeRepository Initialize.................");
	let config = $happn.config;

	let init = async () => {
		try {
			this.__dbConnectionService = new DbConnectionService();
			this.__dbConnectionService.initialise($happn, config);
			$happn.log.info("NodeRepository Initialize.................PASS");
		} catch (err) {
			$happn.log.error("NodeRepository Initialize.................FAIL");
		}
	};
	return init();
};

NodeRepository.prototype.getNodeData = function($happn) {
	const { error } = $happn.log;

	const getNode = async () => {
		let connection;
		try {
			connection = await this.__getConnection($happn);
			let results = await connection.query("SELECT DISTINCT * FROM nodes");
			connection.release();

			return results;
		} catch (err) {
			error("Get NodeData error", err);
			connection.release();
		}
	};
	return getNode();
};

NodeRepository.prototype.getAllNodes = function($happn) {
	const { error } = $happn.log;
	let clone = require("clone");
	let getAll = async () => {
		let connection;

		try {
			connection = await this.__getConnection($happn);
			let results = await connection.query("SELECT * FROM nodes");
			connection.release();
			//return results;
			return clone(results);
		} catch (err) {
			error("Error getting all NODES from the NODES TABLE", err);
			connection.release();
		}
	};

	return getAll();
};

// this requires explicit release of connection by consuming module
NodeRepository.prototype.insertNodeData = function($happn, parsedPacket) {
	let insertNode = async () => {
		//console.log("Inserting New node in db");
		let connection;
		try {
			let connection = await this.__getConnection($happn);

			let query = `INSERT INTO nodes 
			SET serial = ${parsedPacket.serial},
			type_id = ${parsedPacket.type_id},
			key_switch_status = ${parsedPacket.key_switch_status},
			communication_status = ${parsedPacket.communication_status},
			temperature = ${parsedPacket.temperature},
			blast_armed = ${parsedPacket.blast_armed},
			fire_button = ${parsedPacket.fire_button},
			isolation_relay = ${parsedPacket.isolation_relay},
			shaft_fault = ${parsedPacket.shaft_fault},
			cable_fault = ${parsedPacket.cable_fault},
			earth_leakage = ${parsedPacket.earth_leakage},
			detonator_status = ${parsedPacket.detonator_status},
			partial_blast_lfs = ${parsedPacket.partial_blast_lfs},
			full_blast_lfs = ${parsedPacket.full_blast_lfs},
			booster_fired_lfs = ${parsedPacket.booster_fired_lfs},
			missing_pulse_detected_lfs = ${parsedPacket.missing_pulse_detected_lfs},
			AC_supply_voltage_lfs = ${parsedPacket.AC_supply_voltage_lfs},
			DC_supply_voltage = ${parsedPacket.DC_supply_voltage},
			DC_supply_voltage_status = ${parsedPacket.DC_supply_voltage_status},
			mains = ${parsedPacket.mains},
			low_bat = ${parsedPacket.low_bat},
			too_low_bat = ${parsedPacket.too_low_bat},
			delay = ${parsedPacket.delay},
			program = ${parsedPacket.program},
			calibration = ${parsedPacket.calibration},
			det_fired = ${parsedPacket.det_fired},
			tagged = ${parsedPacket.tagged},
			energy_storing = ${parsedPacket.energy_storing},
			bridge_wire = ${parsedPacket.bridge_wire},
			parent_id = ${parsedPacket.parent_id},
			window_id = ${parsedPacket.window_id},
			x = ${parsedPacket.x},
			y = ${parsedPacket.y}`;

			let result = await connection.query(query);
			connection.release();
			return result.insertId;
		} catch (err) {
			$happn.log.error("insertNodeData error", err);
			connection.release();
		}
	};

	return insertNode();
};

// this requires explicit closing of connection by consuming module
NodeRepository.prototype.updateNodeData = function($happn, nodeItem) {
	let updateNode = async () => {
		//console.log("updating  node in db", nodeItem.serial);

		let connection;
		try {
			connection = await this.__getConnection($happn);

			let query = `UPDATE nodes SET 
			type_id = ${nodeItem.type_id}, 
			key_switch_status = ${nodeItem.key_switch_status},
			communication_status = ${nodeItem.communication_status}, 
			temperature = ${nodeItem.temperature},
			blast_armed = ${nodeItem.blast_armed}, 
			fire_button = ${nodeItem.fire_button},
			isolation_relay = ${nodeItem.isolation_relay}, 
			shaft_fault = ${nodeItem.shaft_fault},
			cable_fault = ${nodeItem.cable_fault},
			earth_leakage = ${nodeItem.earth_leakage},
			detonator_status =${nodeItem.detonator_status},
			partial_blast_lfs = ${nodeItem.partial_blast_lfs},
			full_blast_lfs = ${nodeItem.full_blast_lfs},
			booster_fired_lfs = ${nodeItem.booster_fired_lfs},
			missing_pulse_detected_lfs = ${nodeItem.missing_pulse_detected_lfs},
			AC_supply_voltage_lfs = ${nodeItem.AC_supply_voltage_lfs},
			DC_supply_voltage = ${nodeItem.DC_supply_voltage},
			DC_supply_voltage_status = ${nodeItem.DC_supply_voltage_status},
			mains = ${nodeItem.mains},
			low_bat = ${nodeItem.low_bat},
			too_low_bat = ${nodeItem.too_low_bat},
			delay = ${nodeItem.delay},
			program = ${nodeItem.program},
			calibration = ${nodeItem.calibration},
			det_fired = ${nodeItem.det_fired},
			tagged = ${nodeItem.tagged},
			energy_storing = ${nodeItem.energy_storing},
			bridge_wire = ${nodeItem.bridge_wire},
			parent_id = ${nodeItem.parent_id},
			tree_parent_id = ${nodeItem.tree_parent_id},
			window_id = ${nodeItem.window_id}
			WHERE id = ${nodeItem.id}`;

			let result = await connection.query(query);

			//clear fired flag when type_id is 0, and fire button is pressed
			if (nodeItem.type_id == 0 && nodeItem.fire_button == 1) {
				$happn.log.info("clearing fire flags...");

				// let fireFlagQuery =
				// 	"UPDATE nodes SET booster_fired_lfs = 0 WHERE type_id = 2";
				// await connection.query(fireFlagQuery);

				// let connectedDetLfsQuery =
				// 	'UPDATE nodes SET detonator_lfs = "Not fired" WHERE type_id=2 AND detonator_status=1';
				// await connection.query(connectedDetLfsQuery);

				// var notConnectedDetLfsQuery =
				// 	'UPDATE nodes SET detonator_lfs = "No detonator" WHERE type_id=2 AND detonator_status=0';
				// await connection.query(notConnectedDetLfsQuery);
			}

			//console.log("sql result  " + JSON.stringify(result, null, 2));
			connection.release();
			return result;
		} catch (err) {
			$happn.log.error("updateNodeData error", err);
			connection.release();
		}
	};
	return updateNode();
};

NodeRepository.prototype.deleteNodeData = function($happn) {
	let deleteNodes = async () => {
		let connection;
		try {
			let connection = await this.__getConnection($happn);
			let result = await connection.query("DELETE FROM nodes");
			$happn.log.info("records deleted...");
			connection.release();
			return result;
		} catch (err) {
			$happn.log.error("deleteNodeData error", err);
			connection.release();
		}
	};
	return deleteNodes();
};

NodeRepository.prototype.getIbcSerials = function($happn) {
	$happn.log("getting ibs serials");

	let getIBC = async () => {
		let connection = await this.__getConnection($happn);
		try {
			let res = await connection.query(
				"SELECT DISTINCT serial FROM nodes WHERE type_id = 0"
			);
			connection.release();

			// if (results.length > 1) {
			// 	$happn.log.error("There are more than one IBC in the repo");
			// }

			return res;
		} catch (err) {
			$happn.log.error("getIbcSerials error", err);
			connection.release();
		}
	};

	return getIBC();
};

NodeRepository.prototype.getIscSerials = function($happn) {
	let clone = require("clone");
	let getISC = async () => {
		let connection;
		try {
			connection = await this.__getConnection($happn);
			let results = await connection.query(
				"SELECT DISTINCT serial FROM nodes WHERE type_id = 1"
			);
			connection.release();
			return clone(results);
		} catch (err) {
			$happn.log.error("getIscSerials error", err);
			connection.release();
		}
	};
	return getISC();
};

NodeRepository.prototype.__getConnection = function($happn) {
	let connectAsync = async () => {
		try {
			return await this.__dbConnectionService.getConnection($happn);
		} catch (err) {
			$happn.log.error("get connection error: " + err);
		}
	};

	return connectAsync();
};

NodeRepository.prototype.getCompleteNodeTreeData = function($happn) {
	let getTree = async () => {
		let connection;
		try {
			connection = await this.__getConnection($happn);

			// get the complete tree using the IBC as the root
			let query = `SELECT DISTINCT * FROM nodes p
				LEFT OUTER JOIN nodes c ON
				p.id = c.parent_id
				LEFT OUTER JOIN nodes g ON
				c.id = g.parent_id
				WHERE p.type_id = 0
				ORDER BY p.id, c.id, g.id ASC`;

			let results = await connection.query({ sql: query, nestTables: "." });
			connection.release();
			return results;
		} catch (err) {
			$happn.log.error("getCompleteNodeTree error", err);
			connection.release();
		}
	};

	return getTree();
};

NodeRepository.prototype.findNodeTreeData = function($happn, serial, typeId) {
	let findNodeTree = async () => {
		try {
			let connection = await this.__getConnection($happn);

			let query = `SELECT DISTINCT * FROM nodes p
			LEFT OUTER JOIN nodes c ON
			p.id = c.parent_id
			LEFT OUTER JOIN nodes g ON
			c.id = g.parent_id
			WHERE p.serial = ?
			AND p.type_id = ?
			ORDER BY c.id, g.id ASC`;

			let result = await connection.query({ sql: query, nestTables: "." }, [
				serial,
				typeId
			]);

			//console.log(`from findnodetree ${JSON.stringify(result, null, 2)}`);

			return result;
		} catch (err) {
			$happn.log.error("Query error", err);
		}
	};
	return findNodeTree();
};

module.exports = NodeRepository;
