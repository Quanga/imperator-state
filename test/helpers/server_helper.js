require("dotenv").config();
const { spawn } = require("child_process");
var path = require("path");
var libFolder = path.resolve(__dirname, "../../");
const killport = require("kill-port");
const find = require("find-process");

class ServerHelper {
	constructor() {
		this.__serverProc = null;
		this.defaults = {};
		this.nodeEnv = process.env.NODE_ENV;
	}

	async startServer() {
		process.env.NODE_ENV = "test";
		const portCheck = await find("port", 55000);

		if (!portCheck.length) {
			console.log("port 55000 is free now");
			this.__serverProc;
		} else {
			console.log("%s is listening port 55000", portCheck[0].pid);
			await killport(55000);
		}

		await this.spawnServer();
	}

	async spawnServer() {
		if (this.__serverProc !== null) return;

		console.log(":: STARTING SERVER............");

		this.__serverProc = await spawn(
			"node",
			[path.join(libFolder, "server.js")],
			this.defaults
		);

		await new Promise((resolve, reject) => {
			this.__serverProc.stdout.on("data", data => {
				console.log(`${data}`);
				if (data.toString().match(/STARTUP COMPLETE/)) {
					resolve();
				}
			});

			this.__serverProc.on("error", err => {
				console.log("SERVER ERROR", err);
				reject(err);
			});

			this.__serverProc.on("exception", function(err) {
				console.log("SERVER EXCEPTION", err);
				reject(err);
			});
		});
	}

	async stopServer() {
		console.log("STOPPING SERVER");

		process.env.NODE_ENV = this.nodeEnv;
		//await this.__serverProc.kill("SIGKILL");
		await this.__serverProc.kill("SIGTERM");
	}
}

module.exports = ServerHelper;
