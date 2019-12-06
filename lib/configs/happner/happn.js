const path = require("path");
const os = require("os");

const getPath = (subFolder, envParam) => {
	if (!envParam) return null;
	return path.resolve(os.homedir(), `./edge/${subFolder}/`, envParam);
};

const HappnConfig = {
	happn: {
		//host: "localhost",
		port: parseInt(process.env.HAPPN_PORT) || 55000,
		setOptions: { timeout: 30000 },
		compactInterval: 180000,
		secure: process.env.SECURE_MESH === "true" ? true : false,
		adminPassword: process.env.MASTER_PASS || "happn",
		services: {
			security: {
				config: { pbkdf2Iterations: 1000 },
			},
			data: {
				config: {
					datastores: [
						{
							name: "persist",
							isDefault: true,
							settings: {
								filename: getPath("db", process.env.DEFAULT_DB) || getPath("db", "./edge.db"),
							},
							patterns: ["/_data/data/persist/*"],
						},
						{
							name: "nodes",
							settings: {
								filename: getPath("db", process.env.NODES_DB) || getPath("db", "./nodes.db"),
							},
							patterns: ["/_data/data/persist/nodes/*"],
						},
						{
							name: "logs",
							settings: {
								filename: getPath("db", process.env.LOGS_DB) || getPath("db", "./logs.db"),
							},
							patterns: ["/_data/data/persist/logs/*"],
						},
						{
							name: "warnings",
							settings: {
								filename: getPath("db", process.env.WARNINGS_DB) || getPath("db", "./warnings.db"),
							},
							patterns: ["/_data/data/persist/warnings/*"],
						},
						{
							name: "blasts",
							settings: {
								filename: getPath("db", process.env.BLASTS_DB) || getPath("db", "./blasts.db"),
							},
							patterns: ["/_data/data/persist/blasts/*"],
						},
						{
							name: "ui",
							settings: {
								filename: getPath("db", process.env.UI_DB) || getPath("db", "./ui.db"),
							},
							patterns: ["/_data/data/persist/system/*"],
						},
						{
							name: "mem",
							patterns: ["/_data/data/mem/*"],
						},
					],
				},
			},
		},
	},
};

module.exports = HappnConfig;
