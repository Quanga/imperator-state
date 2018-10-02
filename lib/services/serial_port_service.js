/**
 * Created by grant on 2016/06/22.
 */

function SerialPortService() {}

SerialPortService.prototype.initialise = function($happn) {
	$happn.log.info("Initializing Serial Port Service..............STARTED");

	async function getSerialPortInstance() {
		try {
			let inst = await $happn.exchange.portUtil.getInstance($happn);
			return inst;
		} catch (err) {
			$happn.log.error("Could not get Port Instance");
		}
	}

	async function attachMHAsync(port) {
		try {
			let handler = await $happn.exchange.messageHandler.createMessageReceiveHandler();
			let handlerOn = await port.on("data", handler);
			return handlerOn;
		} catch (err) {
			$happn.log.error("Could not attach Message Handler", err);
		}
	}

	async function init() {
		try {
			let portInst = await getSerialPortInstance();
			await attachMHAsync(portInst);
			$happn.log.info("Initializing Serial Port Service..............PASSED");
		} catch (err) {
			$happn.log.error(
				"Initializing Serial Port Service..............FAILED",
				err
			);
		}
	}

	return init();
};

SerialPortService.prototype.sendMessage = function($happn, message) {
	$happn.log.info("outgoing message: " + message);

	async function sendMess() {
		try {
			let port = await $happn.exchange.portUtil.getInstance($happn);

			$happn.log.info("outgoing message: " + message);
			let buf = new Buffer(message); // message is an array
			port.write(buf, function(err) {
				if (err) {
					$happn.log.error("Error on write: ", err.message);
				}
			});
			$happn.log.info("message sent");
		} catch (err) {
			$happn.log.error("sendMessage error 2", err);
		}
	}
	return sendMess();
};

module.exports = SerialPortService;
