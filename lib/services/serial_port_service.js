function SerialPortService() {}
const Readline = require("@serialport/parser-readline");
//const Ready = require("@serialport/parser-ready");

/***
 * @summary Async function that initialises the port, attaches the parser pipe and points the pipe
 * to the message handler for processing to the queue
 * @param $happn
 */
SerialPortService.prototype.initialise = function($happn) {
	const { info, error } = $happn.log;
	const { portUtil, messageHandler } = $happn.exchange;

	let initailizeAsync = async () => {
		try {
			$happn.log.info("Initializing Serial Port Service..............STARTED");

			let port = await portUtil.getInstance();

			// let parser = port.pipe(
			// 	new Readline({ delimiter: Buffer.from("AAAA", "hex"), encoding: "hex" })
			// );

			let parser = port.pipe(
				new Readline({ delimiter: Buffer.from("AAAA", "hex"), encoding: "hex" })
			);
			// let parser = port.pipe(
			// 	new Ready({ delimiter: Buffer.from("AAAA", "hex") })
			// );

			//let parser = port.pipe(new Readline());

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
				// console.log(
				// 	`openened in happner server+ ${JSON.stringify(port.isOpen)}`
				// );
			});

			port.on("error", err => {
				console.log(`error in happner server  ${err}`);
			});

			port.on("close", err => {
				console.log(`port closing  ${err}`);
			});

			info("Initializing Serial Port Service..............PASSED");
			//return result;
		} catch (err) {
			console.log("port error", err);
			error("Initializing Serial Port Service..............FAILED", err);
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
