if (process.env.NODE_ENV === "test") {
	require("dotenv").config();
}
const path = require("path");
const Mesh = require("happner-2");
const config = require(path.resolve(__dirname, "./happner.config"));

/**
 * @module Server
 * @function Server
 * @summary Entry Point
 */
const Server = () => {
	console.log(process.env.MESH_NAME);
	if (process.env.MESH_NAME === undefined) {
		console.error(
			"Environemnt Variables not loaded.... please check NODE_ENV and how you are injecting your variables",
		);
		return process.exit(1);
	}

	start();
};

/**
 * @function start
 */
const start = () => {
	console.log("inside starting");
	this.mesh = new Mesh();

	this.mesh.initialize(config, err => {
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
console.log("starting");
Server();

/**
 * @summary Dependancy Injection of the Happner Framework
 * @typedef $happn
 * @type {object}
 */
