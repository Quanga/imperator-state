/* eslint-disable no-unused-vars */
function SerialPortService() {
	this.service = "SerialPort";
	this.serviceStatus = "STOPPED";

	this.componentState = {
		portStatus: "STOPPED",
		pipeStatus: "STOPPED",
		port: null
	};
	this.port = null;
}

SerialPortService.prototype.start = function($happn) {
	const { app } = $happn.exchange;
	return new Promise((resolve, reject) => {
		app.setAppServiceState({ service: this.service, serviceStatus: "PENDING" });
		resolve();
	});
};

/***
 * @summary Async function that initialises the port, attaches the parser pipe and points the pipe
 * to the message handler for processing to the queue
 * @param $happn
 */
SerialPortService.prototype.initialise = function($happn) {
	const AeceParser = require("../pipes/aece_readline");
	const { info: logInfo, error: logError } = $happn.log;
	const { portUtil, messageHandler, portService, app } = $happn.exchange;
	logInfo("Initializing Serial Port Service..............");

	let initailizeAsync = async () => {
		try {
			this.port = await portUtil.getInstance();

			if (this.port !== undefined) {
				const { settings, path } = this.port;

				app.setAppServiceState({
					service: this.service,
					serviceStatus: "STARTED"
				});

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
					app.setAppServiceState({
						service: this.service,
						serviceStatus: "FAILED"
					});
					logError(`parser - error ${err}`);
				});

				this.port.on("open", () => {
					app.setAppServiceState({
						service: this.service,
						serviceStatus: "STARTED"
					});
				});

				this.port.on("error", err => {
					app.setAppServiceState({
						service: this.service,
						serviceStatus: "FAILED"
					});
				});

				this.port.on("close", () => {
					app.setAppServiceState({
						service: this.service,
						serviceStatus: "CLOSED"
					});
				});

				logInfo("Initializing Serial Port Service..............PASSED");
			} else {
				app.setAppServiceState({
					service: this.service,
					serviceStatus: "FAILED"
				});
				logError("Initializing Serial Port Service..............FAILED");
			}
		} catch (err) {
			app.setAppServiceState({
				service: this.service,
				serviceStatus: `FAILED ${err}`
			});
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
