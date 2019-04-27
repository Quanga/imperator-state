/* eslint-disable no-unused-vars */
function SerialPortService() {
	this.componentState = {
		name: "Serialport Service",
		path: "service/SerialportService",
		index: 1,
		type: "Input Control",
		serviceStatus: "STOPPED",
		portStatus: "STOPPED",
		pipeStatus: "STOPPED",
		port: null
	};
	this.port = null;
}

SerialPortService.prototype.start = function($happn) {
	const { portService } = $happn.exchange;
	return new Promise((resolve, reject) => {
		portService.setComponentStatus({ serviceStatus: "STARTED" });
		resolve();
	});
};

SerialPortService.prototype.setComponentStatus = function($happn, payload) {
	const { app } = $happn.exchange;
	const { componentState } = this;

	const update = { ...componentState, ...payload };
	app.setAppInfo(update, componentState.path);
	this.componentState = update;
};

/***
 * @summary Async function that initialises the port, attaches the parser pipe and points the pipe
 * to the message handler for processing to the queue
 * @param $happn
 */
SerialPortService.prototype.initialise = function($happn) {
	const AeceParser = require("../pipes/aece_readline");
	const { info: logInfo, error: logError } = $happn.log;
	const { portUtil, messageHandler, portService } = $happn.exchange;
	logInfo("Initializing Serial Port Service..............");

	let initailizeAsync = async () => {
		try {
			this.port = await portUtil.getInstance();

			if (this.port !== undefined) {
				const { settings, path } = this.port;

				portService.setComponentStatus({
					portStatus: "OPEN",
					port: {
						path: path,
						baudRate: settings.baudRate,
						dataBits: settings.dataBits,
						parity: settings.parity,
						stopBits: settings.stopBits
					}
				});

				this.parser = this.port.pipe(
					new AeceParser({ delimiter: Buffer.from("AAAA", "hex") })
				);

				this.parser.on("data", async msg => {
					portService.setComponentStatus({ pipeStatus: `RECEIVING: ${msg}` });
					await messageHandler.MessageReceiveHandler(msg);
				});

				this.parser.on("error", err => {
					portService.setComponentStatus({ pipeStatus: `ERROR: ${err}` });
					logError(`parser - error ${err}`);
				});

				this.port.on("open", () => {
					portService.setComponentStatus({ portStatus: "OPEN" });
				});

				this.port.on("error", err => {
					portService.setComponentStatus({ portStatus: `${err}` });
				});

				this.port.on("close", () => {
					portService.setComponentStatus({ portStatus: `CLOSED` });
				});

				logInfo("Initializing Serial Port Service..............PASSED");
			} else {
				portService.setComponentStatus({ serviceStatus: `FAILED` });
				logError("Initializing Serial Port Service..............FAILED");
			}
		} catch (err) {
			portService.setComponentStatus({ serviceStatus: `FAILED ${err}` });
			logError("Initializing Serial Port Service..............FAILED", err);
			return Promise.reject(err);
		}
	};

	return initailizeAsync();
};

SerialPortService.prototype.stopService = function($happn) {
	let stopServiceAsync = async () => {
		const { portUtil } = $happn.exchange;
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
