const Happner = require("happner-2");
const Config = require("./config.js");



module.exports = {
	PortUtil: require("./lib/utils/port_util"),
	QueueService: require("./lib/services/queue_service"),
	ServerService: require("./lib/services/server_service"),
	DataService: require("./lib/services/data_service"),
	EventService: require("./lib/services/event_service"),
	PacketRepository: require("./lib/repositories/packet_repository"),
	NodeRepository: require("./lib/repositories/node_repository"),
	LogsRepository: require("./lib/repositories/logs_repository"),
	WarningsRepository: require("./lib/repositories/warnings_repository"),
	TransmissionService: require("./lib/services/transmission_service"),
	DbConnectionService: require("./lib/services/db_connection_service")
};

Happner.create(Config)
	// eslint-disable-next-line no-unused-vars
	.then(function (mesh) {
		//console.log("Mesh Running", mesh);
	})
	.catch(function (error) {
		console.error(error.stack || error.toString());
		process.exit(1);
	});
