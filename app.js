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
		queueService
	} = $happn.exchange;

	const { error: logError } = $happn.log;

	let startup = async () => {
		try {
			await portService.initialise();
			await packetRepository.initialise();
			await nodeRepository.initialise();
			await logsRepository.initialise();
			await warningsRepository.initialise();

			await queueService.initialise();
			await queueService.watchIncomingQueue();
			await queueService.watchOutgoingQueue();
			//$happn.exchange.transmissionService.initialise();
			$happn.log.info(
				"------------------- STARTUP COMPLETE -------------------"
			);
		} catch (err) {
			logError("start error", err);
			//process.exit(err.code || 1);
		}
	};

	return startup();
};

module.exports = App;
