/* eslint-disable no-unused-vars */
const defaultConstant = require("./lib/constants/defaultAppConstants")
	.DefaultConstants;

const SerialPort = require("serialport");

function App() {
	this.componentState = {
		name: "App",
		path: "service/app",
		serviceStatus: "STOPPED",
		index: 0,
		type: "Flow Control",
		useGraphite: false
	};

	this.historyObj = {
		started: [],
		stopped: []
	};
}

App.prototype.setComponentStatus = function($happn, payload) {
	const { app } = $happn.exchange;
	const { componentState } = this;
	const { error: logError } = $happn.log;
	const update = { ...componentState, ...payload };

	app.setAppInfo(update, componentState.path);
	this.componentState = update;
};

/***
 * @summary Main Startup file for the App
 * @param $happn
 */
App.prototype.start = function($happn) {
	const { error: logError, info: logInfo, warn: logWarning } = $happn.log;
	const { app, security } = $happn.exchange;

	logInfo("STARTING ROUTER MODULES");

	let startupCheckAsync = async () => {
		try {
			SerialPort.list((err, ports) => {
				if (err) return console.log("ERR", err);

				console.log("PORTS:::::::::::::::", ports);
			});
		} catch (error) {
			console.log("ERRRRRR", error);
		}

		await app.getDepth();

		if (process.argv[2] === "reset") {
			await app.resetApp();
		}
		await app.writeHistory({ started: Date.now() });
		//await app.setComponentStatus({ serviceStatus: "STARTING" });

		this.configuration = await this.getAppInfo($happn);

		if (!this.configuration) {
			logInfo("No App data found - setting default information");
			this.configuration = await app.setAppInfo(
				new defaultConstant(),
				"persist/appData"
			);
		}
		//console.log(JSON.stringify(this.configuration, null, 2));
		this.configuration.security.defaultGroups.forEach(group => {
			security.upsertGroup(group, function(err, upserted) {
				if (err) logError("cannot create group", err);

				//logInfo("Group Upserted", upserted);
				//group was upserted, permissions were merged with existing group if it existed
			});
		});

		this.configuration.security.defaultUsers.forEach(user => {
			security.upsertUser(user, function(err, upserted) {
				if (err) logError("cannot create group", err);
			});
		});

		if (!this.configuration.setupComplete) {
			app.setComponentStatus({ serviceStatus: "INCOMPLETE" });
			logWarning("system is not set up to run, please use UI to setup");
		} else {
			this.startRouter($happn);
		}
	};

	return startupCheckAsync();
};

App.prototype.startRouter = function($happn) {
	const {
		app,
		portService,
		packetRepository,
		nodeRepository,
		logsRepository,
		warningsRepository,
		queueService,
		serverService
	} = $happn.exchange;

	const { error: logError } = $happn.log;

	let startup = async () => {
		try {
			const { configuration, services } = this.configuration;

			await nodeRepository.start();
			await packetRepository.start();
			await logsRepository.start();
			await warningsRepository.start();

			//initialized after the repos as it will do the checks
			//await eventService.initialise();
			await queueService.initialise();

			//Do not start the OUTGOING QUEUE or the TRANSMISSION SERVICE
			//if the mode is AXXIS
			if (configuration.meshType === "IBS") {
				//await queueService.watchOutgoingQueue();
				//transmissionService.initialise();
			}

			if (configuration.deviceType === "EDGE") {
				//Do not start the serialport if routerMode is SERVER

				if (!services.inputSource.commPort) {
					await portService.initialise();
				}
				await serverService.initialise();
			}

			app.setComponentStatus({ serviceStatus: "STARTED" });
			$happn.log.info("::::: APP STARTUP COMPLETE ::::::");
		} catch (err) {
			logError("start error", err);
			//process.exit(err.code || 1);
		}
	};

	return startup();
};

/* **********************************
GETTERS AND SETTERS FOR DATA
************************************* */

// eslint-disable-next-line no-unused-vars
App.prototype.getAppInfo = function($happn) {
	const { data } = $happn.exchange;

	return new Promise((resolve, reject) => {
		data.get("persist/appData", null, (error, response) => {
			if (error) return reject(error);

			return resolve(response);
		});
	});
};

App.prototype.setAppInfo = function($happn, payload, store) {
	const { data } = $happn.exchange;

	return new Promise((resolve, reject) => {
		data.set(store, payload, {}, (error, response) => {
			if (error) return reject(error);

			return resolve(response);
		});
	});
};

App.prototype.resetApp = function($happn) {
	const { data } = $happn.exchange;

	return new Promise((resolve, reject) => {
		data.remove("persist/appData", {}, (error, response) => {
			if (error) return reject(error);
			resolve(response);
		});
		data.remove("service/*", {}, (error, response) => {
			if (error) return reject(error);
			resolve(response);
		});

		data.remove("persist/history", {}, (error, response) => {
			if (error) return reject(error);
			resolve(response);
		});
	});
};

App.prototype.writeHistory = function($happn, incoming) {
	const { data } = $happn.exchange;

	const getAsync = () =>
		new Promise((resolve, reject) => {
			data.get("persist/history", null, (error, response) => {
				if (error) return reject(error);
				resolve(response);
			});
		});

	const writeAsync = payload =>
		new Promise((resolve, reject) => {
			data.set("persist/history", payload, {}, (error, response) => {
				if (error) return reject(error);

				return resolve(response);
			});
		});

	const writeHistoryAsync = async updatedVal => {
		try {
			let history = await getAsync();
			if (!history) history = this.historyObj;
			const propkey = Object.keys(updatedVal);
			propkey.forEach(prp => {
				if (history.hasOwnProperty(prp)) {
					if (history[prp] instanceof Array) {
						return history[prp].push(updatedVal[prp]);
					} else {
						return (history[prp] = updatedVal[prp]);
					}
				} else {
					return (history[prp] = updatedVal[prp]);
				}
			});
			//console.log("HISTORY", history);

			await writeAsync(history);
		} catch (error) {
			console.log(error);
			return Promise.reject(error);
		}
	};
	return writeHistoryAsync(incoming);
};

App.prototype.stop = function($happn) {
	const { app } = $happn.exchange;
	const stopAsync = async () => {
		await app.writeHistory({ stopped: Date.now() });
		$happn.log.info("stopping app component");
	};
	return stopAsync();
};

App.prototype.getDepth = function($happn) {
	const { data } = $happn.exchange;

	return new Promise((resolve, reject) => {
		data.getPaths("persist/*", (error, response) => {
			if (error) return reject(error);

			//console.log(response);
			return resolve(response);
		});
	});
};

module.exports = App;
