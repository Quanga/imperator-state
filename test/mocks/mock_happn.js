/* eslint-disable no-unused-vars */
var Events = require("events");

var MockHappn = function() {
	this.name;
	this.__queueLength = 1;
	this.nodes = [];
	this.emitter = new Events.EventEmitter();

	this.emit = (message, val) => {
		console.log(`EMITTING-${message} ---${val}`);
		//this.emitter.emit(message);
	};

	this.log = {
		error: message => {
			console.log(message);
		},
		info: message => {
			console.log(message);
		},
		warn: message => {
			console.log(message);
		}
	};

	this.exchange = {
		incomingFileQueue: {
			length: () =>
				new Promise(resolve => {
					resolve(self.__queueLength);
					self.__queueLength -= 1;
				}),
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
			length: callback => {
				callback(null, self.__queueLength);
				self.__queueLength -= 1;
			},
			pop: callback => {
				callback(null, "my outgoing message");
			},
			push: () =>
				new Promise(function(resolve) {
					resolve();
				})
		},
		dataService: {
			insertPacketArr: () =>
				new Promise(function(resolve) {
					resolve(1);
				}),
			upsertNodeDataArr: () =>
				new Promise(function(resolve) {
					resolve();
				})
		},
		packetService: {
			extractData: message =>
				new Promise(function(resolve) {
					resolve();
				})
		},
		portUtil: {
			getInstance: () =>
				new Promise(function(resolve) {
					resolve({
						on: function(eventType, handler) {
							return true;
						}
					});
				})
		},
		messageHandler: {
			MessageReceiveHandler: () =>
				new Promise((resolve, reject) => {
					resolve(() => {
						return true;
					});
				})
		},
		parserFactory: {
			getParser: packet => {
				const parserFactory = require("../../lib/parsers/parser_factory");
				let newMock = new MockHappn();
				return new parserFactory().getParser(newMock, packet);
			}
		},
		nodeRepository: {
			getAllNodes: () =>
				new Promise(resolve => {
					resolve(self.nodes);
				})
		},
		logsRepository: {
			set: arg =>
				new Promise(resolve => {
					console.log("LOG CALLED", arg);
					resolve(arg);
				})
		},
		warningsRepository: {
			set: arg =>
				new Promise(resolve => {
					console.log("WARNING CALLED WITH", arg);
					resolve(arg);
				})
		},
		dataMapper: {
			mapInsertPacket: packet => {
				const mapper = require("../../lib/mappers/data_mapper");
				return new mapper().mapInsertPacket(packet);
			}
		},
		data: {},
		eventService: {
			persistWarning: warn => console.log("Warning", warn),
			processWarnings: error =>
				new Promise(resolve => {
					resolve(error);
				}),
			logPacketError: error =>
				new Promise(resolve => {
					resolve(error);
				})
		},
		stateService: {
			updateState: () =>
				new Promise(resolve => {
					resolve();
				})
		},
		queueService: {
			validatePacket: () =>
				new Promise(resolve => {
					resolve();
				})
		}
	};
};

Object.defineProperty(MockHappn.prototype, "config", {
	get: function() {
		return {};
	}
});

module.exports = MockHappn;
