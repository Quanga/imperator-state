/**
 * Created by grant on 2016/06/22.
 */

function SerialPortService() {}

SerialPortService.prototype.initialise = function($happn) {
	$happn.log.info("Initializing Serial Port Service..............STARTED");

	let getSerialPortInstance = async () => {
		try {
			let inst = await $happn.exchange.portUtil.getInstance($happn);
			return inst;
		} catch (err) {
			$happn.log.error("Could not get Port Instance");
		}
	};

	let attachMHAsync = async port => {
		try {
			let handler = await $happn.exchange.messageHandler.createMessageReceiveHandler();
			let result = await port.on("data", handler);
			return result;
		} catch (err) {
			$happn.log.error("Could not attach Message Handler", err);
		}
	};

	let init = async () => {
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
	};

	return init();
};

SerialPortService.prototype.sendMessage = function($happn, message) {
	let sendMess = async () => {
		try {
			let port = await $happn.exchange.portUtil.getInstance($happn);

			$happn.log.info("outgoing message: " + message);
			let buf = new Buffer(message); // message is an array
			port.write(buf, function(err) {
				if (err) {
					$happn.log.error("Error on write: ", err.message);
					throw new Error("write error");
				}
			});
			$happn.log.info("message sent");
		} catch (err) {
			$happn.log.error("sendMessage error", err);
		}
	};
	return sendMess();
};

module.exports = SerialPortService;
