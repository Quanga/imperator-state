const mySqlProvider = require("./provider/logsRepositoryMySql");
const happnProvider = require("./provider/logsRepositoryHappn");

function LogsRepositoryBase(provider, callback) {
	switch (provider) {
	case "mySql": {
		return callback(null, new mySqlProvider());
	}
	case "happn": {
		return callback(null, new happnProvider());
	}
	default: {
		//return callback(null, new happnProvider());
		throw new Error("DataStore Provider not found");
	}
	}
}

module.exports = LogsRepositoryBase;
