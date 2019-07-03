const Happner = require("happner-2");
const Config = require("./config.js");
const tcpPortUsed = require("tcp-port-used");
var mesh = new Happner();

console.log("ENV_INSTANCE", process.env.EDGE_INSTANCE_NAME);

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

(async function() {
	let checkEndpoint = true;

	if (process.env.USE_ENDPOINT === "true") {
		checkEndpoint = await checkStart();
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
