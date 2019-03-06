function cacheService() {

}

cacheService.prototype.writeDataIncrement = function ($happn, options) {
	return new Promise((resolve, reject) => {
		$happn.data.setSibling(options.path, options.data, function (e, response) {
			if (e) return reject(e);

			return resolve(response);
		});
	});

};

cacheService.prototype.writeData = function ($happn, options) {
	return new Promise((resolve, reject) => {
		$happn.data.set(options.path, options.data, {}, function (e, response) {
			if (e) return reject(e);

			return resolve(response);
		});
	});

};

cacheService.prototype.readData = function ($happn, path) {
	return new Promise((resolve, reject) => {
		$happn.data.get(path, null, function (e, result) {
			if (e) return reject(e);

			return resolve(result);
		});
	});
};

cacheService.prototype.popData = function ($happn, path) {
	return new Promise((resolve, reject) => {
		$happn.data.remove(path, null, function (e, result) {
			if (e) return reject(e);

			return resolve(result);
		});
	});
};


module.exports = cacheService;