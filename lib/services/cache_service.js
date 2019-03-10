function cacheService() {
	this.state = {
		items: [],
		count: 0,
		mode: "EMPTY"
	};
}


/* **************************************************
	START
*****************************************************
*/
cacheService.prototype.start = function ($happn) {
	const { data } = $happn;
	const { error: logError } = $happn.log;

	return new Promise((resolve, reject) => {
		data.on('*', {
			"event_type": "set",
			"initialCallback": false
			// eslint-disable-next-line no-unused-vars
		}, function (message, meta) {

			//emit('memcache', { message: message, meta: meta });
			// console.log(this.message);

			// eslint-disable-next-line no-unused-vars
		}, function (err, reference, response) {
			if (err) {
				logError("Cache Initialize Error", err);
				return reject(err);
			}

			resolve();
		});
	});
};

/* **************************************************
	GETTERS
*****************************************************
*/
// eslint-disable-next-line no-unused-vars
cacheService.prototype.getItems = function ($happn) {
	return new Promise((resolve) => {
		resolve(this.state.items);
	});
};

// eslint-disable-next-line no-unused-vars
cacheService.prototype.getFirstItem = function ($happn) {
	return new Promise((resolve) => {
		resolve(this.state.items[0]);
	});
};

// eslint-disable-next-line no-unused-vars
cacheService.prototype.getCount = function ($happn) {
	return new Promise((resolve) => {
		resolve(this.state.count);
	});
};

/* **************************************************
	READ WRITE DELETE
*****************************************************
*/

cacheService.prototype.writeDataIncrement = function ($happn, options) {
	const { data, emit, name } = $happn;
	const { error: logError } = $happn.log;

	return new Promise((resolve, reject) => {
		data.setSibling(options.path, options.data, (err, response) => {
			if (err) {
				logError("Write Data Incriment Error", err);
				return reject(err);
			}

			this.state.items.push(response);
			this.state.count++;
			emit("cache_set", name);
			return resolve(response);
		});
	});
};

cacheService.prototype.removeItem = function ($happn, item) {
	const { data } = $happn;
	const { error: logError } = $happn.log;
	const _this = this;

	return new Promise((resolve, reject) => {
		let persistedItem = _this.state.items.find(listItem => listItem === item);
		if (persistedItem) {

			data.remove(persistedItem._meta.path, function (e, result) {
				if (e) {
					logError("could not delete item", e);
					reject(e);
				}

				let persistedItemIndex = _this.state.items.indexOf(persistedItem);
				_this.state.items.splice(persistedItemIndex, 1);
				_this.state.count--;
				resolve(result);
			});
		} else {
			reject();
		}
	});
};


cacheService.prototype.writeData = function ($happn, options) {
	return new Promise((resolve, reject) => {
		$happn.data.set(options.path, options.data, { noPublish: false }, function (e, response) {
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

cacheService.prototype.readAllData = function ($happn) {
	return new Promise((resolve, reject) => {
		$happn.data.get("cache/*", null, function (e, result) {
			if (e) return reject(e);

			return resolve(result);
		});
	});
};


module.exports = cacheService;