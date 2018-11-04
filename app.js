/**
 * Created by grant on 2016/06/27.
 */

function App() {}

App.prototype.start = function($happn) {
	let startup = async () => {
		try {
			await $happn.exchange.portService.initialise();
			await $happn.exchange.packetRepository.initialise();
			await $happn.exchange.nodeRepository.initialise();
			await $happn.exchange.logsRepository.initialise();
			await $happn.exchange.warningsRepository.initialise();

			await $happn.exchange.queueService.initialise();
			await $happn.exchange.queueService.watchIncomingQueue();
			await $happn.exchange.queueService.watchOutgoingQueue();
			//$happn.exchange.transmissionService.initialise();
			$happn.exchange.packetSimulatorService.initialise();
			$happn.log.info(
				"------------------- STARTUP COMPLETE -------------------"
			);
		} catch (err) {
			$happn.log.error("start error", err);
			process.exit(err.code || 1);
		}
	};

	return startup();
};

module.exports = App;
