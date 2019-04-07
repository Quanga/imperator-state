function LogsRepository() {}

LogsRepository.prototype.initialise = function($happn) {
	const { error: logError, info: logInfo } = $happn.log;
	logInfo("LogsRepository Initialize.................");

	let init = async () => {
		try {
			logInfo("LogsRepository Initialize.................PASS");
		} catch (err) {
			logError("LogsRepository Initialize.................FAIL");
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
				message: log.message,
				created: log.created
			};

			connection = await this.__getConnection($happn);

			let result = await connection.query("INSERT INTO logs SET ?", LogObj);
			//$happn.log.info("::: log record inserted | id: " + result.insertId);
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
	const { error: logError } = $happn.log;
	let getAllAsync = async () => {
		let connection;

		try {
			connection = this.__getConnection($happn);

			const query = `SELECT * FROM logs 
			WHERE node_serial = ${nodeSerial} 
			ORDER BY created DESC 
			LIMIT 1000`;

			let results = await connection.query({ sql: query });

			connection.release();
			return results;
		} catch (err) {
			logError("getLogData error", err);
			connection.release();
			return Promise.reject(err);
		}
	};
	return getAllAsync();
};

LogsRepository.prototype.deleteAll = function($happn) {
	const { info: logInfo, error: logError } = $happn.log;
	let deleteLogs = async () => {
		let connection;
		try {
			let connection = await this.__getConnection($happn);
			let result = await connection.query("DELETE FROM logs");
			logInfo("Logs records deleted...");
			connection.release();
			return result;
		} catch (err) {
			logError("delete Logs Data error", err);
			connection.release();
			return Promise.reject(err);
		}
	};
	return deleteLogs();
};

LogsRepository.prototype.__getConnection = function($happn) {
	const { dbConnectionService } = $happn.exchange;
	const { error: logError } = $happn.log;

	let connectAsync = async () => {
		try {
			return await dbConnectionService.getConnection($happn);
		} catch (err) {
			logError("get connection error: " + err);
			return Promise.reject(err);
		}
	};

	return connectAsync();
};

module.exports = LogsRepository;
