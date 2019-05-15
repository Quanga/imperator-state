/* eslint-disable no-unused-vars */
function PacketRepository() {}

PacketRepository.prototype.start = function($happn) {
	const { info: logInfo } = $happn.log;

	let initAsync = async () => {
		logInfo("Happn PacketRepository Initialize.................PASS");
	};
	return initAsync();
};

PacketRepository.prototype.stop = function($happn) {
	const { info: logInfo } = $happn.log;

	let stopAsync = async () => {
		logInfo("Happn PacketRepository Initialize.................PASS");
	};
	return stopAsync();
};

PacketRepository.prototype.insert = function($happn, insertData) {
	const { error: logError } = $happn.log;
	const { data } = $happn.exchange;
	const { emit } = $happn;

	return new Promise((resolve, reject) => {
		data.set(
			`persist/packets/${insertData.path}`,
			insertData,
			{},
			(err, response) => {
				if (err) {
					logError("cannot write packet to path");
					return reject(err);
				}
				//console.log("INSERTDATA", insertData.path.split("/")[0]);
				//only if it is in the passed queue
				//if (insertData.path.split("/")[0] === "queue")
				emit("process", response);

				resolve(response);
			}
		);
	});
};

PacketRepository.prototype.update = function($happn, insertData) {
	const { error: logError } = $happn.log;
	const { data } = $happn.exchange;

	return new Promise((resolve, reject) => {
		data.remove(
			`persist/packets/queue/${insertData.created}`,
			null,
			(err, result) => {
				if (err) {
					logError("cannot remove packet", err);
					return reject(err);
				}

				data.set(
					`persist/packets/processed/${insertData.created}`,
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
			}
		);
	});
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
		data.get("persist/packets/processed/*", null, (err, response) => {
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
				logError(`Cannot Delete Packets`, err);
				return reject(err);
			}
			logInfo("All Packets successfully removed");
			resolve(result);
		});
	});
};

module.exports = PacketRepository;
