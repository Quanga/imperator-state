/* eslint-disable no-mixed-spaces-and-tabs */
require("dotenv").config();
var serveStatic = require('serve-static');

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
		logFileBackups: 5,
		logFileNameAbsolute: true,
		logger: null
	},

	happn: {
		host: process.env.HAPPNER_LOCAL_IP,
		port: parseInt(process.env.HAPPNER_LOCAL_PORT),
		setOptions: {
			timeout: 15000,
		},
		persist: false,
		secure: false,
		adminPassword: "root",
		services: {

			data: {
				config: {
					filename: "data"
				}
			},
			connect: {
				config: {
					middleware: {
						security: {
							// cookieName: 'custom_token',
							exclusions: [
								'/index.html'
							]
						}
					}
				}
			}
		}
	},
	web: {
		routes: {
			// To serve static at '/'
			'/': serveStatic("./build")
		}
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
		dbConnectionService: {
			path: `${__dirname}/server.js`,
			construct: {
				name: "DbConnectionService"
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
			path: `${__dirname}/lib/services/cache_service.js`
		},
		outgoingFileQueue: {
			path: `${__dirname}/lib/services/cache_service.js`
		},
		endpointFileQueue: {
			path: `${__dirname}/lib/services/cache_service.js`
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
			$configure: function (queueServiceConfig) {
				return queueServiceConfig;
			}
		},
		serverService: {
			$configure: function (serverServiceConfig) {
				return serverServiceConfig;
			}
		},
		app: {
			startMethod: "start",


			$configure: function (appConfig) {
				return appConfig;
			}
		},
		parserFactory: {},
		portService: {},
		portUtil: {
			$configure: function (portUtilConfig) {
				return portUtilConfig;
			}
		},

		incomingFileQueue: {
			data: {
				routes: {
					"persist/*": "persist",
					"mem/*": "mem"
				}
			}
		},
		outgoingFileQueue: {},
		endpointFileQueue: {},
		transmissionService: {
			$configure: function (transmissionServiceConfig) {
				return transmissionServiceConfig;
			}
		},
		messageHandler: {
			name: "MessageHandler",
			version: "^0.0.1",
			useEndpoint: process.env.REPLICATION_ENABLED
		},
		packetService: {},
		dataService: {
			$configure: function (dataServiceConfig) {
				return dataServiceConfig;
			}
		},
		eventService: {
			$configure: function (eventServiceConfig) {
				return eventServiceConfig;
			}
		},
		dataMapper: {},
		dbConnectionService: {
			$configure: function (dbConnectionConfig) {
				return dbConnectionConfig;
			}
		},
		packetRepository: {
			$configure: function (packetRepositoryConfig) {
				return packetRepositoryConfig;
			}
		},
		nodeRepository: {
			$configure: function (nodeRepositoryConfig) {
				return nodeRepositoryConfig;
			}
		},
		logsRepository: {
			$configure: function (logsRepositoryConfig) {
				return logsRepositoryConfig;
			}
		},
		warningsRepository: {
			$configure: function (warningsRepositoryConfig) {
				return warningsRepositoryConfig;
			}
		}
	}
};

