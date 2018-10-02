/**
 * Created by grant on 2016/07/19.
 */

function PortUtil() {
	this.__instance = null;
}

PortUtil.prototype.getInstance = function($happn) {
	var self = this;
	var config = $happn.config;

	return new Promise((resolve, reject) => {
		if (self.__instance == null) {
			$happn.exchange.messageReader
				.getReadFunc({ startDelimiter: "AAAA" })
				.then(function(result) {
					var SerialPort = require("serialport");

					self.__instance = new SerialPort(config.port, {
						baudRate: parseInt(config.baudRate),
						parser: result,
						autoOpen: true
					});

					$happn.log.info(
						"returning new port instance... :: PORT NUMBER " + config.port
					);
					resolve(self.__instance);
				})
				.catch(function(err) {
					reject(err);
				});
		} else {
			//$happn.log.info('returning existing port instance...');
			resolve(self.__instance);
		}
	});
};

module.exports = PortUtil;
