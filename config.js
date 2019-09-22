/* eslint-disable no-mixed-spaces-and-tabs */
const path = require("path");
const os = require("os");
const { systemModeTypes } = require("./lib/constants/typeConstants");

class Config {
	constructor(overrideObj = {}) {
		this.configuration = {
			name: overrideObj.name || process.env.EDGE_INSTANCE_NAME,
			util: {
				logCacheSize: 1000,
				logLevel: overrideObj.logLevel || process.env.LOG_LEVEL || "info",
				logTimeDelta: true,
				logStackTraces: true, // if last arg to logger is instanceof Error
				logComponents: [],
				logMessageDelimiter: "\t",
				logDateFormat: null,
				logLayout: null,
				logFile:
					overrideObj.logFile ||
					this.getPath("logs", process.env.EDGE_LOCAL_LOG_FILE) ||
					this.getPath("logs", "./edge.log"),
				logFileMaxSize: 1048576, // 1mb
				logFileBackups: 5,
				logFileNameAbsolute: true,
				logger: null
			},
			happn: {
				//host: "0.0.0.0",
				port: overrideObj.port || parseInt(process.env.EDGE_LOCAL_PORT) || 55000,
				setOptions: {
					timeout: 30000
				},
				persist: true,
				secure: true,
				adminPassword: "happn",
				services: {
					security: {
						config: {
							pbkdf2Iterations: 1000
						}
					},
					data: {
						config: {
							filename:
								overrideObj.db ||
								this.getPath("db", process.env.EDGE_DB) ||
								this.getPath("db", "./edge.db")
						}
					}
				}
			},
			modules: {
				app: { path: `${__dirname}/app.js` },
				blastRepository: { path: `${__dirname}/lib/repositories/blastRepository.js` },
				blastService: { path: `${__dirname}/lib/services/blast_service.js` },
				dataService: { path: `${__dirname}/lib/services/data_service.js` },
				dataMapper: { path: `${__dirname}/lib/mappers/data_mapper.js` },

				endpointService: { path: `${__dirname}/lib/services/endpointService.js` },
				eventService: { path: `${__dirname}/lib/services/event_service.js` },
				logsRepository: { path: `${__dirname}/lib/repositories/logsRepository.js` },
				nodeRepository: { path: `${__dirname}/lib/repositories/nodeRepository.js` },
				packetService: { path: `${__dirname}/lib/services/packet_service.js` },
				parserFactory: { path: `${__dirname}/lib/parsers/parser_factory.js` },
				queueService: { path: `${__dirname}/lib/services/queue_service.js` },
				securityService: { path: `${__dirname}/lib/services/securityService.js` },
				stateService: { path: `${__dirname}/lib/services/stateService.js` },
				statsService: { path: `${__dirname}/lib/services/statsService.js` },
				systemRepository: { path: `${__dirname}/lib/repositories/systemRepository.js` },
				systemService: { path: `${__dirname}/lib/services/systemService.js` },
				transmissionService: { path: `${__dirname}/lib/services/transmission_service.js` },
				uiService: { path: `${__dirname}/lib/services/ui_service.js` },
				warningsRepository: { path: `${__dirname}/lib/repositories/warningsRepository.js` },
				wifiService: { path: `${__dirname}/lib/services/wifiService.js` }
			},
			components: {
				systemService: {},
				securityService: {
					env: {
						meshName: overrideObj.name || process.env.EDGE_INSTANCE_NAME
					}
				},
				systemRepository: {},
				statsService: {},
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
					stopMethod: "stop",
					env: {
						mode: overrideObj.mode || process.env.MODE || systemModeTypes.AXXIS100
					}
				},
				dataService: {
					startMethod: "componentStart",
					stopMethod: "componentStop",
					env: {
						systemMode: overrideObj.systemMode || process.env.MODE || systemModeTypes.AXXIS100
					}
				},
				dataMapper: {},
				endpointService: {
					stopMethod: "componentStop",
					env: {
						endpointIP: overrideObj.endpointIP || process.env.ENDPOINT_IP || "localhost",
						endpointPort: overrideObj.endpointPort || parseInt(process.env.ENDPOINT_PORT) || 55004,
						endpointCheckInterval:
							overrideObj.endpointCheckInterval ||
							parseInt(process.env.EP_CHECK_INTERVAL, 10) ||
							5000,
						endpointName: overrideObj.endpointName || process.env.ENDPOINT_NAME || "edge_ssot",
						endpointUsername:
							overrideObj.endpointUsername || process.env.ENDPOINT_USERNAME || "UNIT001",
						endpointPassword: overrideObj.endpointPassword || process.env.ENDPOINT_PASSWORD || ""
					}
				},
				nodeRepository: {
					startMethod: "componentStart",
					stopMethod: "componentStop"
				},
				blastRepository: {
					startMethod: "componentStart",
					stopMethod: "componentStop"
				},
				logsRepository: {
					startMethod: "componentStart",
					stopMethod: "componentStop"
				},
				warningsRepository: {
					startMethod: "componentStart",
					stopMethod: "componentStop"
				},
				eventService: {
					startMethod: "componentStart",
					stopMethod: "componentStop"
				},
				transmissionService: {
					startMethod: "componentStart"
				},
				blastService: {
					startMethod: "componentStart",
					stopMethod: "componentStop",
					env: {
						systemFiringTime:
							overrideObj.systemFiringTime ||
							parseInt(process.env.SYSTEM_FIRING_TIME, 10) ||
							120000,
						systemReportTime:
							overrideObj.systemReportTime || parseInt(process.env.SYSTEM_REPORT_TIME, 10) || 180000
					}
				},
				queueService: {
					startMethod: "componentStart",
					stopMethod: "componentStop",
					data: {
						routes: {
							"persist/*": "persist",
							"state/*": "mem"
						}
					}
				},
				wifiService: {
					//startMethod: "start"
				},
				app: {
					startMethod: "componentStart",
					stopMethod: "componentStop",
					env: {
						useEndpoint: overrideObj.useEndpoint || process.env.USE_ENDPOINT || false
					}
				},
				stateService: {}
			}
		};
	}

	getPath(subFolder, envParam) {
		if (!envParam) return null;
		return path.resolve(os.homedir(), `./edge/${subFolder}/`, envParam);
	}

	parseEnv(env) {
		if (env === true) return true;

		if (typeof env === "string") {
			if (env === "true" || env === "TRUE") return true;
			return false;
		}

		if (typeof env === "boolean") {
			return env;
		}

		return false;
	}
}

module.exports = Config;
