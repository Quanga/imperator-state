/* eslint-disable no-mixed-spaces-and-tabs */

const blastConfig = require("./lib/configs/blasts/blastsConfig");

const loggerConfig = require("./lib/configs/happner/logger");
const happnConfig = require("./lib/configs/happner/happn");
const endpoints = require("./lib/configs/happner/endpoints");

const Config = {
	name: process.env.MESH_NAME,
	...loggerConfig,
	...happnConfig,
	...endpoints,
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
		securityService: { env: { meshName: process.env.EDGE_INSTANCE_NAME } },
		systemRepository: {},
		data: {
			// data: {
			// 	routes: {
			// 		"persist/*": "persist",
			// 		"mem/*": "mem",
			// 	},
			// },
		},
		uiService: {
			startMethod: "start",
		},
		parserService: {},
		dataService: {},
		dataMapper: {},
		endpointService: {
			stopMethod: "componentStop",
			// env: {
			// 	endpointIP: process.env.ENDPOINT_IP || "0.0.0.0",
			// 	endpointPort: parseInt(process.env.ENDPOINT_PORT) || 55014,
			// 	endpointCheckInterval: parseInt(process.env.EP_CHECK_INTERVAL, 10) || 5000,
			// 	endpointName: process.env.ENDPOINT_NAME || "edge_ssot",
			// 	endpointUsername: process.env.ENDPOINT_USERNAME || "UNIT001",
			// 	endpointPassword: process.env.ENDPOINT_PASSWORD || "",
			// },
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
			},
		},
		queueService: {},
		app: {
			startMethod: "componentStart",
			stopMethod: "componentStop",
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

module.exports = Config;
