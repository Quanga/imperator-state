/**
 * Created by grant on 2016/07/19.
 */

function PortUtil() {
	this.__instance = null;
}

PortUtil.prototype.getInstance = function ($happn) {
	const self = this;
	const config = $happn.config;

	const openPort = (result) => {
		return new Promise((resolve, reject) => {
			var SerialPort = require("serialport");

			let sp =
				new SerialPort(config.port, {
					baudRate: parseInt(config.baudRate),
					parser: result,
					autoOpen: true
				}, function (err) {
					if (err) {
						reject(err);
					} else {
						resolve(sp);
					}
				});
		});
	};

	return new Promise((resolve, reject) => {
		if (self.__instance == null) {
			return $happn.exchange.messageReader.getReadFunc()
				.then((result) => {
					return openPort(result);
				})
				.then((newPort) => {
					self.__instance = newPort;

				})
				.then(() => {
					$happn.log.info('Initializing Serial Port Util..............PORT NUMBER ' + config.port);
					resolve(self.__instance);
				})
				.catch((err) => {
					$happn.log.error('Initializing Serial Port Util..............FAIL ' + err.message);
					reject(err);
				});
		} else {
			$happn.log.info('Returning Open Port..............PORT NUMBER ' + config.port);
			resolve(self.__instance);
		}
	});
};

module.exports = PortUtil;