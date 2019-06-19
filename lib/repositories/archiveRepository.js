function ArchiveRepository() {}

ArchiveRepository.prototype.start = function($happn) {
	const { info: logInfo } = $happn.log;

	let initAsync = async () => {
		logInfo("Happn ArchiveRepository Initialize.................PASS");
	};
	return initAsync();
};

ArchiveRepository.prototype.stop = function($happn) {
	const { info: logInfo } = $happn.log;

	let stopAsync = async () => {
		logInfo("Happn ArchiveRepository Initialize.................PASS");
	};
	return stopAsync();
};

ArchiveRepository.prototype.insertArchives = function($happn, archive) {
	const { error: logError } = $happn.log;
	const { data } = $happn.exchange;
	const { date, path, data: archiveData } = archive;

	//   let archive = {
	//     date: parent.storedPacketDate,
	//     path: parent.path,
	//     data: nodePath
	//   };

	return new Promise((resolve, reject) => {
		data.set(
			`persist/archive/${date}/${path}`,
			archiveData,
			{},
			(err, response) => {
				if (err) {
					logError("cannot write archive to path");
					return reject(err);
				}

				resolve(response);
			}
		);
	});
};

ArchiveRepository.prototype.getAll = function($happn) {
	const { error: logError } = $happn.log;
	const { data } = $happn.exchange;

	return new Promise((resolve, reject) => {
		data.get(`persist/archive/*`, null, (err, response) => {
			if (err) {
				logError(`cannot logs * get from path`, err);
				return reject(err);
			}

			resolve(response);
		});
	});
};

ArchiveRepository.prototype.getArchive = function(
	$happn,
	nodeSerial,
	nodeType
) {
	const { error: logError } = $happn.log;
	const { data } = $happn.exchange;

	return new Promise((resolve, reject) => {
		data.get(
			`persist/archive/${nodeType}/${nodeSerial}/*`,
			null,
			(err, response) => {
				if (err) {
					logError(
						`cannot logs for ${nodeType}/${nodeSerial}/* get from path`,
						err
					);
					return reject(err);
				}
				resolve(response);
			}
		);
	});
};

ArchiveRepository.prototype.delete = function($happn, path) {
	const { info: logInfo, error: logError } = $happn.log;
	const { data } = $happn.exchange;

	return new Promise((resolve, reject) => {
		data.remove(`persist/archive/${path}`, null, function(err, result) {
			if (err) {
				logError(`Cannot Delete Archives`, err);
				return reject(err);
			}
			logInfo("All Archives successfully removed");
			resolve(result);
		});
	});
};

module.exports = ArchiveRepository;
