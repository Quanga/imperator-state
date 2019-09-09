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
			env_production001: {
				NODE_ENV: "production",
				EDGE_INSTANCE_NAME: "intelliblast-state-001",
				MODE: "AXXIS100_CFC",
				USE_ENDPOINT: true,
				ENDPOINT_NAME: "intelliblast-edge-001",
				ENDPOINT_USERNAME: "intelliblast-state-001",
				ENDPOINT_PASSWORD: "ibstate",
				SYSTEM_FIRING_TIME: 120000,
				SYSTEM_REPORT_TIME: 300000,
				COMMUNICATION_CHECK_INTERVAL: 600000
			},
			env_production002: {
				NODE_ENV: "production",
				EDGE_INSTANCE_NAME: "intelliblast-state-001",
				MODE: "AXXIS100_CFC",
				USE_ENDPOINT: true,
				ENDPOINT_NAME: "intelliblast-edge-002",
				ENDPOINT_USERNAME: "intelliblast-state-001",
				ENDPOINT_PASSWORD: "ibstate",
				SYSTEM_FIRING_TIME: 120000,
				SYSTEM_REPORT_TIME: 300000,
				COMMUNICATION_CHECK_INTERVAL: 600000
			},
			env_production003: {
				NODE_ENV: "production",
				EDGE_INSTANCE_NAME: "intelliblast-state-001",
				MODE: "AXXIS100_CFC",
				USE_ENDPOINT: true,
				ENDPOINT_NAME: "intelliblast-edge-003",
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
				ENDPOINT_NAME: "intelliblast-edge-002",
				ENDPOINT_USERNAME: "intelliblast-state-001",
				ENDPOINT_PASSWORD: "ibstate",
				SYSTEM_FIRING_TIME: 420000,
				SYSTEM_REPORT_TIME: 840000,

				COMMUNICATION_CHECK_INTERVAL: 600000
			},
			env_productionAWS: {
				NODE_ENV: "production",
				EDGE_INSTANCE_NAME: "intelliblast-state-001",
				MODE: "AXXIS100_CFC",
				USE_ENDPOINT: true,
				ENDPOINT_NAME: "intelliblast-cloud-001",
				ENDPOINT_USERNAME: "intelliblast-state-001",
				ENDPOINT_PASSWORD: "ibstate",
				SYSTEM_FIRING_TIME: 120000,
				SYSTEM_REPORT_TIME: 300000,
				COMMUNICATION_CHECK_INTERVAL: 600000
			}
		}
	],

	deploy: {
		"production-intelliblast-edge-001": {
			key: process.env.HOME + "/id_deploy",
			user: "admin",
			host: "intelliblast-edge-001",
			ref: "origin/stage-1.3",
			repo: "git@github.com:aecelectronics/Happner3_State.git",
			path: "/home/admin/state",
			"post-deploy": "npm install && pm2 reload ecosystem.config.js --env production001"
		},
		"production-intelliblast-edge-002": {
			key: process.env.HOME + "/id_deploy",
			user: "admin",
			host: "intelliblast-edge-002",
			ref: "origin/stage-1.3",
			repo: "git@github.com:aecelectronics/Happner3_State.git",
			path: "/home/admin/state",
			"post-deploy": "npm install && pm2 reload ecosystem.config.js --env production002"
		},
		"production-intelliblast-edge-003": {
			key: process.env.HOME + "/id_deploy",
			user: "admin",
			host: "aece",
			ref: "origin/stage-1.3",
			repo: "git@github.com:aecelectronics/Happner3_State.git",
			path: "/home/admin/state",
			"post-deploy": "npm install && pm2 reload ecosystem.config.js --env production003"
		},
		production_aws: {
			user: "ec2-user",
			key: "~/aws_rsa.pem",
			host: "ec2-3-15-193-149.us-east-2.compute.amazonaws.com",
			ref: "origin/stage-1.3",
			repo: "git@github.com:aecelectronics/Happner3_State.git",
			path: "/home/ec2-user/state",
			"post-deploy": "npm install && pm2 reload ecosystem.config.js --env productionAWS"
		},
		production_aws2: {
			user: "ec2-user",
			key: "~/aws_rsa.pem",
			host: "ec2-18-222-93-135.us-east-2.compute.amazonaws.com",
			ref: "origin/stage-1.3",
			repo: "git@github.com:aecelectronics/Happner3_State.git",
			path: "/home/ec2-user/state",
			"post-deploy": "npm install && pm2 reload ecosystem.config.js --env productionAWS"
		}
	}
};

//1.tcp.ngrok.io:25833
