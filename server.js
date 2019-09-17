/**
 * @category System
 * @module server
 */

if (process.env.NODE_ENV === "test") {
	require("dotenv").config();
}

this.mesh;

/**
 * @function Server
 * @summary Entry Point
 */
const Server = async () => {
	if (process.env.EDGE_INSTANCE_NAME === undefined) {
		console.error(
			"Environemnt Variables not loaded.... please check NODE_ENV and how you are injecting your variables"
		);
		return process.exit(1);
	}

	if (process.argv[2] === "reset" && process.argv[3] === "--hard") {
		await hardRest();
	}

	start();
};
// process.stdin.resume();

// process.on("SIGTERM" () => {
// 	console.info("SIGTERM signal received.");
// 	 stop();
// });

process.on("SIGINT", () => {
	console.info("SIGINT signal received.");
	this.mesh
		.stop({
			reconnect: false
		})
		.then(() => console.warn("stopped"));
});

// const stop = () =>
// 	new Promise(resolve => {
// 		this.mesh
// 			.stop(
// 				{
// 					kill: true,
// 					wait: 10000,
// 					exitCode: 1,
// 					reconnect: false
// 				},
// 				data => {
// 					console.warn("stopped", data);
// 				}
// 			)
// 			.then(() => resolve());
// 	});

/**
 *
 * @function start
 */
const start = () => {
	const Mesh = require("happner-2");
	this.mesh = new Mesh();

	const Config = require("./config.js");
	const config = new Config().configuration;

	return this.mesh.initialize(config, err => {
		if (err) {
			console.error(err.stack || err.toString());
			process.exit(1);
		}

		this.mesh.start(err => {
			if (err) {
				console.error(err.stack || err.toString());
				process.exit(2);
			}
		});
	});
};

const hardRest = async () => {
	const fs = require("fs");
	const path = require("path");
	const os = require("os");
	var yesno = require("yesno");

	console.warn("STARTED WITH HARD RESET ARG");

	const ok = await yesno.askAsync(
		"Are you sure you want to delete the database file? (yes/no)?",
		false
	);

	if (ok) {
		let file;
		if (process.env.EDGE_DB) {
			file = path.resolve(os.homedir(), "./edge/db/", process.env.EDGE_DB);
		} else {
			console.log("EDGE_DB not set");
			process.exit(2);
		}

		const deleteFile = await new Promise(resolve => {
			fs.unlink(file, err => {
				if (err) {
					resolve("DATABASE FILE NOT FOUND - ", err.path);
				}

				resolve("DATABASE FILE REMOVED");
			});
		});

		console.log(deleteFile);
		return process.exit(1);
	} else {
		console.log("Aborted reset.");
		return process.exit(1);
	}
};

Server();

/**
 * @summary Dependancy Injection of the Happner Framework
 * @typedef $happn
 * @type {object}
 */
