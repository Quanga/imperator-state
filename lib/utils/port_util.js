/**
 * Created by grant on 2016/07/19.
 */
const SerialPort = require("serialport");
const rslv = require("path").resolve;

function PortUtil() {
	this.__portinstance = null;
}

PortUtil.prototype.start = function($happn) {
	const { data } = $happn.exchange;
	const { error: logError } = $happn.log;

	let getConfig = () =>
		new Promise((resolve, reject) => {
			data.get("persist/configuration", null, (err, resp) => {
				if (err) return reject(err);

				resolve(resp);
			});
		});

	const startAsync = async () => {
		this.config = await getConfig();
		if (!this.config) return logError("NO CONFIGURATION FOUND FOR PORT");

		//return console.log(this.config);
	};

	return startAsync();
};

PortUtil.prototype.getInstance = function($happn) {
	const { error: logError, info: logInfo } = $happn.log;

	if (!this.config) return logError("COMM PORT NOT SET");

	const { inputSource } = this.config;

	if (inputSource.comPort === "") return logError("COMM PORT NOT SET");
	let startPort = () =>
		new Promise((resolve, reject) => {
			if (process.env.NODE_ENV !== "test") {
				this.__portinstance = new SerialPort(
					inputSource.comPort,
					{
						baudRate: inputSource.baudRate,
						rtscts: true,
						autoOpen: true
					},
					err => {
						if (err) {
							logError(err);
							return reject(err);
						}

						resolve();
					}
				);
			} else {
				this.__portinstance = new SerialPort(
					rslv("../../ttyV1"),
					{
						baudRate: inputSource.baudRate,
						autoOpen: true
					},
					err => {
						if (err) {
							logError(err);
							return reject(err);
						}

						resolve();
					}
				);
			}
		});

	let getInstance = async () => {
		if (!this.__portinstance) {
			try {
				await startPort();
				logInfo(`returning new port instance... :${inputSource.comPort}`);
			} catch (err) {
				logError("Error creating port...", err);
				return Promise.reject(err);
			}
		} else {
			logInfo("returning existing port instance...");
		}
		return this.__portinstance;
	};

	return getInstance();
};

// eslint-disable-next-line no-unused-vars
PortUtil.prototype.getList = function($happn) {
	const getListAsync = async () => {
		return SerialPort.list();
	};

	return getListAsync();
};

PortUtil.prototype.startPort = function($happn) {
	const { error: logError } = $happn.log;
	const startPortAsync = async () => {
		await this.__portinstance.open(err => {
			if (err) logError("portError", err);
		});
	};

	return startPortAsync();
};

PortUtil.prototype.stopPort = function($happn) {
	const { error: logError } = $happn.log;

	const stopPortAsync = async () => {
		if (this.__portinstance) {
			await this.__portinstance.close(err => {
				if (err) logError("portError", err);
			});
		}
	};

	return stopPortAsync();
};

module.exports = PortUtil;
