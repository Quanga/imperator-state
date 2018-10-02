/**
 * Created by grant on 2017/01/06.
 */

function DbConnectionService() {
	this.__pool = null;
}

DbConnectionService.prototype.initialise = function($happn, config) {
	var mysql = require("promise-mysql");

	return new Promise((resolve, reject) => {
		$happn.log.info("creating connection pool...");
		try {
			this.__pool = mysql.createPool({
				host: config.mySqlHost,
				user: config.mySqlUser,
				password: config.mySqlPassword,
				database: config.mySqlDb,
				connectionLimit: config.mySqlConnectionLimit,
				acquireTimeout: 60000,
				queueLimit: 0,
				timeout: 5000
			});
			$happn.log.info("creating connection pool...........PASS");
			resolve();
		} catch (err) {
			$happn.log.error("connection pool error: " + err);
			return reject(err);
		}
	});
};

DbConnectionService.prototype.getConnection = function($happn) {
	var self = this;

	async function connect() {
		try {
			let connection = await self.__pool.getConnection();
			//$happn.log.info("Database connection successful");
			return connection;
		} catch (err) {
			$happn.log.error("no connection", err);
		}
	}
	return connect();
};

module.exports = DbConnectionService;
