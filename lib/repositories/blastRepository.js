function BlastRepository() {}

BlastRepository.prototype.start = function($happn) {
	const { info: logInfo } = $happn.log;

	let initAsync = async () => {
		logInfo("Happn BlastRepository Initialize.................PASS");
	};
	return initAsync();
};

BlastRepository.prototype.stop = function($happn) {
	const { info: logInfo } = $happn.log;

	let stopAsync = async () => {
		logInfo("Happn BlastRepository Initialize.................PASS");
	};
	return stopAsync();
};

BlastRepository.prototype.set = function($happn, blast) {
	const { error: logError } = $happn.log;
	const { data } = $happn.exchange;

	return new Promise((resolve, reject) => {
		data.set(
			`persist/blasts/${blast.blastEvent.data.id}`,
			blast.blastEvent.data,
			{},
			(err, response) => {
				if (err) {
					logError("cannot write blast to path");
					return reject(err);
				}

				resolve(response);
			}
		);
	});
};

BlastRepository.prototype.upsertIndex = function($happn, blast) {
	const { error: logError } = $happn.log;
	const { data } = $happn.exchange;

	return new Promise(resolve => {
		data.get(`persist/blasts/index`, null, (err, resp) => {
			if (err) {
				logError("Error getting index on path");
				return resolve(err);
			}

			if (!resp) resp = {};
			if (resp.isArray) {
				resp = resp[0];
			}
			let update = { ...resp };

			update[blast.blastEvent.data.id] = {
				date: blast.created,
				complete: blast.blastEvent.data.blastClosed
			};

			data.set(`persist/blasts/index`, update, {}, (err, response) => {
				if (err) {
					logError("cannot write blast to path");
					return resolve(err);
				}

				resolve(response);
			});
		});
	});
};

BlastRepository.prototype.get = function($happn, id) {
	const { error: logError } = $happn.log;
	const { data } = $happn.exchange;

	return new Promise((resolve, reject) => {
		data.get(`persist/blasts/${id}`, null, (err, response) => {
			if (err) {
				logError(`cannot get Blast- ${id} from path`, err);
				return reject(err);
			}
			resolve(response);
		});
	});
};

BlastRepository.prototype.delete = function($happn, id = "*") {
	const { info: logInfo, error: logError } = $happn.log;
	const { data } = $happn.exchange;

	return new Promise((resolve, reject) => {
		data.remove(`persist/blasts/${id}`, null, function(err, result) {
			if (err) {
				logError(`Cannot Blasts`, err);
				return reject(err);
			}
			logInfo("All Logs successfully removed");
			resolve(result);
		});
	});
};

module.exports = BlastRepository;
