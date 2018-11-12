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

NodeRepository.prototype.insertNodeData = function($happn, parsedPacket) {
	let insertNode = async () => {
		let connection;
		try {
			let connection = await this.__getConnection($happn);

			delete parsedPacket.parent_serial;
			delete parsedPacket.parent_type;
			delete parsedPacket.happn_path;

			let result = await connection.query(
				"INSERT INTO nodes SET ?",
				parsedPacket
			);

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
NodeRepository.prototype.updateNodeData = function($happn, nodeItem) {
	let updateNode = async () => {
		let connection;
		try {
			connection = await this.__getConnection($happn);

			let query = `UPDATE nodes SET 
			type_id = ${nodeItem.type_id}, 
			key_switch_status = ${nodeItem.key_switch_status},
			communication_status = ${nodeItem.communication_status}, 
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
			window_id = ${nodeItem.window_id}
			WHERE id = ${nodeItem.id}`;

			let result = await connection.query(query);

			//clear fired flag when type_id is 0, and fire button is pressed
			//why is this in REPO and not in data services
			if (nodeItem.type_id == 0 && nodeItem.fire_button == 1) {
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

NodeRepository.prototype.getIbcSerials = function($happn) {
	$happn.log("getting ibs serials");

	let getIBC = async () => {
		let connection = await this.__getConnection($happn);
		try {
			let res = await connection.query(
				"SELECT DISTINCT serial FROM nodes WHERE type_id = 0"
			);
			connection.release();
			return res;
		} catch (err) {
			$happn.log.error("getIbcSerials error", err);
			connection.release();
		}
	};

	return getIBC();
};

NodeRepository.prototype.getIscSerials = function($happn) {
	let getISC = async () => {
		let connection;
		try {
			connection = await this.__getConnection($happn);
			let results = await connection.query(
				"SELECT DISTINCT serial FROM nodes WHERE type_id = 1"
			);
			let cloneResults = JSON.parse(JSON.stringify(results));

			connection.release();
			return cloneResults;
		} catch (err) {
			$happn.log.error("getIscSerials error", err);
			connection.release();
		}
	};
	return getISC();
};

NodeRepository.prototype.archiveEdds = function($happn, cbb) {
	const { error: logError, info: logInfo } = $happn.log;
	let archiveAsync = async () => {
		let connection = await this.__getConnection($happn);
		try {
			logInfo("moving EDDs from nodes to archive...");
			var archiveEDDsQuery = `INSERT INTO archives
				(x,y,serial,type_id,key_switch_status,communication_status,blast_armed,fire_button,isolation_relay,cable_fault,earth_leakage,detonator_status,partial_blast_lfs,full_blast_lfs,booster_fired_lfs,missing_pulse_detected_lfs,DC_supply_voltage_status,mains,parent_id,comment,window_id,shaft_fault,low_bat,too_low_bat,delay,program,calibration,det_fired,tagged,energy_storing,bridge_wire,dets_length,AC_supply_voltage_lfs,DC_supply_voltage,communication_flag,logged,led_state)
				SELECT
				x,y,serial,type_id,key_switch_status,communication_status,blast_armed,fire_button,isolation_relay,cable_fault,earth_leakage,detonator_status,partial_blast_lfs,full_blast_lfs,booster_fired_lfs,missing_pulse_detected_lfs,DC_supply_voltage_status,mains,parent_id,comment,window_id,shaft_fault,low_bat,too_low_bat,delay,program,calibration,det_fired,tagged,energy_storing,bridge_wire,dets_length,AC_supply_voltage_lfs,DC_supply_voltage,communication_flag,logged,led_state
				FROM nodes WHERE type_id = 4 AND parent_id = ${cbb.id}`;

			connection.query(archiveEDDsQuery);

			logInfo("Delete current report...");
			let deleteCurrentReportQuery = `DELETE FROM nodes WHERE type_id = 4 AND parent_id = ${
				cbb.id
			}`;

			await connection.query(deleteCurrentReportQuery);

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
