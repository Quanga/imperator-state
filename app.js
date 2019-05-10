/* eslint-disable no-unused-vars */
const defaultConstant = require("./lib/constants/defaultAppConstants")
	.DefaultConstants;
const Serialport = require("serialport");

var os = require("os");

function App() {
	this.service = "App";
	this.serviceStatus = "STOPPED";

	this.historyObj = {
		started: [],
		stopped: []
	};
}

/**
 * payload: {service: "App", serviceStatus: "STOPPED"};
 */
App.prototype.setAppServiceState = function($happn, payload) {
	const { app } = $happn.exchange;
	const setAppStateAsync = async () => {
		const serviceState = await app.getServiceState(payload.service);
		const update = { ...serviceState, ...payload };
		app.setServiceState(update);
	};

	return setAppStateAsync();
};

/**************************************
 * SERVICE AND APP STARTUP
 * ************************************
 */

/***
 * @summary Main Startup file for the App
 * @param $happn
 */
App.prototype.start = function($happn) {
	const { info: logInfo, warn: logWarning } = $happn.log;
	const { app } = $happn.exchange;

	logInfo("STARTING ROUTER APP");

	let startupCheckAsync = async () => {
		//check for startup with RESET variable
		if (process.argv[2] === "reset") {
			logWarning("SERVER STARTED WITH RESET ARGUMENT");
			await app.resetRouterData();
		}

		await app.restartRouter();
	};

	return startupCheckAsync();
};

App.prototype.stop = function($happn) {
	const { info: logInfo } = $happn.log;
	const { app } = $happn.exchange;
	const stopAsync = async () => {
		await app.writeHistory({ stopped: Date.now() });
		logInfo("STOPPING ROUTER APP");
	};
	return stopAsync();
};

/***
 * @summary this is seperate to that the UI can restart the UI once setup has been done
 * @param $happn
 */
App.prototype.restartRouter = function($happn) {
	const { app } = $happn.exchange;
	const { warn: logWarning } = $happn.log;

	const restartAsync = async () => {
		let services = await app.getAllServiceStates();
		let allStopped = services.map(x => ({ ...x, serviceStatus: "STOPPED" }));

		allStopped.forEach(async x => await app.setAppServiceState(x));

		await app.setAppServiceState({
			service: this.service,
			serviceStatus: "STARTING"
		});
		await app.writeHistory({ started: Date.now() });
		//await app.setComponentStatus({ serviceStatus: "STARTING" });

		await app.checkConfiguration(); //check for configuration

		if (!this.configuration.setupComplete) {
			//if complete start all
			app.setAppServiceState({
				service: this.service,
				serviceStatus: "INCOMPLETE"
			});
			logWarning("SETUP INCOMPLETE - RUN UI TO COMPLETE");
		} else {
			this.startRouter($happn);
		}
	};

	return restartAsync();
};

App.prototype.checkConfiguration = function($happn) {
	const { app, security } = $happn.exchange;
	const { warn, error: logError } = $happn.log;

	const checkConfigAsync = async () => {
		this.configuration = await app.getRouterConfigData();
		if (!this.configuration) {
			warn("NO CONFIGURATION DATA FOUND - APPLYING DEFAULT");
			this.configuration = await app.setRouterConfigData(
				new defaultConstant(),
				"persist/configuration"
			);
			warn("DEFAULT CONFIGURATION DATA SET");
		}

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

		const localPorts = await Serialport.list();

		this.configuration.localPorts = localPorts.map(x => {
			return x.comName;
		});

		const setPort = this.configuration.localPorts.find(
			x => x === this.configuration.inputSource.comPort
		);
		/**
		 * { comName: '/dev/tty.Bluetooth-Incoming-Port',
		 */
		const { setupIssues } = this.configuration;
		setupIssues.length = 0;

		if (!setPort) {
			setupIssues.push("Comm Port not set!");
			warn("CONFIG- COMM PORT NOT SET");
		}
		if (this.configuration.identifier.name === "") {
			setupIssues.push("Identifier Name not set!");
			warn("CONFIG- ID NAME NOT SET");
		}

		if (setupIssues.length === 0) {
			this.configuration.setupComplete = true;
		}

		await app.setRouterConfigData(this.configuration, "persist/configuration");
	};
	return checkConfigAsync();
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

	const { error: logError, info: logInfo } = $happn.log;

	let startup = async () => {
		try {
			const { configuration, services } = this.configuration;

			this.interval = setInterval(() => {
				const host = os.hostname();
				const metric = {
					ts: Date.now(),
					key: "cpu",
					val: os.loadavg()[0]
				};

				this.reportMetric($happn, host, metric, (err, resp) => {
					if (err) return console.log(err);

					return resp;
				});
			}, 1000);

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
				await portService.initialise();
				await serverService.initialise();
			}

			app.setAppServiceState({
				service: this.service,
				serviceStatus: "STARTED"
			});
			logInfo("::::: APP STARTUP COMPLETE ::::::");
		} catch (err) {
			logError("start error", err);
			//process.exit(err.code || 1);
		}
	};

	return startup();
};

/* **********************************
GETTERS AND SETTERS FOR DATA - CONFIGURATION
************************************* */

// eslint-disable-next-line no-unused-vars
App.prototype.getRouterConfigData = function($happn) {
	const { data } = $happn.exchange;

	return new Promise((resolve, reject) => {
		data.get("persist/configuration", null, (error, response) => {
			if (error) return reject(error);

			return resolve(response);
		});
	});
};

App.prototype.setRouterConfigData = function($happn, payload) {
	const { data } = $happn.exchange;

	return new Promise((resolve, reject) => {
		data.set("persist/configuration", payload, {}, (error, response) => {
			if (error) return reject(error);

			return resolve(response);
		});
	});
};

App.prototype.resetRouterData = function($happn) {
	const { data } = $happn.exchange;

	return new Promise((resolve, reject) => {
		data.remove("*", {}, (error, response) => {
			if (error) return reject(error);
			resolve(true);
		});
	});
};

/* **********************************
GETTERS AND SETTERS FOR DATA - SERVICE STATE
************************************* */

App.prototype.getAllServiceStates = function($happn) {
	const { data } = $happn.exchange;

	return new Promise((resolve, reject) => {
		data.get(`persist/service/*`, null, (error, response) => {
			if (error) return reject(error);

			if (!response) return resolve([]);
			return resolve(response);
		});
	});
};

App.prototype.getServiceState = function($happn, service) {
	const { data } = $happn.exchange;

	return new Promise((resolve, reject) => {
		data.get(`persist/service/${service}`, null, (error, response) => {
			if (error) return reject(error);

			return resolve(response);
		});
	});
};

App.prototype.setServiceState = function($happn, payload) {
	const { data } = $happn.exchange;

	return new Promise((resolve, reject) => {
		data.set(
			`persist/service/${payload.service}`,
			payload,
			{},
			(error, response) => {
				if (error) return reject(error);

				return resolve(response);
			}
		);
	});
};

/* **********************************
GETTERS AND SETTERS FOR DATA - HISTORY
************************************* */

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

/* **********************************
METRICS
************************************* */

App.prototype.reportMetric = function($happn, hostname, metric, callback) {
	var eventKey = `metrics/${metric.key}`;
	var eventData = metric;

	//console.log("emitting", eventKey, eventData);
	$happn.emit(eventKey, eventData);
};

module.exports = App;
