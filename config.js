/* eslint-disable no-mixed-spaces-and-tabs */

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
		//defaultVariableDepth: 1,
		filename: "./aece.nedb",
		services: {
			data: {
				config: {
					filename: `${__dirname}/data.db`
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

	modules: {
		app: { path: `${__dirname}/app.js` },
		stateService: { path: `${__dirname}/lib/services/stateService.js` },
		uiService: { path: `${__dirname}/lib/services/ui_service.js` },
		statsService: { path: `${__dirname}/lib/services/statsService.js` },
		queueService: { path: `${__dirname}/lib/services/queue_service.js` },
		packetService: { path: `${__dirname}/lib/services/packet_service.js` },
		parserFactory: { path: `${__dirname}/lib/parsers/parser_factory.js` },
		dataService: { path: `${__dirname}/lib/services/data_service.js` },
		dataMapper: { path: `${__dirname}/lib/mappers/data_mapper.js` },
		nodeRepository: {
			path: `${__dirname}/lib/repositories/nodeRepository.js`
		},
		blastRepository: {
			path: `${__dirname}/lib/repositories/blastRepository.js`
		},
		logsRepository: {
			path: `${__dirname}/lib/repositories/logsRepository.js`
		},
		warningsRepository: {
			path: `${__dirname}/lib/repositories/warningsRepository.js`
		},
		archiveRepository: {
			path: `${__dirname}/lib/repositories/archiveRepository.js`
		},
		eventService: {
			path: `${__dirname}/lib/services/event_service.js`
		},
		blastService: {
			path: `${__dirname}/lib/services/blast_service.js`
		}
	},
	components: {
		statsService: {},
		stateService: {},
		data: {
			data: {
				routes: {
					"persist/*": "persist",
					"mem/*": "mem"
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
		uiService: {
			startMethod: "start",
			stopMethod: "stop"
		},
		parserFactory: {},
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
		nodeRepository: {
			stopMethod: "stop"
		},
		blastRepository: {
			stopMethod: "stop"
		},
		logsRepository: {},
		warningsRepository: {},
		archiveRepository: {},
		eventService: {
			startMethod: "startAsync",
			stopMethod: "stopAsync"
		},
		blastService: {
			startMethod: "start",
			stopMethod: "stop"
		},
		app: {
			startMethod: "start",
			stopMethod: "stop"
		}
	}
};
