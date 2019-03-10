function DbConnectionService() {
	this.__pool = null;
}

DbConnectionService.prototype.initialise = function ($happn) {
	const { config } = $happn;
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

DbConnectionService.prototype.getConnection = function ($happn) {
	var self = this;

	async function connect() {
		try {
			let connection = await self.__pool.getConnection();
			return connection;
		} catch (err) {
			$happn.log.error("no connection", err);
			return Promise.reject(err);
		}
	}
	return connect();
};

module.exports = DbConnectionService;
