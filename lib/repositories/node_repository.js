function NodeRepository() {}

NodeRepository.prototype.initialise = function($happn) {
	let DbConnectionService = require("../services/db_connection_service");
	$happn.log.info("NodeRepository Initialize.................");
	const { config } = $happn;

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

/***
 * @summary Async function that gets all nodes from the nodes table of the datastore
 * @param $happn
 */
NodeRepository.prototype.getAllNodes = function($happn) {
	const { error } = $happn.log;

	let getAll = async () => {
		let connection;

		try {
			connection = await this.__getConnection($happn);
			let results = await connection.query("SELECT * FROM nodes");
			connection.release();
			let cloneResults = JSON.parse(JSON.stringify(results));
			return cloneResults;
		} catch (err) {
			error("Error getting all NODES from the NODES TABLE", err);
			connection.release();
		}
	};

	return getAll();
};

/***
 * @summary Async function that gets a node from the nodes table of the datastore
 * by serial and type_id
 * @param $happn
 * @param serial
 * @param type_id
 */
NodeRepository.prototype.getNode = function($happn, serial, type_id) {
	const { error: logError } = $happn.log;

	let getNodeAsync = async () => {
		let connection = await this.__getConnection($happn);

		try {
			let results = await connection.query(
				`SELECT * FROM nodes WHERE type_id = ${type_id} AND serial = ${serial}`
			);
			connection.release();
			let cloneResults = JSON.parse(JSON.stringify(results));
			return cloneResults;
		} catch (err) {
			logError("Error getting all NODES from the NODES TABLE", err);
			connection.release();
		}
	};

	return getNodeAsync();
};

NodeRepository.prototype.insertNodeData = function($happn, nodeObj) {
	let insertNode = async () => {
		let connection;
		try {
			let connection = await this.__getConnection($happn);

			delete nodeObj.parent_serial;
			delete nodeObj.parent_type;
			delete nodeObj.happn_path;

			let result = await connection.query("INSERT INTO nodes SET ?", nodeObj);

			connection.release();
			return result.insertId;
		} catch (err) {
			$happn.log.error("insertNodeData error", err);
			connection.release();
			return Promise.reject(err);
		}
	};

	return insertNode();
};

// this requires explicit closing of connection by consuming module
NodeRepository.prototype.updateNodeData = function($happn, nodeObj) {
	let updateNode = async () => {
		let connection;
		try {
			connection = await this.__getConnection($happn);

			let query = `UPDATE nodes SET 
			type_id = ${nodeObj.type_id}, 
			key_switch_status = ${nodeObj.key_switch_status},
			communication_status = ${nodeObj.communication_status}, 
			blast_armed = ${nodeObj.blast_armed}, 
			fire_button = ${nodeObj.fire_button},
			isolation_relay = ${nodeObj.isolation_relay}, 
			shaft_fault = ${nodeObj.shaft_fault},
			cable_fault = ${nodeObj.cable_fault},
			earth_leakage = ${nodeObj.earth_leakage},
			detonator_status =${nodeObj.detonator_status},
			partial_blast_lfs = ${nodeObj.partial_blast_lfs},
			full_blast_lfs = ${nodeObj.full_blast_lfs},
			booster_fired_lfs = ${nodeObj.booster_fired_lfs},
			missing_pulse_detected_lfs = ${nodeObj.missing_pulse_detected_lfs},
			AC_supply_voltage_lfs = ${nodeObj.AC_supply_voltage_lfs},
			DC_supply_voltage = ${nodeObj.DC_supply_voltage},
			DC_supply_voltage_status = ${nodeObj.DC_supply_voltage_status},
			mains = ${nodeObj.mains},
			low_bat = ${nodeObj.low_bat},
			too_low_bat = ${nodeObj.too_low_bat},
			delay = ${nodeObj.delay},
			program = ${nodeObj.program},
			calibration = ${nodeObj.calibration},
			det_fired = ${nodeObj.det_fired},
			tagged = ${nodeObj.tagged},
			energy_storing = ${nodeObj.energy_storing},
			bridge_wire = ${nodeObj.bridge_wire},
			parent_id = ${nodeObj.parent_id},
			window_id = ${nodeObj.window_id}
			WHERE id = ${nodeObj.id}`;

			let result = await connection.query(query);

			//clear fired flag when type_id is 0, and fire button is pressed
			//why is this in REPO and not in data services
			if (nodeObj.type_id == 0 && nodeObj.fire_button == 1) {
				$happn.log.info("clearing fire flags...");

				let fireFlagQuery =
					"UPDATE nodes SET booster_fired_lfs = 0 WHERE type_id = 2";
				await connection.query(fireFlagQuery);

				let connectedDetLfsQuery =
					'UPDATE nodes SET detonator_lfs = "Not fired" WHERE type_id=2 AND detonator_status=1';
				await connection.query(connectedDetLfsQuery);

				var notConnectedDetLfsQuery =
					'UPDATE nodes SET detonator_lfs = "No detonator" WHERE type_id=2 AND detonator_status=0';
				await connection.query(notConnectedDetLfsQuery);
			}

			connection.release();
			return result;
		} catch (err) {
			$happn.log.error("updateNodeData error", err);
			connection.release();
			return Promise.reject(err);
		}
	};
	return updateNode();
};

NodeRepository.prototype.getSerialsByType = function(typeId, $happn) {
	let getSerialsAsync = async () => {
		let connection = await this.__getConnection($happn);
		try {
			let res = await connection.query(
				`SELECT DISTINCT serial FROM nodes WHERE type_id = ${typeId}`
			);
			connection.release();
			return res;
		} catch (err) {
			$happn.log.error("getting serials by type error", err);
			connection.release();
		}
	};

	return getSerialsAsync();
};

NodeRepository.prototype.archiveEdds = function($happn, cbb) {
	const { error: logError, info: logInfo } = $happn.log;

	let archiveAsync = async () => {
		let connection = await this.__getConnection($happn);
		try {
			logInfo("moving EDDs from nodes to archive...");
			const archiveEDDsQuery = `INSERT INTO archives
				(x,y,serial,type_id,key_switch_status,communication_status,blast_armed,fire_button,isolation_relay,cable_fault,earth_leakage,detonator_status,partial_blast_lfs,full_blast_lfs,booster_fired_lfs,missing_pulse_detected_lfs,DC_supply_voltage_status,mains,parent_id,comment,window_id,shaft_fault,low_bat,too_low_bat,delay,program,calibration,det_fired,tagged,energy_storing,bridge_wire,dets_length,AC_supply_voltage_lfs,DC_supply_voltage,communication_flag,logged,led_state)
				SELECT
				x,y,serial,type_id,key_switch_status,communication_status,blast_armed,fire_button,isolation_relay,cable_fault,earth_leakage,detonator_status,partial_blast_lfs,full_blast_lfs,booster_fired_lfs,missing_pulse_detected_lfs,DC_supply_voltage_status,mains,parent_id,comment,window_id,shaft_fault,low_bat,too_low_bat,delay,program,calibration,det_fired,tagged,energy_storing,bridge_wire,dets_length,AC_supply_voltage_lfs,DC_supply_voltage,communication_flag,logged,led_state
				FROM nodes WHERE type_id = 4 AND parent_id = ${cbb.id}`;

			connection.query(archiveEDDsQuery);

			logInfo(`Delete EDDs from Nodes Table for CBB-${cbb.id}`);
			await connection.query(
				`DELETE FROM nodes WHERE type_id = 4 AND parent_id = ${cbb.id}`
			);

			logInfo("UPDATE archive parent_id...");
			let updateParentSerialQuery = `UPDATE archives INNER JOIN nodes ON archives.parent_id = nodes.id 
				SET archives.parent_id = nodes.serial, 
				archives.type_id = 99 WHERE archives.type_id = 4`;

			await connection.query(updateParentSerialQuery);
			logInfo("Query:" + updateParentSerialQuery);

			await connection.release();
		} catch (err) {
			logError(`Archive EDD error - ${err}`);
		}
	};

	return archiveAsync();
};

/*************************************************************
 * REPO FUNCTIONS USED BY TESTS
 **************************************************************
 */

/***
 * @summary Async function that gets all nodes from the nodes table of the datastore
 * @param $happn
 */
NodeRepository.prototype.getNodeData = function($happn) {
	const { error: logError } = $happn.log;

	const getNode = async () => {
		let connection;
		try {
			connection = await this.__getConnection($happn);
			let results = await connection.query("SELECT DISTINCT * FROM nodes");
			connection.release();

			return results;
		} catch (err) {
			logError("Get NodeData error", err);
			connection.release();
		}
	};
	return getNode();
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

			let query = `SELECT  * FROM nodes p
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

			return result;
		} catch (err) {
			$happn.log.error("Query error", err);
		}
	};
	return findNodeTree();
};

NodeRepository.prototype.deleteAll = function($happn) {
	let deleteNodes = async () => {
		let connection;
		try {
			let connection = await this.__getConnection($happn);
			let result = await connection.query("DELETE FROM nodes");
			$happn.log.info(" Nodes records deleted...");
			connection.release();
			return result;
		} catch (err) {
			$happn.log.error("deleteNodeData error", err);
			connection.release();
			return Promise.reject();
		}
	};
	return deleteNodes();
};

NodeRepository.prototype.__getConnection = function($happn) {
	let connectAsync = async () => {
		try {
			return await this.__dbConnectionService.getConnection($happn);
		} catch (err) {
			$happn.log.error("get connection error: " + err);
			return Promise.reject();
		}
	};

	return connectAsync();
};

module.exports = NodeRepository;
