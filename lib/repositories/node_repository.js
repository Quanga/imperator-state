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
			// LEFT OUTER JOIN nodes c ON
			// p.id = c.parent_id
			//let results = await connection.query("SELECT * FROM nodes");

			let query = `SELECT DISTINCT p.*, c.serial AS parent_serial, c.type_id AS parent_type FROM nodes AS p
				 LEFT  JOIN nodes AS c 
                 ON c.id = p.parent_id`;

			let results = await connection.query({ sql: query, nestTables: false });

			connection.release();
			//let cloneResults = JSON.parse(JSON.stringify(results));
			let transformedResults = await this.transformGet(results);
			return transformedResults;

			//return results;
		} catch (err) {
			error("Error getting all NODES from the NODES TABLE", err);
			connection.release();
		}
	};

	return getAll();
};

// eslint-disable-next-line no-unused-vars
NodeRepository.prototype.transformGet = function(sqlResult, $happn) {
	const UnitModels = require("../models/unitModels");
	const {
		ControlUnitModel,
		SectionControlModel,
		BoosterModel,
		CBoosterModel,
		EDDModel
	} = UnitModels;

	let transformAsync = async () => {
		let resultArr = [];

		for (const row of sqlResult) {
			let unitObj = null;
			console.log(row);
			switch (row.type_id) {
			case 0:
				unitObj = new ControlUnitModel(row.serial, null);
				break;
			case 1:
				unitObj = new SectionControlModel(row.serial, null);
				break;
			case 2:
				unitObj = new BoosterModel(row.serial, null);
				break;
			case 3:
				unitObj = new CBoosterModel(row.serial, null);
				break;
			case 4:
				unitObj = new EDDModel(row.serial, null);
				break;
			}

			let remappedObj = await mapProps(row, unitObj);

			resultArr.push(remappedObj);
		}
		return resultArr;
	};

	let mapProps = async (foundNode, newObj) => {
		try {
			for (let key in newObj) {
				if (foundNode.hasOwnProperty(key)) {
					let propResult = foundNode[key];
					if (propResult != null) {
						newObj[key] = foundNode[key];
					}
				}
			}
			return newObj;
		} catch (err) {
			return Promise.reject(err);
		}
	};

	return transformAsync();
};

NodeRepository.prototype.mapObj = function(fromObj, toObj) {
	//for each key in the to object
	//copy the value from the fromObject, to the keyObject
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
			let query = `SELECT DISTINCT p.*, c.serial AS parent_serial, c.type_id AS parent_type FROM nodes AS p
				 LEFT  JOIN nodes AS c 
				 ON c.id = p.parent_id
				 type_id = ${type_id} AND serial = ${serial}`;

			let results = await connection.query({ sql: query, nestTables: false });
			// let results = await connection.query(
			// 	`SELECT * FROM nodes WHERE type_id = ${type_id} AND serial = ${serial}`
			// );
			connection.release();
			let transformedResults = await this.transformGet(results);

			//let cloneResults = JSON.parse(JSON.stringify(results));
			return transformedResults;

			//return cloneResults;
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

			delete nodeObj.status;
			delete nodeObj.created;
			delete nodeObj.dirty;
			delete nodeObj.parent_serial;
			delete nodeObj.parent_type;
			delete nodeObj.storedPacketDate;
			delete nodeObj.happn_path;

			//let result = await connection.query(query);
			//console.log("node object ", nodeObj);
			let result = await connection.query(
				`UPDATE nodes SET ? WHERE id = ${nodeObj.id}`,
				nodeObj
			);

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
