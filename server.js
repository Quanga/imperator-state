/**
 * Created by grant on 2016/06/20.
 */

var Happner = require("happner-2");
module.exports = {
	PortUtil: require("./lib/utils/port_util"),
	QueueService: require("./lib/services/queue_service"),
	DataService: require("./lib/services/data_service"),
	PacketRepository: require("./lib/repositories/packet_repository"),
	NodeRepository: require("./lib/repositories/node_repository"),
	TransmissionService: require("./lib/services/transmission_service"),
	PacketSimulatorService: require("./lib/services/packet_simulator_service")
};

Happner.create(require("./config.js"), function(err, mesh) {
	if (err) {
		mesh.log.error(err);
		return process.exit(1);
	}
});
