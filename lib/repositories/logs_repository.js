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
			return Promise.reject(err);
		}
	};
	return init();
};

LogsRepository.prototype.insert = function($happn, log) {
	let connection;
	let insertAsync = async () => {
		try {
			let LogObj = {
				node_serial: log.serial,
				message: log.message
			};

			connection = await this.__getConnection($happn);

			let result = await connection.query(
				"INSERT INTO logs SET ?,created=NOW()",
				LogObj
			);

			$happn.log.info("::: log record inserted | id: " + result.insertId);
			connection.release();
			return result.insertId;
		} catch (err) {
			$happn.log.error("insert LogData error", err);
			connection.release();
			return Promise.reject(err);
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
			return Promise.reject(err);
		}
	};
	return getAllAsync();
};

LogsRepository.prototype.deleteAll = function($happn) {
	let deleteLogs = async () => {
		let connection;
		try {
			let connection = await this.__getConnection($happn);
			let result = await connection.query("DELETE FROM logs");
			$happn.log.info("Logs records deleted...");
			connection.release();
			return result;
		} catch (err) {
			$happn.log.error("delete Logs Data error", err);
			connection.release();
			return Promise.reject(err);
		}
	};
	return deleteLogs();
};

LogsRepository.prototype.__getConnection = function($happn) {
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

module.exports = LogsRepository;
