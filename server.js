if (process.env.NODE_ENV === "test") {
	require("dotenv").config();
}
const Happner = require("happner-2");
const Config = require("./config.js");
const tcpPortUsed = require("tcp-port-used");
var mesh = new Happner();
const fs = require("fs");
const path = require("path");
const os = require("os");
var yesno = require("yesno");

(async function() {
	let checkEndpoint = true;

	if (process.env.USE_ENDPOINT === "true") {
		checkEndpoint = await checkStart();
	}

	if (process.argv[2] === "reset" && process.argv[3] === "--hard") {
		console.warn("STARTED WITH HARD RESET ARG");
		const ok = await yesno.askAsync(
			"Are you sure you want to delete the database file? (yes/no)?",
			false
		);

		if (ok) {
			let file = path.resolve(os.homedir(), "./edge/db/", process.env.EDGE_DB);

			let del = await new Promise(resolve => {
				fs.unlink(file, err => {
					if (err) {
						resolve("DATABASE FILE NOT FOUND - ", err.path);
					}

					resolve("DATABASE FILE REMOVED");
				});
			});

			console.log(del);
			return process.exit(1);
		} else {
			console.log("Aborted reset.");
			return process.exit(1);
		}
	}

	if (checkEndpoint) {
		return mesh.initialize(Config, err => {
			if (err) {
				console.error(err.stack || err.toString());
				process.exit(1);
			}

			mesh.on("endpoint-reconnect-scheduled", evt => {
				console.log("ERROR RECONNECTING", evt);
			});

			//when an endpoint reconnects after a network fault, or a remote restart
			mesh.on("endpoint-reconnect-successful", evt => {
				console.log("RECONNECTED", evt);
			});

			//when an endpoint has intentianally disconnected
			mesh.on("connection-ended", evt => {
				console.log("CONNECTION ENDED", evt);
			});

			mesh.start(err => {
				if (err) {
					console.error(err.stack || err.toString());
					process.exit(2);
				}
			});
		});
	}

	console.log("Endpoint not available......please check port and ip address");
	process.exit(1);
})();

process.on("SIGTERM", () => {
	console.info("SIGTERM signal received.");
	stop();
});

const checkStart = () =>
	new Promise(resolve => {
		tcpPortUsed
			.waitUntilUsedOnHost(
				parseInt(process.env.ENDPOINT_PORT, 10),
				process.env.ENDPOINT_IP,
				500,
				4000
			)
			.then(() => resolve(true), err => resolve(false, err));
	});

function stop() {
	mesh.stop(
		{
			kill: true, // kill the process once stopped
			wait: 10000, // wait for callbacks before kill
			exitCode: 1, // when kill, exit with this integer
			reconnect: false // inform attached clients/endpoints to reconnect
		},
		data => {
			console.log("stopped", data);
		}
	);
}
