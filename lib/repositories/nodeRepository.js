const mySqlProvider = require("./provider/nodeRepositoryMySql");
const happnProvider = require("./provider/nodeRepositoryHappn");

function NodeRepositoryBase(provider, callback) {
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

module.exports = NodeRepositoryBase;
