//require("dotenv").config("../../.env");
const { spawn } = require("child_process");
var path = require("path");
var libFolder = path.resolve(__dirname, "../../");
const killport = require("kill-port");
const find = require("find-process");
const emitter = require("events").EventEmitter;

class ServerHelper {
	constructor() {
		this.serverProc = null;
		this.defaults = {};
		this.nodeEnv = process.env.NODE_ENV;
		this.emitter = new emitter();
	}

	async startServer(args) {
		try {
			process.env.NODE_ENV = "test";
			console.log("Change NODE_ENV to test");

			const portCheck = await find("port", 55000);

			if (!portCheck.length) {
				console.log("port 55000 is free now");
				//this.serverProc;
			} else {
				console.log(`${portCheck[0].pid} is listening port 55000`);
				await killport(55000);
			}

			await this.spawnServer(args);
		} catch (err) {
			console.log(err);
		}
	}

	async spawnServer(args = "") {
		try {
			if (this.serverProc !== null) return;

			console.log(":: STARTING SERVER............");

			this.serverProc = await spawn(
				"node",
				[path.join(libFolder, "server.js"), args],
				this.defaults
			);

			await new Promise((resolve, reject) => {
				this.serverProc.stdout.on("data", data => {
					console.log(`${data}`);
					this.emitter.emit("data", data);
					if (
						data.toString().match(/STARTUP COMPLETE/) ||
						data.toString().match(/SERVER SHUTDOWN/)
					) {
						resolve();
					}
				});

				this.serverProc.on("error", err => {
					console.log("SERVER ERROR", err);
					reject(err);
				});

				this.serverProc.on("exception", function(err) {
					console.log("SERVER EXCEPTION", err);
					reject(err);
				});
			});
		} catch (err) {
			console.log(err);
		}
	}

	async stopServer() {
		console.log("STOPPING SERVER");

		process.env.NODE_ENV = this.nodeEnv;
		//await this.serverProc.kill("SIGKILL");
		await this.serverProc.kill("SIGTERM");
	}
}

module.exports = ServerHelper;
