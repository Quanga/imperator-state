module.exports.configs = {
	appConfig: {
		component: {
			config: {
				deviceType: process.env.ROUTER_SYSTEM_MODE,
				routerType: process.env.ROUTER_SYSTEM_TYPE,
				useEndpoint: process.env.ROUTER_USE_ENDPOINT
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
				systemType: process.env.ROUTER_SYSYEM_TYPE,
				systemFiringTime: process.env.SYSTEM_FIRING_TIME
			},
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
			name: "NodeRepository",
			config: {
				systemType: process.env.ROUTER_SYSYEM_TYPE
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
