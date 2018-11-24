/**
 * Created by grant on 2016/07/19.
 */

function PortUtil() {
	this.__portinstance = null;
}

PortUtil.prototype.getInstance = function($happn) {
	const SerialPort = require("serialport");
	const { error: logError, info: logInfo } = $happn.log;

	const config = $happn.config;
	const self = this;

	let getInstance = async () => {
		try {
			if (self.__portinstance == null) {
				let port = new SerialPort(config.port, {
					baudRate: 9600,
					autoOpen: true
				});

				self.__portinstance = port;

				logInfo(`returning new port instance... :${config.port}`);
				return port;
			} else {
				logInfo("returning existing port instance...");
				return self.__portinstance;
			}
		} catch (err) {
			logError("Error creating port...", err);
		}
	};

	return getInstance();
};

module.exports = PortUtil;
