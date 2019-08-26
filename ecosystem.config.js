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
				NODE_ENV: "production",
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
				ENDPOINT_PASSWORD: "1234",

				SYSTEM_FIRING_TIME: 120000,
				SYSTEM_REPORT_TIME: 300000,

				COMMUNICATION_CHECK_INTERVAL: 600000
			},
			env_production500: {
				NODE_ENV: "production",
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
				ENDPOINT_PASSWORD: "1234",

				SYSTEM_FIRING_TIME: 420000,
				SYSTEM_REPORT_TIME: 840000,

				COMMUNICATION_CHECK_INTERVAL: 600000
			}
		}
	],

	deploy: {
		production: {
			user: "edge",
			host: ["192.168.1.28"],
			ref: "origin/stage-1.1",
			repo: "git@github.com:aecelectronics/Happner3_State.git",
			path: "/home/edge/state",
			"post-deploy": "npm install && pm2 reload ecosystem.config.js --env production"
		},
		"production-intelliblast-edge-001": {
			key: process.env.HOME + "/id_deploy",
			user: "admin",
			host: ["intelliblast-edge-001", "intelliblast-edge-002"],
			ref: "origin/stage-1.1",
			repo: "git@github.com:aecelectronics/Happner3_State.git",
			path: "/home/edge/state",
			"post-deploy": "npm install && pm2 reload ecosystem.config.js --env production"
		},
		production_aws: {
			user: "ec2-user",
			key: "~/aws_rsa.pem",
			host: "ec2-18-222-47-118.us-east-2.compute.amazonaws.com",
			ref: "origin/master",
			repo: "git@github.com:aecelectronics/Happner3_State.git",
			path: "/home/ec2-user/state",
			"post-deploy": "npm install && pm2 reload ecosystem.config.js --env production"
		}
	}
};
