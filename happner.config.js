/* eslint-disable no-mixed-spaces-and-tabs */
const path = require("path");
const os = require("os");
const { systemModeTypes, styles } = require(path.resolve(
	__dirname,
	"./lib/constants/typeConstants",
));
const modes = require(path.resolve(__dirname, "./lib/configs/modes/modes"));
const fs = require("fs");
const blastConfig = require("./lib/configs/blasts/blastsConfig");

class Config {
	constructor(override = {}) {
		this.configuration = {
			name: override.name || process.env.EDGE_INSTANCE_NAME,
			util: {
				logCacheSize: 1000,
				logLevel: override.logLevel || process.env.LOG_LEVEL || "info",
				logTimeDelta: true,
				logStackTraces: true, // if last arg to logger is instanceof Error
				logComponents: [],
				logMessageDelimiter: "\t",
				logDateFormat: null,
				logLayout: null,
				logFile:
					override.logFile ||
					this.getPath("logs", process.env.EDGE_LOCAL_LOG_FILE) ||
					this.getPath("logs", "./edge.log"),
				logFileMaxSize: 1048576, // 1mb
				logFileBackups: 5,
				logFileNameAbsolute: true,
				logger: null,
			},
			happn: {
				//host: "localhost",
				port: override.port || parseInt(process.env.EDGE_LOCAL_PORT) || 55000,
				setOptions: {
					timeout: 30000,
				},
				compactInterval: 180000,
				secure: true,
				adminPassword: "happn",
				services: {
					security: {
						config: {
							pbkdf2Iterations: 1000,
						},
					},
					data: {
						config: {
							datastores: [
								{
									name: "nodes",
									settings: {
										filename:
											override.logsdb ||
											this.getPath("db", process.env.LOGS_DB) ||
											this.getPath("db", "./nodes.db"),
									},
									patterns: ["/_data/data/persist/nodes/*"],
								},
								{
									name: "logs",
									settings: {
										filename:
											override.logsdb ||
											this.getPath("db", process.env.LOGS_DB) ||
											this.getPath("db", "./logs.db"),
									},
									patterns: ["/_data/data/persist/logs/*"],
								},
								{
									name: "warnings",
									settings: {
										filename:
											override.warningsdb ||
											this.getPath("db", process.env.WARNINGS_DB) ||
											this.getPath("db", "./warnings.db"),
									},
									patterns: ["/_data/data/persist/warnings/*"],
								},
								{
									name: "blasts",
									settings: {
										filename:
											override.warningsdb ||
											this.getPath("db", process.env.WARNINGS_DB) ||
											this.getPath("db", "./blasts.db"),
									},
									patterns: ["/_data/data/persist/blasts/*"],
								},
								{
									name: "ui",
									settings: {
										filename:
											override.warningsdb ||
											this.getPath("db", process.env.WARNINGS_DB) ||
											this.getPath("db", "./ui.db"),
									},
									patterns: ["/_data/data/persist/system/*"],
								},
								{
									name: "persist",
									isDefault: true,
									settings: {
										filename:
											override.db ||
											this.getPath("db", process.env.EDGE_DB) ||
											this.getPath("db", "./edge.db"),
									},
									patterns: ["/_data/data/persist/*"],
								},
								{
									name: "mem",
									patterns: ["/_data/data/mem/*"],
								},
							],
						},
					},
				},
			},
			endpoints:
				process.env.NODE_ENV !== "test"
					? {
							"mesh-pdf": {
								reconnect: { max: 2000, retries: 100 },
								config: {
									port: 55030,
									username: "_ADMIN",
									password: "happn",
								},
							},
							// "mesh-mailer": {
							// 	reconnect: { max: 2000, retries: 100 },
							// 	config: {
							// 		port: 55006,
							// 		username: "_ADMIN",
							// 		password: "happn",
							// 	},
							// },
					  }
					: {},

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
				parserService: { path: `${__dirname}/lib/services/parserService.js` },
				queueService: { path: `${__dirname}/lib/services/queue_service.js` },
				securityService: { path: `${__dirname}/lib/services/securityService.js` },
				systemRepository: { path: `${__dirname}/lib/repositories/systemRepository.js` },
				systemService: { path: `${__dirname}/lib/services/systemService.js` },
				uiService: { path: `${__dirname}/lib/services/ui_service.js` },
				warningsRepository: { path: `${__dirname}/lib/repositories/warningsRepository.js` },
				nodered: {
					path: "happner-red-bed",
				},
			},
			components: {
				systemService: {},
				securityService: {
					env: { meshName: override.name || process.env.EDGE_INSTANCE_NAME },
				},
				systemRepository: {},
				data: {
					data: {
						routes: {
							"persist/*": "persist",
							"mem/*": "mem",
						},
					},
				},
				uiService: {
					startMethod: "start",
				},
				parserService: {
					env: {
						systemMode: override.mode || process.env.MODE || systemModeTypes.AXXIS100,
					},
				},
				dataService: {
					env: {
						systemMode:
							override.systemMode || this.getDotMode() || process.env.MODE || systemModeTypes.AXXIS100,
					},
				},
				dataMapper: {},
				endpointService: {
					stopMethod: "componentStop",
					env: {
						endpointIP: override.endpointIP || process.env.ENDPOINT_IP || "0.0.0.0",
						endpointPort: override.endpointPort || parseInt(process.env.ENDPOINT_PORT) || 55004,
						endpointCheckInterval:
							override.endpointCheckInterval || parseInt(process.env.EP_CHECK_INTERVAL, 10) || 5000,
						endpointName: override.endpointName || process.env.ENDPOINT_NAME || "edge_ssot",
						endpointUsername: override.endpointUsername || process.env.ENDPOINT_USERNAME || "UNIT001",
						endpointPassword: override.endpointPassword || process.env.ENDPOINT_PASSWORD || "",
					},
				},
				nodeRepository: {},
				blastRepository: {},
				logsRepository: {},
				warningsRepository: {},
				eventService: {
					startMethod: "componentStart",
				},

				blastService: {
					startMethod: "componentStart",
					stopMethod: "componentStop",
					env: {
						fsm: blastConfig.fsm,
						systemMode: override.mode || process.env.MODE || systemModeTypes.AXXIS100,
						theme:
							this.getTheme(this.getDotMode()) ||
							this.getTheme(override.mode) ||
							this.getTheme(process.env.MODE) ||
							this.getTheme(systemModeTypes.AXXIS100),
					},
				},
				queueService: {
					env: {
						systemMode:
							override.systemMode || this.getDotMode() || process.env.MODE || systemModeTypes.AXXIS100,
					},
				},
				app: {
					startMethod: "componentStart",
					stopMethod: "componentStop",
					env: {
						useEndpoint: override.useEndpoint || this.parseEnv(process.env.USE_ENDPOINT) || false,
						systemMode: override.systemMode || process.env.MODE || systemModeTypes.AXXIS100,
					},
				},
				nodered: {
					accessLevel: "mesh",
					initMethod: "init",
					startMethod: "start",
					stopMethod: "stop",
					config: {
						projectPath: __dirname,
					},
				},
			},
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