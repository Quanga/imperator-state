/**
 * Created by grant on 2016/06/22.
 */

function SerialPortService() {}

SerialPortService.prototype.initialise = function ($happn) {
	$happn.log.info('initialising Serial Port Service...');

	var getSerialPortInstance = () => {
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

	var attachMessageReceiveHandler = (port) => {
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
				resolve();
			})
			.catch((err) => {
				$happn.log.error('NO SERIAL PORT OR MESSAGE HANDLER ATTACHED', err);
				reject(err);
			});
	});
};


SerialPortService.prototype.sendMessage = function ($happn, message, callback) {
	//$happn.log.info('writing to port......');

	$happn.exchange.portUtil.getInstance()
		.then(function (port) {

			//$happn.log.info('outgoing message: ' + message);
			var buf = new Buffer(message); // message is an array

			port.write(buf, function (err) {
				if (err) {
					$happn.log.error('sendMessage error 2', err);
					callback(err);
				} else {
					//$happn.log.info('message sent');
					callback();
				}
			});

			// TODO: this callback should be removed, but there seems to be an issue where the callback from
			// port.write is not being returned...
			//callback();
		})
		.catch(function (err) {
			$happn.log.error('sendMessage error 1', err);
			callback(err);
		});
};

module.exports = SerialPortService;