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
				NODE_ENV: "development"
			},
			env_production: {
				EDGE_INSTANCE_NAME: "edge_state",
				EDGE_DB: "./edge.db",
				EDGE_LOCAL_IP: "0.0.0.0",
				EDGE_LOCAL_PORT: "55000",
				EDGE_LOCAL_LOG_FILE: "./edge.log",
				LOG_LEVEL: "info",

				USE_ENDPOINT: "true",
				ENDPOINT_NAME: "edge_ssot",
				ENDPOINT_IP: "0.0.0.0",
				ENDPOINT_PORT: "55004",

				ENDPOINT_USERNAME: "MESH_UNIT",
				ENDPOINT_PASSWORD: "happn",

				SYSTEM_FIRING_TIME: "120000",
				SYSTEM_REPORT_TIME: "180000",

				COMMUNICATION_CHECK_INTERVAL: "3000"
			}
		}
	],

	deploy: {
		production: {
			user: "edge",
			host: "192.168.1.10",
			ref: "origin/master",
			repo: "git@github.com:aecelectronics/Happner3_State.git",
			path: "/home/edge/state",
			"post-deploy":
				"npm install && pm2 reload ecosystem.config.js --env production"
		}
	}
};
