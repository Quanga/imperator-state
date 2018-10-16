/**
 * Created by grant on 2016/07/19.
 */

function PortUtil() {
	this.__portinstance = null;
}

PortUtil.prototype.getInstance = function($happn) {
	const SerialPort = require("serialport");

	const config = $happn.config;
	const self = this;

	let getInstance = async () => {
		try {
			if (self.__portinstance === null) {
				try {
					let port = new SerialPort(config.port, {
						baudRate: parseInt(config.baudRate),
						//parser: result,
						//dataBits: 8,
						//parity: "none",
						//stopBits: 1,
						autoOpen: true
						//rtscts: true
						// dtr: true,
						// rts: true
						//flowMode: true
						// bindingOptions: {
						// 	vmin: 0,
						// 	vtime: 0
						// }
					});
					//self.__instance.setEncoding("binary");
					//console.log(await SerialPort.list());

					$happn.log.info(
						"returning new port instance... :: PORT NUMBER " + config.port
					);
					// let waitForPorts = async () => {
					// 	try {
					// 		self.__instance.open();
					// 		self.__instance.flush();
					// 	} catch (err) {
					// 		setTimeout(waitForPorts, 100);
					// 	}
					// };
					// await waitForPorts();

					// self.__instance.on("open", console.log);

					// self.__instance.on("data", function(data) {
					// 	console.log(`data --------- ${data.toString("hex")}`);
					// 	//self.__instance.flush();
					// });

					// self.__instance.on("error", console.log);

					// self.__instance.on("close", console.log);

					//console.log("serial port" + JSON.stringify(self.__instance));
					self.__portinstance = port;
					return port;
				} catch (err) {
					$happn.log.error("Error creating port...", err);
				}
			} else {
				$happn.log.info("returning existing port instance...");
				return self.__portinstance;
			}
		} catch (err) {
			$happn.log.error("Error creating port...", err);
		}
	};
	return getInstance();
};

module.exports = PortUtil;
