var SerialPort = require('serialport');
const rslv = require('path').resolve;
var spawn = require('child_process').spawn;
const os = require('os');


function SerialPortHelper() {

	// rewrite the ports to match the virtual ports
	process.env.TEST_OUTGOING_PORT = rslv('../../ttyV0');
	process.env.ROUTER_SERIAL_PORT = rslv('../../ttyV1');
}

SerialPortHelper.prototype.initialise = function () {

	var self = this;

	return new Promise((resolve, reject) => {

		console.log(':: CREATING SERIAL CONNECTION....');

		self.__socat = spawn('socat', ['-d',
			'-d',
			'pty,raw,echo=0,link=' + process.env.TEST_OUTGOING_PORT,
			'pty,raw,echo=0,link=' + process.env.ROUTER_SERIAL_PORT
		],
		{ detached: true, stdio: 'ignore' });

		if (!self.__socat) {
			console.warn("`socat` is not installed, skipping serial client tests...");
			const installCmd = os.type() === 'Darwin' ? 'brew install socat' : 'sudo apt-get install socat';
			console.warn(`Please run \`${installCmd}\` to enable these tests!`);
			return;
		}

		self.__socat.on('open', result => {
			console.log('socat opened: ' + result);
			//resolve();
		});

		self.__socat.on('close', code => {
			console.log('socat exited with code', code);
		});

		self.__socat.on('error', err => {
			console.log(err);
			reject(err);
		});

		setTimeout(() => {
			resolve();
		}, 2000);
	});
};

SerialPortHelper.prototype.sendMessage = function (message) {
	return new Promise(function (resolve, reject) {
		let serialPort = new SerialPort(process.env.TEST_OUTGOING_PORT, {
			baudRate: parseInt(process.env.ROUTER_BAUD_RATE),
			autoOpen: false
		});

		serialPort.on("error", function (err) {
			console.log("port error:", err);
		});

		serialPort.on("close", function () {
			console.log("port closed!");
		});

		serialPort.on("open", function () {
			console.log("port open!");
		});

		serialPort.open(function (err) {
			if (err) return reject(err);
			var buffer = new Buffer(message, "hex");

			serialPort.write(buffer, function (err) {
				if (err) {
					console.log("write error: ", err);
					return reject(err);
				}

				console.log("sending", buffer.toString("hex"));

				serialPort.drain(function (err) {
					if (err) return reject(err);

					serialPort.close(function (err) {
						if (err) return reject(err);

						setTimeout(() => {
							resolve();
						}, 10);
					});
				});
			});
		});
	});
};

module.exports = SerialPortHelper;
