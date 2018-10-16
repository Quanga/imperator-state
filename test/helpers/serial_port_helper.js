var SerialPort = require("serialport");
var spawn = require("child_process").spawn;

function SerialPortHelper() {
	require("dotenv").config({ path: "./.env" });

	// rewrite the ports to match the virtual ports
	//process.env.TEST_OUTGOING_PORT = rslv("./ttyV0");
	//process.env.ROUTER_SERIAL_PORT = rslv("./ttyV1");
}

SerialPortHelper.prototype.initialise = function() {
	var self = this;

	return new Promise((resolve, reject) => {
		console.log(":: CREATING SERIAL CONNECTION....");

		self.__socat = spawn(
			"socat",
			[
				"-d",
				"-d",
				"pty,raw,echo=0,link=" + process.env.TEST_OUTGOING_PORT,
				"pty,raw,echo=0,link=" + process.env.ROUTER_SERIAL_PORT
			],
			{ detached: true, stdio: "ignore" }
		);

		self.__socat.on("open", result => {
			console.log("socat opened: " + result);
			//resolve();
		});

		self.__socat.on("close", code => {
			console.log("socat exited with code", code);
		});

		self.__socat.on("error", err => {
			console.log(err);
			reject(err);
		});

		setTimeout(() => {
			resolve();
		}, 1000);
	});
};

SerialPortHelper.prototype.sendMessage = function(message) {
	return new Promise(function(resolve, reject) {
		let serialPort = new SerialPort(process.env.TEST_OUTGOING_PORT, {
			baudRate: parseInt(process.env.ROUTER_BAUD_RATE),
			autoOpen: false
		});

		//serialPort.on('data', function (data) {
		//    console.log('Data >>>>> :', data);
		//});
		//

		serialPort.on("error", function(err) {
			console.log("port error:", err);
		});

		serialPort.on("close", function() {
			//console.log("port closed!");
		});

		serialPort.on("open", function() {
			//console.log("port open!");
		});

		serialPort.open(function(err) {
			if (err) return reject(err);

			console.log("## SENDING MESSAGE: " + message);
			var buffer = new Buffer(message, "hex");

			serialPort.write(buffer, function(err) {
				if (err) {
					console.log("write error: ", err);
					return reject(err);
				}

				//console.log("written....");
				serialPort.drain(function(err) {
					if (err) return reject(err);

					//console.log("drained....");

					serialPort.close(function(err) {
						if (err) return reject(err);

						setTimeout(() => {
							resolve();
						}, 100);
					});
				});
			});

			//make sure the target port has received it
		});
	});
};

module.exports = SerialPortHelper;
