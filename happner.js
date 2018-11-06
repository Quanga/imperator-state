module.exports.configs = {
	queueServiceConfig: {
		component: {
			name: "QueueService",
			config: {
				incomingQueueDir: process.env.ROUTER_INCOMING_QUEUE_DIR,
				outgoingQueueDir: process.env.ROUTER_OUTGOING_QUEUE_DIR,
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
				// edgeIP: process.env.EDGE_IP,
				// edgePort: process.env.HAPPNER_EDGE_PORT,
				// localIP: process.env.HAPPNER_LOCAL_IP,
				// localPort: process.env.HAPPNER_LOCAL_PORT,
				// replicationEnabled: process.env.HAPPNER_REPLICATION_ENABLED === "false",
				// mySqlHost: process.env.MYSQL_HOST,
				// mySqlUser: process.env.ROUTER_MYSQL_USER,
				// mySqlPassword: process.env.ROUTER_MYSQL_PASSWORD,
				// mySqlDb: process.env.ROUTER_MYSQL_DATABASE,
				// mySqlConnectionLimit: process.env.ROUTER_MYSQL_CONNECTION_LIMIT,
				// disableIB651Inserts: process.env.DISABLE_IB651_INSERTS === "true"
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
				// localIP: process.env.HAPPNER_LOCAL_IP,
				// localPort: process.env.HAPPNER_LOCAL_PORT,
				// replicationEnabled: process.env.HAPPNER_REPLICATION_ENABLED === "false",
				// mySqlHost: process.env.MYSQL_HOST,
				// mySqlUser: process.env.ROUTER_MYSQL_USER,
				// mySqlPassword: process.env.ROUTER_MYSQL_PASSWORD,
				// mySqlDb: process.env.ROUTER_MYSQL_DATABASE,
				// mySqlConnectionLimit: process.env.ROUTER_MYSQL_CONNECTION_LIMIT,
				// disableIB651Inserts: process.env.DISABLE_IB651_INSERTS === "true"
			}
		}
	},
	packetRepositoryConfig: {
		component: {
			name: "PacketRepository",
			config: {
				mySqlHost: process.env.MYSQL_HOST,
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
				mySqlHost: process.env.MYSQL_HOST,
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
				mySqlHost: process.env.MYSQL_HOST,
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
				mySqlHost: process.env.MYSQL_HOST,
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
	}
};
