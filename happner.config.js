/* eslint-disable no-mixed-spaces-and-tabs */
const path = require("path");

const blastConfig = require(path.resolve(__dirname, "./lib/configs/blasts/blastsConfig"));
const loggerConfig = require(path.resolve(__dirname, "./lib/configs/happner/logger"));
const happnConfig = require(path.resolve(__dirname, "./lib/configs/happner/happn"));
const endpoints = require(path.resolve(__dirname, "./lib/configs/happner/endpoints"));

const Config = {
	name: process.env.MESH_NAME,
	...loggerConfig,
	...happnConfig,
	...endpoints,
	modules: {
		nodered: { path: "happner-red-bed" },
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
	},
	components: {
		nodered: {
			accessLevel: "mesh",
			initMethod: "init",

			stopMethod: "stop",
			config: { projectPath: __dirname },
		},
		systemService: {},
		securityService: { env: { meshName: process.env.EDGE_INSTANCE_NAME } },
		systemRepository: {},
		data: {},
		uiService: {
			startMethod: "start",
		},
		parserService: {},
		dataService: {},
		dataMapper: {},
		endpointService: {
			stopMethod: "componentStop",
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
	},
};

module.exports = Config;
