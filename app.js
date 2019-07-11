/* eslint-disable no-unused-vars */
const defaultConstant = require("./lib/constants/defaultAppConstants")
	.DefaultConstants;

function App() {
	this.historyObj = {
		started: [],
		stopped: []
	};
}

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

	// console.log("test");
	// $happn.event.security.on(
	// 	"*",
	// 	(data, meta) => {
	// 		console.log(data, meta);
	// 	},
	// 	(err, evnth) => {
	// 		if (err) console.log(err);
	// 	}
	// );
	// logInfo("Starting State Server Application.............");
	// $happn.exchange.mesh.on("endpoint-reconnect-scheduled", evt => {
	// 	console.log("ERROR RECONNECTING", evt.endpointName);
	// });

	// $happn.on("endpoint-reconnect-successful", evt => {
	// 	console.log("RECONNECTED", evt.endpointName);
	// });

	// $happn.on("connection-ended", evt => {
	// 	console.log("CONNECTION ENDED", evt.endpointName);
	// });

	return (async () => {
		//check for startup with RESET variable
		if (process.argv[2] === "reset") {
			logWarning("Server started with reset flag");
			logWarning("Database will be cleared and server stopped");

			await app.resetRouterData();
			return process.exit(1);
		}
		//start the server
		app.startRouter();
	})();
};

App.prototype.stop = function($happn) {
	const { info: logInfo } = $happn.log;
	const { app } = $happn.exchange;

	return (async () => {
		await app.writeHistory({ stopped: Date.now() });
		logInfo("Stopping State Server Application.............");
	})();
};

App.prototype.startRouter = function($happn) {
	const { app, stateService } = $happn.exchange;
	const { warn: logWarning } = $happn.log;

	return (async () => {
		stateService.updateState({ service: $happn.name, state: "PENDING" });

		await app.writeHistory({ started: Date.now() });
		await app.checkConfiguration();

		if (!this.configuration.setupComplete) {
			stateService.updateState({ service: $happn.name, state: "INCOMPLETE" });
			logWarning("SETUP INCOMPLETE - RUN UI TO COMPLETE");
		} else {
			this.startRouter($happn);
		}
	})();
};

App.prototype.checkConfiguration = function($happn) {
	const { app, security } = $happn.exchange;
	const { warn, error: logError } = $happn.log;

	return (async () => {
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
			});
		});

		this.configuration.security.defaultUsers.forEach(user => {
			security.upsertUser(user, function(err, upserted) {
				if (err) logError("cannot create group", err);
			});
		});

		const { setupIssues } = this.configuration;
		setupIssues.length = 0;

		if (this.configuration.identifier.name === "") {
			setupIssues.push("Identifier Name not set!");
			warn("CONFIG- ID NAME NOT SET");
		}

		if (setupIssues.length === 0) {
			this.configuration.setupComplete = true;
		}

		await app.setRouterConfigData(this.configuration, "persist/configuration");
	})();
};

App.prototype.startRouter = function($happn) {
	const {
		stateService,
		nodeRepository,
		logsRepository,
		blastRepository,
		warningsRepository,
		queueService
	} = $happn.exchange;

	const { error: logError, info: logInfo } = $happn.log;
	const { emit } = $happn;

	return (async () => {
		try {
			await nodeRepository.start();
			await logsRepository.start();
			await warningsRepository.start();
			await blastRepository.start();
			queueService.initialise();

			stateService.updateState({ service: $happn.name, state: "STARTED" });
			emit("STARTED", true);
			logInfo("::::: APP STARTUP COMPLETE ::::::");
		} catch (err) {
			logError("start error", err);
			//process.exit(err.code || 1);
		}
	})();
};

/* **********************************
GETTERS AND SETTERS FOR DATA - CONFIGURATION
************************************* */

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

			await writeAsync(history);
		} catch (error) {
			console.log(error);
			return Promise.reject(error);
		}
	};
	return writeHistoryAsync(incoming);
};

module.exports = App;
