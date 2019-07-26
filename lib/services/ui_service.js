/* eslint-disable no-unused-vars */
const uiService = function() {};
const defaultUI = require("../constants/recipes");
const { DeviceTypes } = require("../constants/defaultAppConstants");

uiService.prototype.start = function($happn) {
	const { uiService } = $happn.exchange;

	return (async () => {
		let recipe = await uiService.get();
		if (!recipe) {
			await uiService.set(defaultUI());
		}
	})();
};

uiService.prototype.stop = function($happn) {
	const { info } = $happn.log;

	return new Promise((resolve, reject) => {
		info("UI Service shutting down");
		resolve();
	});
};

uiService.prototype.get = function($happn) {
	const { data } = $happn.exchange;

	return new Promise((resolve, reject) => {
		data.get("persist/ui", null, (error, response) => {
			if (error) return reject(error);
			resolve(response);
		});
	});
};

uiService.prototype.set = function($happn, payload) {
	const { data } = $happn.exchange;

	return new Promise((resolve, reject) => {
		data.set("persist/ui", payload, {}, (error, response) => {
			if (error) return reject(error);

			return resolve(response);
		});
	});
};

uiService.prototype.getDeviceTypes = function($happn) {
	return new Promise((resolve, reject) => {
		resolve(DeviceTypes());
	});
};

uiService.prototype.deleteAll = function($happn) {
	const { data } = $happn.exchange;

	return new Promise((resolve, reject) => {
		data.remove("persist/ui", (err, resp) => {
			if (err) return reject(err);

			resolve(resp);
		});
	});
};

module.exports = uiService;
