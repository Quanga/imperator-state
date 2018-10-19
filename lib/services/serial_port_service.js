function SerialPortService() {}
//const Readline = require("@serialport/parser-readline");
const AeceParser = require("../pipes/aece_readline");

/***
 * @summary Async function that initialises the port, attaches the parser pipe and points the pipe
 * to the message handler for processing to the queue
 * @param $happn
 */
SerialPortService.prototype.initialise = function($happn) {
	const { info: logInfo, error: logError } = $happn.log;
	const { portUtil, messageHandler } = $happn.exchange;

	let initailizeAsync = async () => {
		try {
			logInfo("Initializing Serial Port Service..............STARTED");

			let port = await portUtil.getInstance();

			let parser = port.pipe(
				new AeceParser({ delimiter: Buffer.from("AAAA", "hex") })
			);

			parser.on("data", async message => {
				console.log(`parser - ${message.toString("hex")}`);
				await messageHandler.MessageReceiveHandler(message).then(() => {});
			});

			parser.on("error", error => {
				console.log(`parser - error ${error}`);
			});

			port.on("data", message => {
				console.log(`data ---------- ${message.toString("hex")}`);
			});

			port.on("open", () => {
				logInfo(`Serial Port is open and listening`);
			});

			port.on("error", err => {
				logError(`error in happner server  ${err}`);
			});

			port.on("close", err => {
				logInfo(`port closing  ${err}`);
			});

			logInfo("Initializing Serial Port Service..............PASSED");
		} catch (err) {
			logError("Initializing Serial Port Service..............FAILED", err);
		}
	};

	return initailizeAsync();
};

/***
 * @summary Async function that sends a message to the serialport from the transmission service
 * @param $happn
 * @param message - the message to send in hex format
 */
SerialPortService.prototype.sendMessage = function($happn, message) {
	const { portUtil } = $happn.exchange;
	const { info, error } = $happn.log;

	let sendMessageAsync = async () => {
		try {
			let port = await portUtil.getInstance($happn);
			info("outgoing message: " + message);
			let buf = Buffer.from(message, "hex"); // message is an array
			port.write(buf, function(err) {
				if (err) {
					throw new Error("write error");
				}
			});

			info("message sent");
			//port.drain();
		} catch (err) {
			error("sendMessage error", err);
		}
	};
	return sendMessageAsync();
};

module.exports = SerialPortService;
