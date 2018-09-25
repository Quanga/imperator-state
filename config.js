/**
 * Created by grant on 2016/06/20.
 */

const path = require('path');
const fs = require('fs');
var serveStatic = require('serve-static');


/***********************************************************
 default to the test .env file to load environment variables
 ***********************************************************/

//if (!process.env.NODE_ENV)
require('dotenv').config({
	path: './test/.env-test'
});

/***********************************************************
 ensure that the queue directories exist
 ***********************************************************/

if (!fs.existsSync(process.env['ROUTER_INCOMING_QUEUE_DIR']))
	fs.mkdirSync(process.env['ROUTER_INCOMING_QUEUE_DIR']);

if (!fs.existsSync(process.env['ROUTER_OUTGOING_QUEUE_DIR']))
	fs.mkdirSync(process.env['ROUTER_OUTGOING_QUEUE_DIR']);

/***********************************************************
 HAPPNER configuration
 ***********************************************************/

module.exports = {
	name: 'aece_rpi_router',
	util: {
		logCacheSize: 1000,
		logLevel: 'info',
		logTimeDelta: true,
		logStackTraces: true, // if last arg to logger is instanceof Error
		logComponents: [],
		logMessageDelimiter: '\t',
		logDateFormat: null,
		logLayout: null,
		logFile: 'router_log.txt',
		logFileMaxSize: 1048576, // 1mb
		logFileBackups: 10,
		logFileNameAbsolute: true,
		logger: null
	},
	happn: {
		host: process.env.HAPPNER_LOCAL_IP,
		//port: process.env.HAPPNER_LOCAL_PORT,
		persist: false,
		secure: false
	},
	web: {
		routes: {
			// To serve static at '/'
			'/': serveStatic(process.env.SERVE_STATIC_PATH)
		}
	},

	endpoints: (process.env.HAPPNER_REPLICATION_ENABLED == 'true' ? {
		edgeMesh: { // remote mesh node
			config: {
				host: process.env.HAPPNER_EDGE_IP,
				port: process.env.HAPPNER_EDGE_PORT,
				username: process.env.HAPPNER_EDGE_USERNAME,
				password: process.env.HAPPNER_EDGE_PASSWORD
			}
		}
	} : null),
	modules: {
		app: {
			path: __dirname + '/app.js'
		},
		queueService: {
			path: __dirname + path.sep + 'server.js',
			construct: {
				name: "QueueService"
			}
		},
		portService: {
			path: __dirname + '/lib/services/serial_port_service.js'
		},
		portUtil: {
			path: __dirname + path.sep + 'server.js',
			construct: {
				name: "PortUtil"
			},
		},
		packetService: {
			path: __dirname + '/lib/services/packet_service.js'
		},
		messageReader: {
			path: __dirname + '/lib/readers/incoming_message_reader.js'
		},
		messageHandler: {
			path: __dirname + '/lib/handlers/message_handlers'
		},
		incomingFileQueue: {
			path: "file-queue",
			construct: {
				type: "async",
				name: "Queue",
				parameters: [{
					name: "options",
					required: true,
					value: process.env.ROUTER_INCOMING_QUEUE_DIR
				},
				{
					name: "cb",
					required: true,
					value: function (err) {
						if (err) throw err;
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
				parameters: [{
					name: "options",
					required: true,
					value: process.env.ROUTER_OUTGOING_QUEUE_DIR
				},
				{
					name: "cb",
					required: true,
					value: function (err) {
						if (err) throw err;
					}
				}
				]
			}
		},
		parserFactory: {
			path: __dirname + '/lib/parsers/parser_factory.js'
		},
		dataService: {
			path: __dirname + path.sep + 'server.js',
			construct: {
				name: "DataService"
			}
		},
		dataMapper: {
			path: __dirname + '/lib/mappers/data_mapper.js'
		},
		packetRepository: {
			path: __dirname + path.sep + 'server.js',
			construct: {
				name: "PacketRepository"
			}
		},
		nodeRepository: {
			path: __dirname + path.sep + 'server.js',
			construct: {
				name: "NodeRepository"
			}
		},
		transmissionService: {
			path: __dirname + path.sep + 'server.js',
			construct: {
				name: "TransmissionService"
			}
		}
	},
	components: {


		portService: {},
		portUtil: {
			$configure: function (portUtilConfig) {
				return portUtilConfig;
			}
		},
		queueService: {
			$configure: function (queueServiceConfig) {
				return queueServiceConfig;
			}
		},
		incomingFileQueue: {},
		outgoingFileQueue: {},
		transmissionService: {
			$configure: function (transmissionServiceConfig) {
				return transmissionServiceConfig;
			}
		},
		messageReader: {},
		messageHandler: {},
		packetService: {},
		parserFactory: {},
		dataService: {
			$configure: function (dataServiceConfig) {
				return dataServiceConfig;
			}
		},
		dataMapper: {},
		app: {
			startMethod: 'start'
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
	}
};