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
				MODE: "AXXIS100",

				USE_ENDPOINT: true,
				ENDPOINT_USERNAME: "intelliblast-state-001",
				ENDPOINT_PASSWORD: "ibstate",

				SYSTEM_FIRING_TIME: 120000,
				SYSTEM_REPORT_TIME: 300000,

				COMMUNICATION_CHECK_INTERVAL: 600000
			},
			env_production500: {
				NODE_ENV: "production",
				EDGE_INSTANCE_NAME: "edge_state",
				MODE: "AXXIS500",

				USE_ENDPOINT: true,
				ENDPOINT_USERNAME: "intelliblast-state-001",
				ENDPOINT_PASSWORD: "ibstate",

				SYSTEM_FIRING_TIME: 420000,
				SYSTEM_REPORT_TIME: 840000,

				COMMUNICATION_CHECK_INTERVAL: 600000
			}
		}
	],

	deploy: {
		"production-intelliblast-edge-001": {
			key: process.env.HOME + "/id_deploy",
			user: "admin",
			host: "intelliblast-edge-001",
			ref: "origin/stage-1.1",
			repo: "git@github.com:aecelectronics/Happner3_State.git",
			path: "/home/admin/state",
			"post-deploy": "npm install && pm2 reload ecosystem.config.js --env production"
		},
		"production-intelliblast-edge-002": {
			key: process.env.HOME + "/id_deploy",
			user: "admin",
			host: "intelliblast-edge-002",
			ref: "origin/stage-1.1",
			repo: "git@github.com:aecelectronics/Happner3_State.git",
			path: "/home/admin/state",
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
