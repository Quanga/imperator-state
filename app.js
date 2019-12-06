/* eslint-disable no-unused-vars */

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

//#region Happner Component Start and Stop

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
				F -->|true| H[startRouter]
 */
App.prototype.componentStart = function($happn) {
	const { app, systemService } = $happn.exchange;
	const { log } = $happn;

	return (async () => {
		try {
			const config = await systemService.checkConfiguration();

			if (!config.setupComplete) {
				log.warn("Setup available but incomplete - run ui to complete");
				log.warn("Then restart the process for changes to take effect!");
			}

			await app.startRouter();
		} catch (err) {
			log.error(err);
		}
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
	//const { systemService } = $happn.exchange;

	return (async () => {
		//await systemService.upsertHistory({ stopped: Date.now() });
	})();
};

//#endregion

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
				B-->|2|I(stateService)
				I-->J(emit:STARTED)
 */
App.prototype.startRouter = function($happn) {
	const { endpointService, dataService } = $happn.exchange;
	const { log } = $happn;

	return (async () => {
		try {
			await dataService.initialise();
			if (process.env.USE_INPUT_INSTANCE === "true") await endpointService.start();

			log.info(`System Mode: ${process.env.MODE}`);
			log.info("::::: APP STARTUP COMPLETE ::::::");
		} catch (err) {
			log.error("start error", err);
			process.exit(err.code || 1);
		}
	})();
};

module.exports = App;
