module.exports.configs = {
	appConfig: {
		component: {
			config: {
				routerMode: process.env.ROUTER_SYSTEM_MODE,
				routerType: process.env.ROUTER_SYSTEM_TYPE,
				useEndpoint: process.env.ROUTER_USE_ENDPOINT
			}
		}
	},
	queueServiceConfig: {
		component: {
			name: "QueueService",
			config: {
				incomingQueueDir: process.env.ROUTER_INCOMING_QUEUE_DIR,
				outgoingQueueDir: process.env.ROUTER_OUTGOING_QUEUE_DIR,
				endpointQueueDir: process.env.ROUTER_ENDPOINT_QUEUE_DIR,
				queueFetchInterval: process.env.ROUTER_QUEUE_FETCH_INTERVAL,
				showQueueDebug: process.env.ROUTER_SHOW_QUEUE_DEBUG
			}
		}
	},
	portUtilConfig: {
		component: {
			name: "PortUtil",
			config: {
				port: process.env.ROUTER_SERIAL_PORT,
				baudRate: process.env.ROUTER_BAUD_RATE
			}
		}
	},
	dataServiceConfig: {
		component: {
			name: "DataService",
			config: {}
		}
	},
	serverServiceConfig: {
		component: {
			name: "ServerService",
			config: {
				replicationEnabled: process.env.REPLICATION_ENABLED,
				endpoint: process.env.REPLICATION_ENDPOINT,
				port: process.env.REPLICATION_PORT
			}
		}
	},
	eventServiceConfig: {
		component: {
			name: "EventService",
			config: {},
			routes: {
				//'model/*': 'persist',
				"model/*": "mem"
			}
		}
	},
	packetRepositoryConfig: {
		component: {
			name: "PacketRepository",
			config: {}
		}
	},
	nodeRepositoryConfig: {
		component: {
			name: "NodeRepository"
		}
	},
	logsRepositoryConfig: {
		component: {
			name: "LogsRepository",
			config: {}
		}
	},
	warningsRepositoryConfig: {
		component: {
			name: "WarningsRepository",
			config: {}
		}
	},
	dbConnectionConfig: {
		component: {
			name: "DbConnectionService",
			config: {
				mySqlHost: process.env.ROUTER_MYSQL_HOST,
				mySqlUser: process.env.ROUTER_MYSQL_USER,
				mySqlPassword: process.env.ROUTER_MYSQL_PASSWORD,
				mySqlDb: process.env.ROUTER_MYSQL_DATABASE
			}
		}
	},
	transmissionServiceConfig: {
		component: {
			name: "TransmissionService",
			config: {
				transmissionSendInterval: process.env.ROUTER_TRANSMISSION_SEND_INTERVAL
			}
		}
	},

	messageHandlerConfig: {
		component: {
			config: {
				useEndpoint: process.env.ROUTER_USE_ENDPOINT
			}
		}
	}
};
