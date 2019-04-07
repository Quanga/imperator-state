/* eslint-disable no-unused-vars */
const stateConst = require("./lib/constants/stateConstants");
const defaultConstant = require("./lib/constants/defaultConstants");

function App() {
	this.services = {
		portService: { state: stateConst.stopped },
		queueService: { state: stateConst.stopped }
	};
}

/***
 * @summary Main Startup file for the App
 * @param $happn
 */
App.prototype.startApp = function($happn) {
	const { error: logError, info: logInfo } = $happn.log;

	logInfo("STARTING ROUTER MODULES");

	let startupCheckAsync = async () => {
		this.dataState = await this.getPersistedAppInfo($happn);
		if (!this.dataState) {
			await this.resetApp($happn);
			this.dataState = defaultConstant;
		}
		await this.setAppInfo($happn, { status: stateConst.stopped }, "mem");

		if (!this.dataState) {
			this.dataState = await this.getPersistedAppInfo($happn);
		}

		if (!this.dataState.setupComplete) {
			logError("system is not set up to run, please use UI to setup");
			await this.setAppInfo($happn, { status: stateConst.idle_we }, "mem");
		} else {
			await this.setAppInfo($happn, { status: stateConst.starting }, "mem");
			this.startRouter($happn);
		}
	};

	return startupCheckAsync();
};

App.prototype.startRouter = function($happn) {
	const {
		portService,
		packetRepository,
		nodeRepository,
		logsRepository,
		warningsRepository,
		queueService,
		serverService,
		transmissionService,
		eventService
	} = $happn.exchange;

	const { error: logError } = $happn.log;

	let startup = async () => {
		try {
			const appConfig = await this.getAppInfo($happn);

			//if (this.dataState.useExternalDb) {
			//await dbConnectionService.initialise();
			//}

			await nodeRepository.initialise();
			await packetRepository.initialise();
			await logsRepository.initialise();
			await warningsRepository.initialise();

			//initialized after the repos as it will do the checks
			//await eventService.initialise();
			await queueService.initialise();

			//Do not start the OUTGOING QUEUE or the TRANSMISSION SERVICE
			//if the mode is AXXIS
			if (appConfig.meshType === "IBS") {
				//await queueService.watchOutgoingQueue();
				//transmissionService.initialise();
			}

			if (appConfig.deviceType === "EDGE") {
				//Do not start the serialport if routerMode is SERVER

				if (!appConfig.inputSource.comPort) {
					await portService.initialise();
				}
				await serverService.initialise();
			}

			await this.setAppInfo($happn, { status: stateConst.started }, "mem");
			$happn.log.info("::::: APP STARTUP COMPLETE ::::::");
		} catch (err) {
			logError("start error", err);
			process.exit(err.code || 1);
		}
	};

	return startup();
};

/* **********************************
GETTERS AND SETTERS FOR DATA
************************************* */

App.prototype.getAppState = function($happn) {
	const { data } = $happn.exchange;

	return new Promise((resolve, reject) => {
		data.get("mem", null, (error, response) => {
			if (error) return reject(error);
			resolve(response);
		});
	});
};

// eslint-disable-next-line no-unused-vars
App.prototype.getAppInfo = function($happn) {
	return new Promise(resolve => {
		resolve(this.dataState);
	});
};

App.prototype.getPersistedAppInfo = function($happn) {
	const { data } = $happn.exchange;

	return new Promise((resolve, reject) => {
		data.get("persist", null, (error, response) => {
			if (error) return reject(error);
			resolve(response);
		});
	});
};

App.prototype.setAppInfo = function($happn, payload, store) {
	const { data } = $happn.exchange;

	return new Promise((resolve, reject) => {
		data.set(store, payload, {}, (error, response) => {
			if (error) return reject(error);
			resolve(response);
		});
	});
};

App.prototype.resetApp = function($happn) {
	return new Promise((resolve, reject) => {
		this.setAppInfo($happn, new defaultConstant(), "persist")
			.then(() => {
				resolve();
			})
			.catch(err => reject(err));
	});
};

App.prototype.stopApp = function($happn) {
	return new Promise(resolve => {
		$happn.log.info("stopping app component");
		resolve();
	});
};

module.exports = App;
