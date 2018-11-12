/* eslint-disable no-mixed-spaces-and-tabs */
const fs = require("fs");
require("dotenv").config();

/***********************************************************
 ensure that the queue directories exist
 ***********************************************************/

if (!fs.existsSync(process.env["ROUTER_INCOMING_QUEUE_DIR"]))
	fs.mkdirSync(process.env["ROUTER_INCOMING_QUEUE_DIR"]);

if (!fs.existsSync(process.env["ROUTER_OUTGOING_QUEUE_DIR"]))
	fs.mkdirSync(process.env["ROUTER_OUTGOING_QUEUE_DIR"]);

if (!fs.existsSync(process.env["ROUTER_ENDPOINT_QUEUE_DIR"]))
	fs.mkdirSync(process.env["ROUTER_ENDPOINT_QUEUE_DIR"]);

/***********************************************************
 HAPPNER configuration
 ***********************************************************/

module.exports = {
	name: process.env.ROUTER_INSTANCE_NAME,
	util: {
		logCacheSize: 1000,
		logLevel: "info",
		logTimeDelta: true,
		logStackTraces: true, // if last arg to logger is instanceof Error
		logComponents: [],
		logMessageDelimiter: "\t",
		logDateFormat: null,
		logLayout: null,
		logFile: "router_log.txt",
		logFileMaxSize: 1048576, // 1mb
		logFileBackups: 10,
		logFileNameAbsolute: true,
		logger: null
	},
	happn: {
		host: process.env.HAPPNER_LOCAL_IP,
		setOptions: {
			timeout: 15000
		},
		persist: false,
		secure: false
	},

	modules: {
		app: {
			path: `${__dirname}/app.js`
		},

		queueService: {
			path: `${__dirname}/server.js`,
			construct: {
				name: "QueueService"
			}
		},
		serverService: {
			path: `${__dirname}/server.js`,
			construct: {
				name: "ServerService"
			}
		},
		portService: {
			path: `${__dirname}/lib/services/serial_port_service.js`
		},
		portUtil: {
			path: `${__dirname}/server.js`,
			construct: {
				name: "PortUtil",
				type: "async"
			}
		},
		packetService: {
			path: `${__dirname}/lib/services/packet_service.js`
		},
		messageHandler: {
			path: `${__dirname}/lib/handlers/message_handlers.js`
		},
		incomingFileQueue: {
			path: "file-queue",
			construct: {
				type: "async",
				name: "Queue",
				parameters: [
					{
						name: "options",
						required: true,
						value: process.env.ROUTER_INCOMING_QUEUE_DIR
					},
					{
						name: "cb",
						required: true,
						value: function(err) {
							if (err) {
								console.log(err);
								throw err;
							}
						}
					}
				]
			}
		},
		outgoingFileQueue: {
			path: "file-queue",
			construct: {
				type: "async",
				name: "Queue",
				parameters: [
					{
						name: "options",
						required: true,
						value: process.env.ROUTER_OUTGOING_QUEUE_DIR
					},
					{
						name: "cb",
						required: true,
						value: function(err) {
							if (err) {
								console.log(err);
								throw err;
							}
						}
					}
				]
			}
		},
		endpointFileQueue: {
			path: "file-queue",
			construct: {
				type: "async",
				name: "Queue",
				parameters: [
					{
						name: "options",
						required: true,
						value: process.env.ROUTER_ENDPOINT_QUEUE_DIR
					},
					{
						name: "cb",
						required: true,
						value: function(err) {
							if (err) {
								console.log(err);
								throw err;
							}
						}
					}
				]
			}
		},
		parserFactory: {
			path: `${__dirname}/lib/parsers/parser_factory.js`
		},
		dataService: {
			path: `${__dirname}/server.js`,
			construct: {
				name: "DataService"
			}
		},
		eventService: {
			path: `${__dirname}/server.js`,
			construct: {
				name: "EventService"
			}
		},
		dataMapper: {
			path: `${__dirname}/lib/mappers/data_mapper.js`
		},
		packetRepository: {
			path: `${__dirname}/server.js`,
			construct: {
				name: "PacketRepository",
				type: "async"
			}
		},
		nodeRepository: {
			path: `${__dirname}/server.js`,
			construct: {
				name: "NodeRepository"
			}
		},

		logsRepository: {
			path: `${__dirname}/server.js`,
			construct: {
				name: "LogsRepository"
			}
		},
		warningsRepository: {
			path: `${__dirname}/server.js`,
			construct: {
				name: "WarningsRepository"
			}
		},
		transmissionService: {
			path: `${__dirname}/server.js`,
			construct: {
				name: "TransmissionService"
			}
		}
	},
	components: {
		queueService: {
			$configure: function(queueServiceConfig) {
				return queueServiceConfig;
			}
		},
		serverService: {
			$configure: function(serverServiceConfig) {
				return serverServiceConfig;
			}
		},
		app: {
			startMethod: "start",
			$configure: function(appConfig) {
				return appConfig;
			}
		},
		parserFactory: {},
		portService: {},
		portUtil: {
			$configure: function(portUtilConfig) {
				return portUtilConfig;
			}
		},

		incomingFileQueue: {},
		outgoingFileQueue: {},
		endpointFileQueue: {},
		transmissionService: {
			$configure: function(transmissionServiceConfig) {
				return transmissionServiceConfig;
			}
		},
		messageHandler: {
			name: "MessageHandler",
			version: "^0.0.1",
			config: {
				useEndpoint: true
			}
		},
		packetService: {},
		dataService: {
			$configure: function(dataServiceConfig) {
				return dataServiceConfig;
			}
		},
		eventService: {},
		dataMapper: {},
		packetRepository: {
			$configure: function(packetRepositoryConfig) {
				return packetRepositoryConfig;
			}
		},
		nodeRepository: {
			$configure: function(nodeRepositoryConfig) {
				return nodeRepositoryConfig;
			}
		},
		logsRepository: {
			$configure: function(logsRepositoryConfig) {
				return logsRepositoryConfig;
			}
		},
		warningsRepository: {
			$configure: function(warningsRepositoryConfig) {
				return warningsRepositoryConfig;
			}
		}
	}
};
