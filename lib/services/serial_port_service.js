/**
 * Created by grant on 2016/06/22.
 */

function SerialPortService() {}

SerialPortService.prototype.initialise = function ($happn) {
	$happn.log.info('Initializing Serial Port Service..............STARTED');

	let getSerialPortInstance = () => {
		return new Promise((resolve, reject) => {
			return $happn.exchange.portUtil.getInstance()
				.then((inst) => {
					resolve(inst);
				}).catch((err) => {
					$happn.log.error('Could not get Port Instance');
					reject(err);
				});
		});
	};

	let attachMessageReceiveHandler = (port) => {
		return new Promise((resolve, reject) => {
			return $happn.exchange.messageHandler.createMessageReceiveHandler()
				.then((handler) => {
					port.on("data", handler);
					resolve();
				}).catch((err) => {
					$happn.log.error('Could not attach Message Handler', err);
					reject(err);
				});
		});
	};


	return new Promise((resolve, reject) => {
		return getSerialPortInstance()
			.then((prt) => {
				return attachMessageReceiveHandler(prt);
			})
			.then(() => {
				$happn.log.info('Initializing Serial Port Service..............PASSED');
				resolve();
			})
			.catch((err) => {
				$happn.log.error('Initializing Serial Port Service..............FAILED', err);
				reject(err);
			});
	});
};


SerialPortService.prototype.sendMessage = function ($happn, message) {
	$happn.log.info('outgoing message: ' + message);

	return new Promise((resolve, reject) => {
		$happn.exchange.portUtil.getInstance()
			.then((port) => {
				$happn.log.info('outgoing message: ' + message);
				var buf = new Buffer(message); // message is an array

				return port.write(buf, function (err) {
					if (err) {
						$happn.log.error('sendMessage error 2', err);
						reject(err);
					} else {
						$happn.log.info('message sent');
						resolve();
					}
				});
			})
			.catch((err) => {
				$happn.log.error('sendMessage error 1', err);
				reject(err);
			});
	});
};

module.exports = SerialPortService;