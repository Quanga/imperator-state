var pako = require("pako");
/**
 * @class
 * @summary Creates an instance of BlastRepository.
 */
class BlastRepository {
	constructor() {}
	/**
	 * Set
	 * @param {*} $happn
	 * @param {{blast: string}} $happn
	 * @returns {Promise}
	 */
	async set($happn, blast) {
		const { log } = $happn;
		const { data } = $happn.exchange;

		const compressedData = pako.deflate(JSON.stringify(blast), { to: "string" });
		const resp = await new Promise((resolve, reject) => {
			data.set(`persist/blasts/${blast.meta.id}`, compressedData, {}, (err, response) => {
				if (err) {
					log.error("cannot write blast to path");
					return reject(err);
				}
				resolve(response);
			});
		});
		return resp;
	}

	upsertIndex($happn, blast) {
		const { error: logError } = $happn.log;
		const { data } = $happn.exchange;

		return new Promise((resolve) => {
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
				update[blast.meta.id] = {
					date: blast.createdAt,
					complete: blast.times.blastClosed,
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
	}
	deleteIndex($happn, blast) {
		const { error: logError } = $happn.log;
		const { data } = $happn.exchange;
		return new Promise((resolve) => {
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
				delete update[blast];
				data.set(`persist/blasts/index`, update, {}, (err, response) => {
					if (err) {
						logError("cannot write blast to path");
						return resolve(err);
					}
					resolve(response);
				});
			});
		});
	}
	//TODO - this is temp fix to cut down on size returned
	get($happn, id, unzip) {
		const { log } = $happn.log;
		const { data } = $happn.exchange;
		try {
			return new Promise((resolve, reject) => {
				data.get(`persist/blasts/${id}`, null, (err, response) => {
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
	}
	delete($happn, id) {
		const { info: logInfo, error: logError } = $happn.log;
		const { data } = $happn.exchange;
		return new Promise((resolve, reject) => {
			data.remove(`persist/blasts/${id}`, null, function (err, result) {
				if (err) {
					logError(`Cannot Blasts`, err);
					return reject(err);
				}
				logInfo("All Logs successfully removed");
				resolve(result);
			});
		});
	}
}

module.exports = BlastRepository;
