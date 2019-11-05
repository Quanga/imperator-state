/* eslint-disable no-mixed-spaces-and-tabs */
const path = require("path");
const os = require("os");
const { systemModeTypes, styles } = require(path.resolve(
	__dirname,
	"./lib/constants/typeConstants"
));
const modes = require(path.resolve(__dirname, "./lib/constants/modeTemplates"));
const fs = require("fs");

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
				compactInterval: 180000,
				secure: true,
				adminPassword: "happn",
				services: {
					security: {
						config: {
							pbkdf2Iterations: 1000
						}
					},
					// data: {
					// 	config: {
					// 		filename: path.resolve(__dirname, "./db/edge.db")
					// 	}
					// }
					data: {
						config: {
							datastores: [
								{
									name: "nodes",
									settings: {
										filename:
											overrideObj.logsdb ||
											this.getPath("db", process.env.LOGS_DB) ||
											this.getPath("db", "./nodes.db")
									},
									patterns: ["/_data/data/persist/nodes/*"]
								},
								{
									name: "logs",
									settings: {
										filename:
											overrideObj.logsdb ||
											this.getPath("db", process.env.LOGS_DB) ||
											this.getPath("db", "./logs.db")
									},
									patterns: ["/_data/data/persist/logs/*"]
								},
								{
									name: "warnings",
									settings: {
										filename:
											overrideObj.warningsdb ||
											this.getPath("db", process.env.WARNINGS_DB) ||
											this.getPath("db", "./warnings.db")
									},
									patterns: ["/_data/data/persist/warnings/*"]
								},
								{
									name: "blasts",
									settings: {
										filename:
											overrideObj.warningsdb ||
											this.getPath("db", process.env.WARNINGS_DB) ||
											this.getPath("db", "./blasts.db")
									},
									patterns: ["/_data/data/persist/blasts/*"]
								},
								{
									name: "ui",
									settings: {
										filename:
											overrideObj.warningsdb ||
											this.getPath("db", process.env.WARNINGS_DB) ||
											this.getPath("db", "./ui.db")
									},
									patterns: ["/_data/data/persist/system/*"]
								},
								{
									name: "persist",
									isDefault: true,
									settings: {
										filename:
											overrideObj.db ||
											this.getPath("db", process.env.EDGE_DB) ||
											this.getPath("db", "./edge.db")
									},
									patterns: ["/_data/data/persist/*"]
								},
								{
									name: "mem",
									patterns: ["/_data/data/mem/*"]
								}
							]
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
				uiService: { path: `${__dirname}/lib/services/ui_service.js` },
				warningsRepository: { path: `${__dirname}/lib/repositories/warningsRepository.js` }
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
				data: {},
				uiService: {
					startMethod: "start"
				},
				parserFactory: {},
				packetService: {
					startMethod: "start",
					stopMethod: "stop",
					env: {
						systemMode:
							overrideObj.systemMode ||
							this.getDotMode() ||
							process.env.MODE ||
							systemModeTypes.AXXIS100
					}
				},
				dataService: {
					startMethod: "componentStart",
					stopMethod: "componentStop",
					env: {
						systemMode:
							overrideObj.systemMode ||
							this.getDotMode() ||
							process.env.MODE ||
							systemModeTypes.AXXIS100
					}
				},
				dataMapper: {},
				endpointService: {
					stopMethod: "componentStop",
					env: {
						endpointIP: overrideObj.endpointIP || process.env.ENDPOINT_IP || "0.0.0.0",
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

				blastService: {
					startMethod: "componentStart",
					stopMethod: "componentStop",
					env: {
						systemFiringTime:
							overrideObj.systemFiringTime ||
							parseInt(process.env.SYSTEM_FIRING_TIME, 10) ||
							120000,
						systemReportTime:
							overrideObj.systemReportTime ||
							parseInt(process.env.SYSTEM_REPORT_TIME, 10) ||
							180000,
						theme:
							this.getTheme(this.getDotMode()) ||
							this.getTheme(overrideObj.mode) ||
							this.getTheme(process.env.MODE) ||
							this.getTheme(systemModeTypes.AXXIS100)
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
				app: {
					startMethod: "componentStart",
					stopMethod: "componentStop",
					env: {
						useEndpoint: overrideObj.useEndpoint || process.env.USE_ENDPOINT || false,
						systemMode:
							overrideObj.systemMode ||
							this.getDotMode() ||
							process.env.MODE ||
							systemModeTypes.AXXIS100
					}
				},
				stateService: {}
			}
		};
	}

	getDotMode() {
		const modeFile = path.resolve(os.homedir(), `./edge/`, ".mode.json");
		let valid = fs.existsSync(modeFile);

		if (valid) {
			let file = JSON.parse(fs.readFileSync(modeFile, "utf8"));
			return file.systemMode;
		}
		return null;
	}

	// TODO this is dangerous, add validation
	getTheme(themeName) {
		if (!themeName) return null;
		const foundTheme = modes[themeName].theme;
		return styles[foundTheme];
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
