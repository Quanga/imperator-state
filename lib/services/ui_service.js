/* eslint-disable no-unused-vars */
const uiService = function() {};
const defaultUI = require("../constants/recipes");
const { MeshTypes, DeviceTypes } = require("../constants/defaultAppConstants");

uiService.prototype.start = function($happn) {
	const { uiService } = $happn.exchange;

	const startAsync = async () => {
		let recipe = await uiService.get();
		if (!recipe) {
			await uiService.set(defaultUI());
		}
	};

	return startAsync();
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

	const getAsync = () =>
		new Promise((resolve, reject) => {
			data.get("persist/ui", null, (error, response) => {
				if (error) return reject(error);
				resolve(response);
			});
		});
	return getAsync();
};

uiService.prototype.set = function($happn, payload) {
	const { data } = $happn.exchange;

	const writeAsync = () =>
		new Promise((resolve, reject) => {
			data.set("persist/ui", payload, {}, (error, response) => {
				if (error) return reject(error);

				return resolve(response);
			});
		});

	return writeAsync();
};

uiService.prototype.getSystemTypes = function($happn) {
	return MeshTypes();
};

uiService.prototype.getDeviceTypes = function($happn) {
	return DeviceTypes();
};

uiService.prototype.deleteAll = function($happn) {
	const { data } = $happn.exchange;

	const deleteAllAsync = () =>
		new Promise((resolve, reject) => {
			data.remove("persist/ui", (err, resp) => {
				if (err) return reject(err);

				resolve(resp);
			});
		});

	return deleteAllAsync();
};

module.exports = uiService;
