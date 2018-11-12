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
				queueFetchInterval: process.env.ROUTER_QUEUE_FETCH_INTERVAL
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
			config: {
				// nodeEnv: process.env.NODE_ENV,
			}
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
			config: {
				// nodeEnv: process.env.NODE_ENV,
				// edgeIP: process.env.EDGE_IP,
				// edgePort: process.env.HAPPNER_EDGE_PORT,
			}
		}
	},
	packetRepositoryConfig: {
		component: {
			name: "PacketRepository",
			config: {
				mySqlHost: process.env.ROUTER_MYSQL_HOST,
				mySqlUser: process.env.ROUTER_MYSQL_USER,
				mySqlPassword: process.env.ROUTER_MYSQL_PASSWORD,
				mySqlDb: process.env.ROUTER_MYSQL_DATABASE
			}
		}
	},
	nodeRepositoryConfig: {
		component: {
			name: "NodeRepository",
			config: {
				mySqlHost: process.env.ROUTER_MYSQL_HOST,
				mySqlUser: process.env.ROUTER_MYSQL_USER,
				mySqlPassword: process.env.ROUTER_MYSQL_PASSWORD,
				mySqlDb: process.env.ROUTER_MYSQL_DATABASE
			}
		}
	},
	logsRepositoryConfig: {
		component: {
			name: "LogsRepository",
			config: {
				mySqlHost: process.env.ROUTER_MYSQL_HOST,
				mySqlUser: process.env.ROUTER_MYSQL_USER,
				mySqlPassword: process.env.ROUTER_MYSQL_PASSWORD,
				mySqlDb: process.env.ROUTER_MYSQL_DATABASE
			}
		}
	},
	warningsRepositoryConfig: {
		component: {
			name: "WarningsRepository",
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
