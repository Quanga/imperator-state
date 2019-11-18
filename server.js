const pmx = require("@pm2/io");

if (process.env.NODE_ENV === "test") {
	require("dotenv").config();
}

this.mesh;

/**
 * @module Server
 * @function Server
 * @summary Entry Point
 */
const Server = async () => {
	if (process.env.EDGE_INSTANCE_NAME === undefined) {
		console.error(
			"Environemnt Variables not loaded.... please check NODE_ENV and how you are injecting your variables",
		);
		return process.exit(1);
	}

	start();
};

const stop = () =>
	new Promise((resolve, reject) => {
		this.mesh
			.stop(
				{
					kill: true,
					wait: 10000,
					exitCode: 2,
					reconnect: false,
				},
				(err, data) => {
					if (err) console.log(err);
					console.log("stopped", data);
					return reject(err);
				},
			)
			.then(() => resolve());
	});

/**
 * @function start
 */
const start = () => {
	pmx.action("stop", reply => {
		stop()
			.then(() => reply({ done: "stopping" }))
			.catch(err => reply({ err: err }));
	});

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

Server();

/**
 * @summary Dependancy Injection of the Happner Framework
 * @typedef $happn
 * @type {object}
 */
