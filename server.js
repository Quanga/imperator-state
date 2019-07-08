//load local .env if this is a testing environment
if (process.env.NODE_ENV === "test") {
	require("dotenv").config();
}

let mesh;
const tcpPortUsed = require("tcp-port-used");

const startServer = async () => {
	if (process.env.EDGE_INSTANCE_NAME === undefined) {
		console.error(
			"Environemnt Variables not loaded.... please check NODE_ENV and how you are injecting your variables"
		);
		return process.exit(1);
	}

	let checkEndpoint = true;

	if (process.env.USE_ENDPOINT === "true") {
		checkEndpoint = await checkForEndpoint();
	}

	if (process.argv[2] === "reset" && process.argv[3] === "--hard") {
		await hardRest();
	}

	if (checkEndpoint) {
		console.log("Endpoint available......connecting");
		return start();
	}

	console.log("Endpoint not available......please check port and ip address");
	return process.exit(1);
};

process.on("SIGTERM", () => {
	console.info("SIGTERM signal received.");
	stop();
});

const checkForEndpoint = () =>
	new Promise(resolve => {
		tcpPortUsed
			.waitUntilUsedOnHost(
				parseInt(process.env.ENDPOINT_PORT, 10),
				process.env.ENDPOINT_IP,
				500,
				4000
			)
			.then(
				() => {
					resolve(true);
				},
				err => {
					resolve(false, err);
				}
			);
	});

const stop = () => {
	mesh.stop(
		{
			kill: true,
			wait: 10000,
			exitCode: 1,
			reconnect: false
		},
		data => {
			console.warn("stopped", data);
		}
	);
};

const start = () => {
	const Mesh = require("happner-2");
	mesh = new Mesh();

	const Config = require("./config.js");
	const config = new Config().config;
	console.log("USING ENDPOINT", config.endpoints);

	return mesh.initialize(config, err => {
		if (err) {
			console.error(err.stack || err.toString());
			process.exit(1);
		}

		mesh.on("endpoint-reconnect-scheduled", evt => {
			console.log("ERROR RECONNECTING", evt.endpointName);
		});

		mesh.on("endpoint-reconnect-successful", evt => {
			console.log("RECONNECTED", evt.endpointName);
		});

		mesh.on("connection-ended", evt => {
			console.log("CONNECTION ENDED", evt.endpointName);
		});

		mesh.start(err => {
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

startServer();
