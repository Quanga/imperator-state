/* eslint-disable no-mixed-spaces-and-tabs */
var serveStatic = require("serve-static");
require("dotenv").config();

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
			timeout: 15000
		},
		persist: true,
		secure: true,
		adminPassword: "happn",
		filename: "./aece.nedb",
		services: {
			data: {
				config: {
					filename: `${__dirname}/data2`
				},
				stats: {
					config: {
						interval: 10 * 1000 // the default
					}
				}
			},
			connect: {
				config: {
					middleware: {
						security: {
							// cookieName: 'custom_token',
							exclusions: ["/*", "/system/*", "/system/index.html"]
						}
					}
				}
			}
		}
	},
	web: {
		routes: {
			"/": serveStatic("/www/", {
				index: ["index.html", "index.htm"]
			})
		}
	},
	modules: {
		app: {
			path: `${__dirname}/app.js`
		},
		statsService: {
			path: `${__dirname}/lib/services/statsService.js`
		},
		auth: {
			path: `${__dirname}/auth.js`
		},
		queueService: {
			path: `${__dirname}/lib/services/queue_service.js`
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
		RxQueue: {
			path: `${__dirname}/lib/services/cache_service.js`
		},
		TxQueue: {
			path: `${__dirname}/lib/services/cache_service.js`
		},
		EpQueue: {
			path: `${__dirname}/lib/services/cache_service.js`
		},
		parserFactory: {
			path: `${__dirname}/lib/parsers/parser_factory.js`
		},
		dataService: {
			path: `${__dirname}/lib/services/data_service.js`
		},

		dataMapper: {
			path: `${__dirname}/lib/mappers/data_mapper.js`
		},
		packetRepository: {
			path: `${__dirname}/lib/repositories/packetRepository.js`,
			create: {
				type: "async",
				parameters: [{ name: "provider", value: "happn" }],
				callback: {
					parameters: [
						{ name: "err", parameterType: "error" },
						{ name: "res", parameterType: "instance" }
					]
				}
			}
		},
		nodeRepository: {
			path: `${__dirname}/lib/repositories/nodeRepository.js`,
			create: {
				type: "async",
				parameters: [{ name: "provider", value: "happn" }],
				callback: {
					parameters: [
						{ name: "err", parameterType: "error" },
						{ name: "res", parameterType: "instance" }
					]
				}
			}
		},
		logsRepository: {
			path: `${__dirname}/lib/repositories/logsRepository.js`,
			create: {
				type: "async",
				parameters: [{ name: "provider", value: "happn" }],
				callback: {
					parameters: [
						{ name: "err", parameterType: "error" },
						{ name: "res", parameterType: "instance" }
					]
				}
			}
		},
		warningsRepository: {
			path: `${__dirname}/lib/repositories/warningsRepository.js`,
			create: {
				type: "async",
				parameters: [{ name: "provider", value: "happn" }],
				callback: {
					parameters: [
						{ name: "err", parameterType: "error" },
						{ name: "res", parameterType: "instance" }
					]
				}
			}
		},

		archiveRepository: {
			path: `${__dirname}/lib/repositories/archiveRepository.js`,
			create: {
				type: "async",
				parameters: [{ name: "provider", value: "happn" }],
				callback: {
					parameters: [
						{ name: "err", parameterType: "error" },
						{ name: "res", parameterType: "instance" }
					]
				}
			}
		},
		transmissionService: {
			path: `${__dirname}/server.js`,
			construct: {
				name: "TransmissionService"
			}
		},
		eventService: {
			path: `${__dirname}/lib/services/event_service.js`
		}
	},
	components: {
		statsService: {},
		data: {
			data: {
				routes: {
					"persist/*": "persist",
					"state/*": "mem"
				}
			}
		},
		queueService: {
			data: {
				routes: {
					"persist/*": "persist",
					"state/*": "mem"
				}
			}
		},
		serverService: {
			$configure: function(serverServiceConfig) {
				return serverServiceConfig;
			}
		},
		app: {
			startMethod: "start",
			stopMethod: "stop"
		},
		parserFactory: {},
		portService: {
			startMethod: "start",
			stopMethod: "stopService"
		},
		portUtil: {
			$configure: function(portUtilConfig) {
				return portUtilConfig;
			}
		},

		RxQueue: {
			startMethod: "start",
			stopMethod: "stop",
			data: {
				routes: {
					"cache/*": "persist"
				}
			}
		},
		TxQueue: {
			startMethod: "start",
			stopMethod: "stop",
			data: {
				routes: {
					"cache/*": "persist"
				}
			}
		},
		EpQueue: {
			startMethod: "start",
			stopMethod: "stop",
			data: {
				routes: {
					"cache/*": "persist"
				}
			}
		},
		// transmissionService: {
		// 	$configure: function(transmissionServiceConfig) {
		// 		return transmissionServiceConfig;
		// 	}
		// },
		messageHandler: {
			name: "MessageHandler",
			version: "^0.0.1",
			useEndpoint: process.env.REPLICATION_ENABLED,
			stopMethod: "stop"
		},
		packetService: {
			name: "packetService",
			startMethod: "start",
			stopMethod: "stop"
		},
		dataService: {
			name: "dataService",
			startMethod: "start",
			stopMethod: "stop"
		},

		dataMapper: {},
		packetRepository: {},
		nodeRepository: {
			stopMethod: "stop"
		},
		logsRepository: {},
		warningsRepository: {},
		archiveRepository: {},
		eventService: {
			startMethod: "startAsync",
			stopMethod: "stopAsync"
		}
	}
};
