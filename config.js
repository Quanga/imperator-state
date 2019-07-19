/* eslint-disable no-mixed-spaces-and-tabs */

/***********************************************************
 HAPPNER configuration
 ***********************************************************/

const path = require("path");

class Config {
	constructor(overrideObj = {}) {
		this.config = {
			name: overrideObj.name || process.env.EDGE_INSTANCE_NAME,
			util: {
				logCacheSize: 1000,
				logLevel: process.env.LOG_LEVEL || "info",
				logTimeDelta: true,
				logStackTraces: true, // if last arg to logger is instanceof Error
				logComponents: [],
				logMessageDelimiter: "\t",
				logDateFormat: null,
				logLayout: null,
				logFile: overrideObj.logFile || this.getLogsPath() || "edge.log",
				logFileMaxSize: 1048576, // 1mb
				logFileBackups: 5,
				logFileNameAbsolute: true,
				logger: null
			},
			happn: {
				host: overrideObj.host || process.env.EDGE_LOCAL_IP || "localhost",
				port:
					overrideObj.port || parseInt(process.env.EDGE_LOCAL_PORT) || 55000,
				setOptions: {
					timeout: 60000
				},
				persist: true,
				secure: true,
				adminPassword: "happn",
				services: {
					data: {
						config: {
							filename:
								overrideObj.db || this.getDbPath() || `${__dirname}/data.db`
						}
					},
					connect: {
						config: {
							middleware: {
								security: {
									exclusions: ["/*", "/system/*", "/system/index.html"]
								}
							}
						}
					}
				}
			},
			modules: {
				app: { path: `${__dirname}/app.js` },
				transmissionService: {
					path: `${__dirname}/lib/services/transmission_service.js`
				},
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
				eventService: {
					path: `${__dirname}/lib/services/event_service.js`
				},
				blastService: {
					path: `${__dirname}/lib/services/blast_service.js`
				},
				wifiService: {
					path: `${__dirname}/lib/services/wifiService.js`
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
				uiService: {
					startMethod: "start",
					stopMethod: "stop"
				},
				parserFactory: {},
				packetService: {
					startMethod: "start",
					stopMethod: "stop"
				},
				dataService: {
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
				eventService: {
					startMethod: "startAsync",
					stopMethod: "stopAsync"
				},
				blastService: {
					startMethod: "start",
					stopMethod: "stop",
					env: {
						systemFiringTime:
							overrideObj.systemFiringTime ||
							parseInt(process.env.SYSTEM_FIRING_TIME, 10) ||
							2 * 60 * 1000,
						systemReportTime:
							overrideObj.systemReportTime ||
							process.env.SYSTEM_REPORT_TIME ||
							3 * 60 * 1000
					}
				},
				queueService: {
					startMethod: "start",
					data: {
						routes: {
							"persist/*": "persist",
							"state/*": "mem"
						}
					},
					env: {
						useEndpoint: overrideObj.useEndpoint || process.env.USE_ENDPOINT,
						endpointName: overrideObj.endpointName || process.env.ENDPOINT_NAME,
						endpointUsername:
							overrideObj.endpointUsername || process.env.ENDPOINT_USERNAME,
						meshInstance: null
					}
				},
				transmissionService: { startMethod: "start" },
				wifiService: {
					startMethod: "start"
				},
				app: {
					startMethod: "start",
					stopMethod: "stop"
				}
			}
		};

		if (overrideObj.useEndpoint || process.env.USE_ENDPOINT === "true") {
			const endpointName =
				overrideObj.endpointName || process.env.ENDPOINT_NAME;

			this.config.endpoints = {
				[endpointName]: {
					reconnect: {
						retries: 100 // default Infinity
					},
					config: {
						host:
							overrideObj.endpointIP || process.env.ENDPOINT_IP || "localhost",
						port:
							overrideObj.endpointPort ||
							parseInt(process.env.ENDPOINT_PORT) ||
							55004,
						username:
							overrideObj.enpointUsername ||
							process.env.ENDPOINT_USERNAME ||
							"MESH_UNIT",
						password:
							overrideObj.endpointPassword ||
							process.env.ENDPOINT_PASSWORD.toString() ||
							"1234"
					}
				}
			};
		}
	}

	getDbPath() {
		const homedir = require("os").homedir();
		return path.resolve(homedir, "./edge/db/", process.env.EDGE_DB);
	}

	getLogsPath() {
		const homedir = require("os").homedir();

		//const homedir = "/var/edge";
		return path.resolve(
			homedir,
			"./edge/logs/",
			process.env.EDGE_LOCAL_LOG_FILE
		);
	}
}

module.exports = Config;
