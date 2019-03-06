require("dotenv").config();

var MockHappn = function () {
	this.__queueLength = 1;
	this.nodes = [];
};

Object.defineProperty(MockHappn.prototype, "log", {
	get: function () {
		return {
			// eslint-disable-next-line no-unused-vars
			error: function (message, err) {
				console.log(message);
				//throw err;
			},
			info: function (message) {
				console.log(message);
			}
		};
	}
});

Object.defineProperty(MockHappn.prototype, "config", {
	get: function () {
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

Object.defineProperty(MockHappn.prototype, "exchange", {
	get: function () {
		var self = this;

		return {
			incomingFileQueue: {
				length: function () {
					return new Promise(function (resolve) {
						resolve(self.__queueLength);
						self.__queueLength -= 1;
					});
				},
				pop: function () {
					return new Promise(function (resolve) {
						resolve("my incoming message");
					});
				},
				push: function () {
					return new Promise(function (resolve) {
						resolve("my incoming message");
					});
				}
			},
			outgoingFileQueue: {
				length: function (callback) {
					callback(null, self.__queueLength);
					self.__queueLength -= 1;
				},
				pop: function (callback) {
					callback(null, "my outgoing message");
				},
				push: function () {
					return new Promise(function (resolve) {
						resolve();
					});
				}
			},
			dataService: {
				insertPacketArr: function () {
					return new Promise(function (resolve) {
						resolve(1);
					});
				},
				upsertNodeDataArr: function () {
					return new Promise(function (resolve) {
						resolve();
					});
				}
			},
			packetService: {
				extractData: function (message) {
					return new Promise(function (resolve) {
						resolve({ message: message });
					});
				}
			},
			portUtil: {
				getInstance: function () {
					// eslint-disable-next-line no-unused-vars
					return new Promise(function (resolve, reject) {
						resolve({
							// eslint-disable-next-line no-unused-vars
							on: function (eventType, handler) {
								return true;
							}
						});
					});
				}
			},
			messageHandler: {
				MessageReceiveHandler: function () {
					// eslint-disable-next-line no-unused-vars
					return new Promise(function (resolve, reject) {
						resolve(function () {
							return true;
						});
					});
				}
			},
			parserFactory: {
				getParser: function (packet) {
					const parserFactory = require("../../lib/parsers/parser_factory");
					let newMock = new MockHappn();
					return new parserFactory().getParser(newMock, packet);
				}
			},

			dbConnectionService: {
				getConnection: function () {
					let newMock = new MockHappn();
					return self.dbInst.getConnection(newMock);
				}
			},
			nodeRepository: {
				getAllNodes: function () {
					// eslint-disable-next-line no-unused-vars
					return new Promise(function (resolve, reject) {
						resolve(self.nodes);
					});
				}
			},
			dataMapper: {
				mapInsertPacket: function (packet) {
					const mapper = require("../../lib/mappers/data_mapper");
					return new mapper().mapInsertPacket(packet);
				}
			}
		};
	}
});

module.exports = MockHappn;
