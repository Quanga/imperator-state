/**
 * Created by tim on 2018/09/10.
 */

function WarningsRepository() {}

WarningsRepository.prototype.initialise = function($happn) {
	let DbConnectionService = require("../services/db_connection_service");
	$happn.log.info("WarningsRepository Initialize.................");
	let config = $happn.config;

	let init = async () => {
		try {
			this.__dbConnectionService = new DbConnectionService();
			this.__dbConnectionService.initialise($happn, config);
			$happn.log.info("WarningsRepository Initialize.................PASS");
		} catch (err) {
			$happn.log.error("WarningsRepository Initialize.................FAIL");
			return Promise.reject(err);
		}
	};
	return init();
};

WarningsRepository.prototype.insertWarningsData = function($happn, logs) {
	let connection;
	let insertAsync = async () => {
		try {
			connection = await this.__getConnection($happn);

			let result = await connection.query(
				"INSERT INTO warnings SET ?,created=NOW()",
				logs
			);

			$happn.log.info("::: warnings record inserted | id: " + result.insertId);
			connection.release();
			return result.insertId;
		} catch (err) {
			$happn.log.error("insertNodeData error", err);
			connection.release();
			return Promise.reject();
		}
	};

	return insertAsync();
};

WarningsRepository.prototype.getLogData = function($happn, nodeSerial) {
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
			return Promise.reject(err);
		}
	};
	return getAllAsync();
};

WarningsRepository.prototype.deleteLogsData = function($happn) {
	let deleteLogs = async () => {
		let connection;
		try {
			let connection = await this.__getConnection($happn);
			let result = await connection.query("DELETE FROM logs");
			$happn.log.info("records deleted...");
			connection.release();
			return result;
		} catch (err) {
			$happn.log.error("deleteNodeData error", err);
			connection.release();
			return Promise.reject(err);
		}
	};
	return deleteLogs();
};

WarningsRepository.prototype.__getConnection = function($happn) {
	let connectAsync = async () => {
		try {
			return await this.__dbConnectionService.getConnection($happn);
		} catch (err) {
			$happn.log.error("get connection error: " + err);
			return Promise.reject(err);
		}
	};

	return connectAsync();
};

module.exports = WarningsRepository;
