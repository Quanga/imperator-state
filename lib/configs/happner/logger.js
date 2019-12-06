const path = require("path");
const os = require("os");

const getPath = (subFolder, envParam) => {
	if (!envParam) return null;
	return path.resolve(os.homedir(), `./edge/${subFolder}/`, envParam);
};

const LoggerConfig = () => ({
	util: {
		logCacheSize: 1000,
		logLevel: process.env.LOG_LEVEL || "info",
		logTimeDelta: true,
		logStackTraces: true,
		logComponents: [],
		logMessageDelimiter: "\t",
		logDateFormat: null,
		logLayout: null,
		logFile: getPath("logs", process.env.LOG_FILE || "./edge.log"),
		logFileMaxSize: 1048576,
		logFileBackups: 5,
		logFileNameAbsolute: true,
		logger: null,
	},
});

module.exports = LoggerConfig;
