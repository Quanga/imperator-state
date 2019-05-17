/* eslint-disable no-unused-vars */

function SerialPortService() {
	this.port = null;
}

SerialPortService.prototype.checkPort = function($happn, port) {
	const { portUtil } = $happn.exchange;
	const { error: logError } = $happn.log;

	const checkAsync = async () => {
		let localPorts = await portUtil.getLocalPorts();
		localPorts = localPorts.map(x => x.comName);
		const portIndex = localPorts.findIndex(x => x === port);

		if (portIndex === -1) {
			logError("Incorrect Port in configuration --Available ports", localPorts);
			return false;
		}

		return true;
	};

	return checkAsync();
};

SerialPortService.prototype.start = function($happn) {
	const { stateService } = $happn.exchange;

	return new Promise((resolve, reject) => {
		stateService.updateState({ service: $happn.name, state: "PENDING" });

		resolve();
	});
};

/***
 * @summary Async function that initialises the port, attaches the parser pipe and points the pipe
 * to the message handler for processing to the queue
 * @param $happn
 */
SerialPortService.prototype.initialise = function($happn) {
	const { info: logInfo, error: logError } = $happn.log;
	const AeceParser = require("../pipes/aece_readline");

	const { portUtil, messageHandler, stateService } = $happn.exchange;

	logInfo("Initializing Serial Port Service..............");

	let initailizeAsync = async () => {
		try {
			const startPort = await portUtil.start();
			if (!startPort) {
				logError("Initializing Serial Port Service..............FAILED");
				return Promise.resolve();
			}

			this.port = await portUtil.getInstance();

			if (!this.port) {
				stateService.updateState({ service: $happn.name, state: "FAILED" });
				logError("Initializing Serial Port Service..............FAILED");
				logError("PORT FAILED TO INITIALIZE");
				return Promise.resolve();
			}

			stateService.updateState({ service: $happn.name, state: "STARTED" });

			this.parser = this.port.pipe(
				new AeceParser({ delimiter: Buffer.from("AAAA", "hex") })
			);

			this.port.on("data", msg => {
				//console.log(msg);
			});

			this.parser.on("data", async msg => {
				//portService.setComponentStatus({ pipeStatus: `RECEIVING: ${msg}` });
				//console.log("receiving", msg);
				await messageHandler.MessageReceiveHandler(msg);
			});

			this.parser.on("error", err => {
				stateService.updateState({ service: $happn.name, state: "ERROR" });
				logError(`parser - error ${err}`);
			});

			this.port.on("open", () => {
				stateService.updateState({ service: $happn.name, state: "OPEN" });
			});

			this.port.on("error", err => {
				stateService.updateState({ service: $happn.name, state: "ERROR" });
			});

			this.port.on("close", () => {
				stateService.updateState({ service: $happn.name, state: "CLOSED" });
			});

			logInfo("Initializing Serial Port Service..............PASSED");
		} catch (err) {
			stateService.updateState({ service: $happn.name, state: "ERROR" });
			logError("Initializing Serial Port Service..............FAILED", err);
			return Promise.reject(err);
		}
	};

	return initailizeAsync();
};

SerialPortService.prototype.stopService = function($happn) {
	let stopServiceAsync = async () => {
		const { portUtil, app } = $happn.exchange;

		app.setAppServiceState({
			service: this.service,
			serviceStatus: "STARTED"
		});
		this.port = await portUtil.stopPort();
	};

	return stopServiceAsync();
};

/***
 * @summary Async function that sends a message to the serialport from the transmission service
 * @param $happn
 * @param message - the message to send in hex format
 */
SerialPortService.prototype.sendMessage = function($happn, message) {
	const { portUtil } = $happn.exchange;
	const { info: logInfo, error: logError } = $happn.log;

	let sendMessageAsync = async () => {
		try {
			let port = await portUtil.getInstance();
			logInfo("outgoing message: " + message);
			let buf = Buffer.from(message, "hex"); // message is an array
			port.write(buf, function(err) {
				if (err) {
					throw new Error("write error");
				}
			});

			logInfo("message sent");
		} catch (err) {
			logError("sendMessage error", err);
		}
	};
	return sendMessageAsync();
};

module.exports = SerialPortService;
