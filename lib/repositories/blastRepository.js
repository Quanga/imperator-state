var pako = require("pako");
/**
 * @category Repositories
 * @class
 * @summary Creates an instance of BlastRepository.
 */
function BlastRepository() {}

/**
 * Set
 * @param {*} $happn
 * @param {{blast: string}} $happn
 * @returns {Promise}
 */
BlastRepository.prototype.set = function($happn, blast) {
	const { log } = $happn;
	const { data } = $happn.exchange;
	return (async () => {
		const compressedData = pako.deflate(JSON.stringify(blast), { to: "string" });

		const resp = await new Promise((resolve, reject) => {
			data.set(`/blasts/${blast.meta.id}`, compressedData, {}, (err, response) => {
				if (err) {
					log.error("cannot write blast to path");
					return reject(err);
				}

				resolve(response);
			});
		});
		return resp;
	})();
};

BlastRepository.prototype.upsertIndex = function($happn, blast) {
	const { error: logError } = $happn.log;
	const { data } = $happn.exchange;

	return new Promise(resolve => {
		data.get(`/blasts/index`, null, (err, resp) => {
			if (err) {
				logError("Error getting index on path");
				return resolve(err);
			}

			if (!resp) resp = {};
			if (resp.isArray) {
				resp = resp[0];
			}

			let update = { ...resp };
			update[blast.meta.id] = {
				date: blast.createdAt,
				complete: blast.times.blastClosed,
			};

			data.set(`/blasts/index`, update, {}, (err, response) => {
				if (err) {
					logError("cannot write blast to path");
					return resolve(err);
				}

				resolve(response);
			});
		});
	});
};

BlastRepository.prototype.deleteIndex = function($happn, blast) {
	const { error: logError } = $happn.log;
	const { data } = $happn.exchange;

	return new Promise(resolve => {
		data.get(`/blasts/index`, null, (err, resp) => {
			if (err) {
				logError("Error getting index on path");
				return resolve(err);
			}

			if (!resp) resp = {};
			if (resp.isArray) {
				resp = resp[0];
			}
			let update = { ...resp };

			delete update[blast];

			data.set(`/blasts/index`, update, {}, (err, response) => {
				if (err) {
					logError("cannot write blast to path");
					return resolve(err);
				}

				resolve(response);
			});
		});
	});
};

//TODO - this is temp fix to cut down on size returned
BlastRepository.prototype.get = function($happn, id, unzip) {
	const { log } = $happn.log;
	const { data } = $happn.exchange;

	try {
		return new Promise((resolve, reject) => {
			data.get(`/blasts/${id}`, null, (err, response) => {
				if (err) {
					log.error(`cannot get Blast- ${id} from path`, err);
					return reject(err);
				}

				if (unzip === true) {
					delete response._meta;
					let d;
					try {
						//var result = pako.inflate(compressed);
						d = JSON.parse(pako.inflate(response.value, { to: "string" }));
					} catch (err) {
						console.log(err);
					}

					if (d) {
						delete d.logs;
						delete d._meta;
					}
					return resolve(d);
				} else {
					if (response) delete response._meta;
					resolve(response);
				}
			});
		});
	} catch (err) {
		log.error(err);
	}
};

BlastRepository.prototype.delete = function($happn, id) {
	const { info: logInfo, error: logError } = $happn.log;
	const { data } = $happn.exchange;

	return new Promise((resolve, reject) => {
		data.remove(`/blasts/${id}`, null, function(err, result) {
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
