const Happner = require("happner-2");
const Config = require("./config.js");

module.exports = {
	PortUtil: require("./lib/utils/port_util"),
	QueueService: require("./lib/services/queue_service"),
	ServerService: require("./lib/services/server_service"),
	DataService: require("./lib/services/data_service"),
	TransmissionService: require("./lib/services/transmission_service")
};

Happner.create(Config)
// eslint-disable-next-line no-unused-vars
	.then(function(mesh) {
		//console.log("Mesh Running", mesh);
	})
	.catch(function(error) {
		console.error(error.stack || error.toString());
		process.exit(1);
	});
