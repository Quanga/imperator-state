function App() {}

/***
 * @summary Main Startup file for the App
 * @param $happn
 */
App.prototype.start = function($happn) {
	const {
		portService,
		packetRepository,
		nodeRepository,
		logsRepository,
		warningsRepository,
		queueService,
		serverService,
		transmissionService,
		dbConnectionService,
		security,
		eventService
	} = $happn.exchange;

	const { routerMode, routerType } = $happn.config;

	const { error: logError } = $happn.log;

	let startup = async () => {
		try {
			//Do not start the serialport if routerMode is SERVER

			security.listUsers("*").then(function(users) {
				console.log(users);
			});
			if (routerMode === "ROUTER") {
				await portService.initialise();
				await serverService.initialise();
			}

			await dbConnectionService.initialise();

			await nodeRepository.initialise();
			await packetRepository.initialise();
			await logsRepository.initialise();
			await warningsRepository.initialise();

			//initialized after the repos as it will do the checks
			await eventService.initialise();

			await queueService.initialise();
			await queueService.watchIncomingQueue();

			//Do not start the OUTGOING QUEUE or the TRANSMISSION SERVICE
			//if the mode is AXXIS
			if (routerType === "IBS") {
				await queueService.watchOutgoingQueue();
				transmissionService.initialise();
			}

			$happn.log.info("::::: STARTUP COMPLETE ::::::");
		} catch (err) {
			logError("start error", err);
			process.exit(err.code || 1);
		}
	};

	return startup();
};

module.exports = App;
