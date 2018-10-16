/**
 * Created by tim on 2018/09/10.
 */

function LogsRepository() {}

LogsRepository.prototype.initialise = function($happn) {
	let DbConnectionService = require("../services/db_connection_service");
	$happn.log.info("LogsRepository Initialize.................");
	let config = $happn.config;

	let init = async () => {
		try {
			this.__dbConnectionService = new DbConnectionService();
			this.__dbConnectionService.initialise($happn, config);
			$happn.log.info("LogsRepository Initialize.................PASS");
		} catch (err) {
			$happn.log.error("LogsRepository Initialize.................FAIL");
		}
	};
	return init();
};

LogsRepository.prototype.insertLogData = function($happn, logs) {
	let connection;
	let insertAsync = async () => {
		try {
			connection = this.__getConnection($happn);
			let result = connection.query(
				"INSERT INTO logs SET ?,created=NOW()",
				logs
			);

			$happn.log.info("::: record inserted | id: " + result.insertId);
			connection.release();
			return result.insertId;
		} catch (err) {
			$happn.log.error("insertNodeData error", err);
			connection.release();
		}
	};

	return insertAsync();
};

LogsRepository.prototype.getLogData = function($happn, nodeSerial) {
	let getAllAsync = async () => {
		let connection;

		try {
			connection = this.__getConnection($happn);

			const query = `SELECT * FROM logs 
			WHERE node_serial = ? 
			ORDER BY created DESC 
			'LIMIT 1'`;

			let results = await connection.query({ sql: query }, [nodeSerial]);

			connection.release();
			return results;
		} catch (err) {
			$happn.log.error("getLogData error", err);
			connection.release();
		}
	};
	return getAllAsync();
};

LogsRepository.prototype.__getConnection = function($happn) {
	let connectAsync = async () => {
		try {
			return await this.__dbConnectionService.getConnection($happn);
		} catch (err) {
			$happn.log.error("get connection error: " + err);
		}
	};

	return connectAsync();
};

module.exports = LogsRepository;
