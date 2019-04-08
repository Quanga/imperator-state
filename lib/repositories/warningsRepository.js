const mySqlProvider = require("./provider/warningsRepositoryMySql");
const happnProvider = require("./provider/warningsRepositoryHappn");

function WarningepositoryBase(provider, callback) {
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

module.exports = WarningepositoryBase;