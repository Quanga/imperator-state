const { spawn } = require("child_process");
var path = require('path');
var libFolder = path.resolve(__dirname, '../../');
require('dotenv').config();





function ServerHelper() {
	this.__serverProc = null;
}
const defaults = {
	//cwd: "../../",
	//env: process.env
};

ServerHelper.prototype.startServer = function () {
	return new Promise((resolve, reject) => {
		console.log(":: STARTING SERVER............");
		if (this.__serverProc === null) {
			this.__serverProc = spawn('node', [path.join(libFolder, 'server.js')], defaults);
			//this.__serverProc.on('data', (data) => { console.log(data); });
			this.__serverProc.stdout.on('data', (data) => {
				console.log(`${data}`);
				if (data.toString().match(/STARTUP COMPLETE/)) {
					resolve();
				}
			});


			this.__serverProc.on("message", msg => {
				console.log("server process message:", msg);
			});

			this.__serverProc.on("error", err => {
				console.log(err);
				reject(err);
			});

			this.__serverProc.on("exception", function (err) {
				console.log(err);
			});
		}

	});
};

ServerHelper.prototype.stopServer = function () {
	return new Promise(resolve => {
		console.log(":: STOPPING TEST SERVER....");

		try {
			this.__serverProc.kill();
			resolve();
		} catch (err) {
			console.log(err);
			resolve();
		}
	});
};

module.exports = ServerHelper;
