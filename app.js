/* eslint-disable no-unused-vars */

/**
 * @category System
 * @module App
 * @description  Entry point for the Happner Server to start the different components
 * after the mesh has loaded all the Modules and components
 * @mermaid graph LR
				A[HAPPNER] --> |config|B(App)
				B-->|entry|C[start]
				C-->D[START ALL OTHER PROCESSES]
 */

/**
 * @class
 */
function App() {}

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
 */
App.prototype.componentStart = function($happn) {
	const { app, systemService, security } = $happn.exchange;
	const { log } = $happn;

	return (async () => {
		try {
			security.deactivateSessionActivity(true, e => {});
			security.deactivateSessionManagement(true, e => {});
			await systemService.upsertHistory({ started: Date.now() });

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
	const { systemService } = $happn.exchange;
	const { log } = $happn;

	return (async () => {
		await systemService.upsertHistory({ stopped: Date.now() });
		log.info("SYSTEM STOPPED");
	})();
};

/**
 * @summary AppLand Startup of the Application Component by Component
 * @param {$happn} $happn Dependancy Injection of the Happner Framework
 * @returns {Promise} void
 */
App.prototype.startRouter = function($happn) {
	const { endpointService, dataService } = $happn.exchange;
	const { env } = $happn.config;
	const { log } = $happn;

	return (async () => {
		try {
			await dataService.initialise();
			if (env.useEndpoint) await endpointService.start();

			log.info(`System Mode: ${env.systemMode}`);
			log.info("::::: APP STARTUP COMPLETE ::::::");
		} catch (err) {
			log.error("start error", err);
			process.exit(err.code || 1);
		}
	})();
};

module.exports = App;
