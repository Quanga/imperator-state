const { spawn } = require("child_process");
var path = require("path");
var libFolder = path.resolve(__dirname, "../../");
require("dotenv").config();
const killport = require("kill-port");

function ServerHelper() {
	this.__serverProc = null;
}
const defaults = {
	//cwd: "../../",
	//env: process.env
};

// if (data.toString().match(/STARTUP COMPLETE/)) {
// 	resolve();
// }

const find = require("find-process");

ServerHelper.prototype.startServer = function() {
	return new Promise((resolve, reject) => {
		find("port", 55000)
			.then(function(list) {
				if (!list.length) {
					console.log("port 55000 is free now");
				} else {
					killport(55000);
					console.log("%s is listening port 55000", list[0].pid);
				}
			})
			.then(() => {
				console.log(":: STARTING SERVER............");
				if (this.__serverProc === null) {
					this.__serverProc = spawn(
						"node",
						[path.join(libFolder, "server.js")],
						defaults
					);
					//this.__serverProc.on('data', (data) => { console.log(data); });
					this.__serverProc.stdout.on("data", data => {
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

					this.__serverProc.on("exception", function(err) {
						console.log(err);
					});
				}
			});
	});
};

ServerHelper.prototype.stopServer = function() {
	return new Promise((resolve, reject) => {
		console.log(":: STOPPING TEST SERVER....");

		try {
			//this.__serverProc.kill();
			this.__serverProc.kill("SIGKILL");
			resolve();
		} catch (err) {
			console.log(err);
			reject(err);
		}
	});
};

module.exports = ServerHelper;
