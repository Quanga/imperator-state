module.exports = {
	apps: [
		{
			name: "edge_state",
			script: "server.js",
			instances: 1,
			autorestart: true,
			watch: false,
			max_memory_restart: "1G",
			env: {
				NODE_ENV: "development",
				EDGE_INSTANCE_NAME: "state",
				EDGE_LOCAL_IP: "0.0.0.0",
				EDGE_LOCAL_PORT: "55000",
				EDGE_LOCAL_LOG_FILE: "edge.log",
				LOG_LEVEL: "info",
				USE_ENDPOINT: "true",
				ENDPOINT_NAME: "edge_ssot",
				ENDPOINT_IP: "0.0.0.0",
				ENDPOINT_PORT: "55004",
				ROUTER_SHOW_QUEUE_DEBUG: "false",
				ROUTER_QUEUE_FETCH_INTERVAL: "1200",
				ROUTER_TRANSMISSION_SEND_INTERVAL: "1200",
				ROUTER_LOG_FILE: "./rpi_router.log",
				ROUTER_SYSTEM_MODE: "EDGE",
				ROUTER_SYSYEM_TYPE: "IBS",
				SYSTEM_FIRING_TIME: "120000",
				SYSTEM_REPORT_TIME: "300000",
				COMMUNICATION_CHECK_INTERVAL: "3000"
			},
			env_production: {
				NODE_ENV: "production"
			}
		}
	],

	deploy: {
		production: {
			user: "pi",
			host: "192.168.1.10",
			ref: "origin/new-dataModel",
			repo: "https://github.com/aecelectronics/Happner3_State.git",
			path: "/home/pi/state",
			"post-deploy":
				"npm install && pm2 reload ecosystem.config.js --env production"
		}
	}
};
