/* eslint-disable no-unused-vars */
const pmx = require("@pm2/io");
const server = require("./server");
const path = require("path");
const os = require("os");
const fs = require("fs");

/**
 * @category System
 * @module app
 * @description  Entry point for the Happner Server to start the different components
 * after the mesh has loaded all the Modules and components
 * @mermaid graph LR
				A[HAPPNER] --> |config|B(App)
				B-->|entry|C[start]
				C-->D[START ALL OTHER PROCESSES]
 */

/**
 * @category System
 * @class App
 */
function App() {}

/**************************************
 * SERVICE AND APP STARTUP
 * ************************************
 */

/**
 * @summary Start the App from the Happner Framework Config.
  <ul>
  <li>Starts the App Component when Happner loads all components </li>
  <li>Checks whether a RESET arg has been supplied to the node process.</li>
  <li>Checks the Configuration to get its running information.</li>
  <li>runs [startRouter]{@link module:app~App#startRouter} if all check work</li>
  </ul><br>
 * @param {$happn} $happn Dependancy Injection of the Happner Framework
 * @returns {Promise} void
 * @mermaid graph LR
				A[Happner] -->|$happn| B(Start)
				B --> C{Check RESET}
				C -->|true| K[systemService.resetRouterData]
				K -->exit
				C -->|false| D[Update state]
				D --> E[Upsert History]
				E --> F{Check Config}
				F -->|false| G[updateState]
				F -->|true| H[startRouter]
 */
App.prototype.componentStart = function($happn) {
	const { log } = $happn;
	const { app, stateService, systemService } = $happn.exchange;

	return (async () => {
		await app.checkStartupArgs();
		await app.startPM2Actions();

		stateService.updateState({ service: $happn.name, state: "PENDING" });
		await systemService.upsertHistory({ started: Date.now() });

		const config = await systemService.checkConfiguration();

		if (!config.setupComplete) {
			stateService.updateState({ service: $happn.name, state: "INCOMPLETE" });
			log.warn("Setup available but incomplete - run ui to complete");
			log.warn("Then restart the process for changes to take effect!");
		}

		app.startRouter();
	})();
};

/**
* @summary Stops the App from the Happner Framework Config.
 <ul>
<li>Stops the App Component when Happner stops.</li>
<li> Writes a ShutDown time to the history info</li>
</ul><br>
 * @param {$happn} $happn Dependancy Injection of the Happner Framework
 * @returns {Promise} void
 */
App.prototype.componentStop = function($happn) {
	const { log } = $happn;
	const { systemService } = $happn.exchange;

	return (async () => {
		await systemService.upsertHistory({ stopped: Date.now() });
		log.info("Stopping State Server Application.............");
	})();
};

/**
 * @summary AppLand Startup of the Application Component by Component
 * @param {$happn} $happn Dependancy Injection of the Happner Framework
 * @returns {Promise} void
 * @mermaid graph LR
				A[Start] -.-> B(startRouter)
				B --> |1|C[nodeRepository.start]
				C -->D[logsRepository.start]
				D -->E[warningsRepo.start]
				E--> F[blastRepo.start]
				F -->G[queueService.initialise]
				G-->H[updateState:STARTED]
				B-->|2|I(stateService)
				I-->J(emit:STARTED)
 */
App.prototype.startRouter = function($happn) {
	const { nodeRepository, logsRepository, blastRepository } = $happn.exchange;
	const { warningsRepository, queueService, stateService } = $happn.exchange;
	const { dataService } = $happn.exchange;

	const { emit, log } = $happn;

	return (async () => {
		try {
			await nodeRepository.start();
			await logsRepository.start();
			await warningsRepository.start();
			await blastRepository.start();
			await dataService.initialise();
			queueService.initialise();

			stateService.updateState({ service: $happn.name, state: "STARTED" });
			emit("STARTED", true);
			log.info("::::: APP STARTUP COMPLETE ::::::");
		} catch (err) {
			log.error("start error", err);
			process.exit(err.code || 1);
		}
	})();
};

/**
 * @summary Starts triggers for PM2 to be able to clear users or whole system
 * @param {$happn} $happn Dependancy Injection of the Happner Framework
 * @returns {Promise} void
 */
App.prototype.startPM2Actions = function($happn) {
	const { app } = $happn.exchange;

	return (async () => {
		pmx.action("reset-config", async reply => {
			await app.reset("CONFIG");
		});

		pmx.action("reset-users", async reply => {
			app.resetUsers("USERS");
		});

		pmx.action("reset-hard", async reply => {
			app.hardReset("HARD");
		});
	})();
};

/**
 * @summary Starts triggers for PM2 to be able to clear users or whole system
 * @param {$happn} $happn Dependancy Injection of the Happner Framework
 * @returns {Promise} void
 */
App.prototype.checkStartupArgs = function($happn) {
	const { app } = $happn.exchange;

	return (async () => {
		switch (process.argv[2]) {
		case "reset-config": {
			return await app.reset("CONFIG");
		}
		case "reset-users": {
			return await app.reset("USERS");
		}
		case "reset-hard": {
			return await app.reset("HARD");
		}
		default:
			return false;
		}
	})();
};

/**
 * @summary full reset
 * @param {$happn} $happn Dependancy Injection of the Happner Framework
 * @returns {Promise} void
 * @mermaid graph LR
				A[reset] --> B(systemService.resetRouterData)
				C[reset-users] --> D(systemService.resetUsers
				D --> E(systemService.setStartupUsers)
* @todo NEED TO FIX THIS HARD RESET
			
 */
App.prototype.reset = function($happn, arg) {
	const { systemService } = $happn.exchange;
	const { log } = $happn;

	return (async () => {
		switch (arg) {
		case "CONFIG": {
			log.warn("Reset flag on start");
			log.warn("Database will be cleared and server stopped");
			await systemService.resetRouterData();
			log.warn("SERVER SHUTDOWN");
			return process.exit(1);
		}
		case "USERS": {
			log.warn("Server started with reset-user flag");
			log.warn("Database will be cleared and server stopped");

			await systemService.resetUsers();
			await systemService.setStartupUsers();
			log.warn("SERVER SHUTDOWN");
			return process.exit(1);
		}
		case "HARD": {
			log.warn("Server started with hard-reset flag");

			await new Promise(resolve => {
				log.warn("Database will be cleared and server stopped");
				let file;
				if (process.env.EDGE_DB) {
					file = path.resolve(os.homedir(), "./edge/db/", process.env.EDGE_DB);
				} else {
					console.log("EDGE_DB not set");
					process.exit(2);
				}

				fs.unlink(file, err => {
					if (err) {
						resolve("DATABASE FILE NOT FOUND - ", err.path);
					}

					resolve("DATABASE FILE REMOVED");
				});
				//server.stop();
			});
			console.log("COMPLETE");
			return process.exit(1);
		}
		}
	})();
};

module.exports = App;
