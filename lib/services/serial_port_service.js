function SerialPortService() {
	this.status = {
		serviceStatus: "STOPPED",
		portStatus: "STOPPED",
		pipeStatus: "STOPPED",
		port: null
	};

	this.port = null;
	this.path = "state/SerialPortService/";
}

SerialPortService.prototype.setStatus = function($happn, payload) {
	const { app } = $happn.exchange;

	this.status = { ...this.status, ...payload };
	app.setAppInfo(this.status, this.path);
};
/***
 * @summary Async function that initialises the port, attaches the parser pipe and points the pipe
 * to the message handler for processing to the queue
 * @param $happn
 */
SerialPortService.prototype.initialise = function($happn) {
	const AeceParser = require("../pipes/aece_readline");
	const { info: logInfo, error: logError } = $happn.log;
	const { portUtil, messageHandler } = $happn.exchange;
	logInfo("Initializing Serial Port Service..............");

	let initailizeAsync = async () => {
		try {
			this.port = await portUtil.getInstance();

			if (this.port !== undefined) {
				const { settings } = this.port;
				this.status.port = {
					path: this.port.path,
					baudRate: settings.baudRate,
					dataBits: settings.dataBits,
					parity: settings.parity,
					stopBits: settings.stopBits
				};

				this.setStatus($happn, {});
				this.parser = this.port.pipe(
					new AeceParser({ delimiter: Buffer.from("AAAA", "hex") })
				);

				this.parser.on("data", async msg => {
					this.setStatus($happn, { pipeStatus: `RECEIVING: ${msg}` });
					await messageHandler.MessageReceiveHandler(msg);
				});

				this.parser.on("error", err => {
					this.setStatus($happn, { pipeStatus: `ERROR: ${err}` });
					logError(`parser - error ${err}`);
				});

				this.port.on("open", () => {
					this.setStatus($happn, { portStatus: "OPEN" });
				});

				this.port.on("error", err => {
					this.setStatus($happn, { portStatus: `${err}` });
				});

				this.port.on("close", () => {
					this.setStatus($happn, { portStatus: `CLOSED` });
				});

				this.setStatus($happn, {
					serviceStatus: "STARTED",
					portStatus: "OPEN",
					pipeStatus: "STARTED"
				});
				logInfo("Initializing Serial Port Service..............PASSED");
			} else {
				this.setStatus($happn, { serviceStatus: `FAILED` });

				logError("Initializing Serial Port Service..............FAILED");
			}
		} catch (err) {
			this.setStatus($happn, { serviceStatus: `FAILED ${err}` });
			logError("Initializing Serial Port Service..............FAILED", err);
			//return Promise.reject(err);
		}
	};

	return initailizeAsync();
};

SerialPortService.prototype.stopService = function($happn) {
	let stopServiceAsync = async () => {
		const { portUtil } = $happn.exchange;
		this.port = await portUtil.stopInstance();
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
