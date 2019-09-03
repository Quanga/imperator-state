/* eslint-disable no-unused-vars */
var Events = require("events");

var MockHappn = function() {
	this.name;
	this.__queueLength = 1;
	this.nodes = [];
	this.emitter = new Events.EventEmitter();

	this.emit = function(message) {
		this.emitter.emit(message);
	};

	this.log = {
		error: function(message, err) {
			console.log(message);
		},
		info: function(message) {
			console.log(message);
		},
		warn: function(message) {
			console.log(message);
		}
	};

	this.exchange = {
		incomingFileQueue: {
			length: function() {
				return new Promise(function(resolve) {
					resolve(self.__queueLength);
					self.__queueLength -= 1;
				});
			},
			pop: function() {
				return new Promise(function(resolve) {
					resolve("my incoming message");
				});
			},
			push: function() {
				return new Promise(function(resolve) {
					resolve("my incoming message");
				});
			}
		},
		outgoingFileQueue: {
			length: function(callback) {
				callback(null, self.__queueLength);
				self.__queueLength -= 1;
			},
			pop: function(callback) {
				callback(null, "my outgoing message");
			},
			push: function() {
				return new Promise(function(resolve) {
					resolve();
				});
			}
		},
		dataService: {
			insertPacketArr: function() {
				return new Promise(function(resolve) {
					resolve(1);
				});
			},
			upsertNodeDataArr: function() {
				return new Promise(function(resolve) {
					resolve();
				});
			}
		},
		packetService: {
			extractData: function(message) {
				return new Promise(function(resolve) {
					resolve();
				});
			}
		},
		portUtil: {
			getInstance: function() {
				// eslint-disable-next-line no-unused-vars
				return new Promise(function(resolve, reject) {
					resolve({
						// eslint-disable-next-line no-unused-vars
						on: function(eventType, handler) {
							return true;
						}
					});
				});
			}
		},
		messageHandler: {
			MessageReceiveHandler: function() {
				return new Promise(function(resolve, reject) {
					resolve(function() {
						return true;
					});
				});
			}
		},
		parserFactory: {
			getParser: function(packet) {
				const parserFactory = require("../../lib/parsers/parser_factory");
				let newMock = new MockHappn();
				return new parserFactory().getParser(newMock, packet);
			}
		},
		nodeRepository: {
			getAllNodes: function() {
				// eslint-disable-next-line no-unused-vars
				return new Promise(function(resolve, reject) {
					resolve(self.nodes);
				});
			}
		},
		logsRepository: {
			set: function(arg) {
				return new Promise((resolve, reject) => {
					console.log("LOG CALLED");
					resolve(arg);
				});
			}
		},
		dataMapper: {
			mapInsertPacket: function(packet) {
				const mapper = require("../../lib/mappers/data_mapper");
				return new mapper().mapInsertPacket(packet);
			}
		},
		data: {},
		eventService: {
			persistWarning: function(warn) {
				console.log("Warning", warn);
			},
			logPacketError: function(error) {
				return new Promise(resolve => {
					resolve(error);
				});
			}
		},
		stateService: {
			updateState: function() {
				return new Promise((resolve, reject) => {
					resolve();
				});
			}
		},
		queueService: {
			validatePacket: function() {
				return new Promise((resolve, reject) => {
					resolve();
				});
			}
		}
	};
};

//util.inherits(MockHappn, EventEmitter);

// Object.defineProperty(MockHappn.prototype, "emit", {
// 	get: function(message) {
// 		return {
// 			function(message, err) {
// 				this.emitter.emit(message);
// 			}
// 		};
// 	}
// });

Object.defineProperty(MockHappn.prototype, "config", {
	get: function() {
		return {
			nodeEnv: process.env.NODE_ENV,
			edgeIP: process.env.EDGE_IP,
			edgePort: process.env.HAPPNER_EDGE_PORT,
			localIP: process.env.HAPPNER_LOCAL_IP,
			localPort: process.env.HAPPNER_LOCAL_PORT,
			replicationEnabled: process.env.HAPPNER_REPLICATION_ENABLED,
			serialPort: process.env.ROUTER_SERIAL_PORT,
			baudRate: process.env.ROUTER_BAUD_RATE,
			incomingQueueDir: process.env.ROUTER_INCOMING_QUEUE_DIR,
			outgoingQueueDir: process.env.ROUTER_OUTGOING_QUEUE_DIR,
			queueFetchInterval: process.env.ROUTER_QUEUE_FETCH_INTERVAL,
			transmissionSendInterval: process.env.ROUTER_TRANSMISSION_SEND_INTERVAL,
			mySqlHost: process.env.MYSQL_HOST,
			mySqlUser: process.env.ROUTER_MYSQL_USER,
			mySqlPassword: process.env.ROUTER_MYSQL_PASSWORD,
			mySqlDb: process.env.ROUTER_MYSQL_DATABASE,
			systemType: process.env.ROUTER_SYSYEM_TYPE
		};
	}
});

module.exports = MockHappn;
