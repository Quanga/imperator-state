/* eslint-disable no-unused-vars */
function PacketRepository() {}

PacketRepository.prototype.start = function($happn) {
	const { info: logInfo } = $happn.log;

	let initAsync = async () => {
		logInfo("PacketRepository Initialize.................PASS");
	};
	return initAsync();
};

PacketRepository.prototype.stop = function($happn) {
	const { info: logInfo } = $happn.log;

	let stopAsync = async () => {
		logInfo("PacketRepository Initialize.................PASS");
	};
	return stopAsync();
};

PacketRepository.prototype.set = function($happn, path, msgObj) {
	const { error: logError } = $happn.log;
	const { data } = $happn.exchange;

	return new Promise(resolve => {
		data.set(`persist/packets/${path}`, msgObj, {}, (err, resp) => {
			if (err) {
				return logError("cannot write packet to path", err);
			}

			resolve(resp);
		});
	});
};

PacketRepository.prototype.get = function($happn, path) {
	const { error: logError } = $happn.log;
	const { data } = $happn.exchange;

	return new Promise(resolve => {
		data.get(`persist/packets/${path}`, null, (err, response) => {
			if (err) {
				return logError("Failed to get Packets", err);
			}

			resolve(response);
		});
	});
};

PacketRepository.prototype.delete = function($happn, path) {
	const { error: logError } = $happn.log;
	const { data } = $happn.exchange;

	return new Promise((resolve, reject) => {
		data.remove(`persist/packets/${path}`, null, (err, result) => {
			if (err) {
				return logError(`Cannot Delete Packets`, err);
			}
			resolve(result);
		});
	});
};

module.exports = PacketRepository;
