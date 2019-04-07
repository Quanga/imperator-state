function PacketRepository() {}

PacketRepository.prototype.initialise = function($happn) {
	const { info: logInfo, error: logError } = $happn.log;
	logInfo("Packet Repository Initialize.................");

	let initAsync = async () => {
		try {
			logInfo("Packet Repository Initialize.................PASS");
		} catch (err) {
			logError("Packet Repository Initialize.................FAIL", err);
			return Promise.reject(err);
		}
	};
	return initAsync();
};

PacketRepository.prototype.insertPacketArr = function($happn, insertData) {
	const { error: logError } = $happn.log;
	const { data } = $happn.exchange;

	return new Promise((resolve, reject) => {
		data.set(
			`persist/packets/${insertData.created}`,
			insertData,
			{},
			(err, response) => {
				if (err) {
					logError("cannot write packet to path");
					return reject(err);
				}
				resolve(response);
			}
		);
	});
};

PacketRepository.prototype.getAll = function($happn) {
	const { error: logError } = $happn.log;
	const { data } = $happn.exchange;

	return new Promise((resolve, reject) => {
		data.get("persist/packets/*", null, (err, response) => {
			if (err) {
				logError("Failed to get Packets", err);
				return reject(err);
			}

			resolve(response);
		});
	});
};

PacketRepository.prototype.deleteAll = function($happn) {
	const { info: logInfo, error: logError } = $happn.log;
	const { data } = $happn.exchange;

	return new Promise((resolve, reject) => {
		data.remove("persist/packets/*", null, function(err, result) {
			if (err) {
				logError(`Cannot Delete Logs`, err);
				return reject(err);
			}
			logInfo("All Logs successfully removed");
			resolve(result);
		});
	});
};

module.exports = PacketRepository;
