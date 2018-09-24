/**
 * Created by grant on 2016/06/27.
 */

function App() {}

App.prototype.start = function ($happn) {
	$happn.log.info("READY!");


	var quit = function (err) {
		process.exit(err.code || 1);
	};

	return new Promise((resolve, reject) => {
		$happn.exchange.queueService.initialise()
			.then(() => {
				return $happn.exchange.portService.initialise();
			})
			.then(()=>{
				return $happn.exchange.packetRepository.initialise();
			})
			.then(()=>{
				return $happn.exchange.nodeRepository.initialise();
			})
			.then( ()=> {
				return $happn.exchange.queueService.watchIncomingQueue();
			})
			.then(function () {
				return $happn.exchange.queueService.watchOutgoingQueue();
			})
			.then(function () {
				$happn.exchange.transmissionService.initialise();
			})
			.then(() => {
				$happn.log.info("READY!");
				resolve();
			})
			.catch((err) => {
				$happn.log.error("start error", err);
				quit(err);

				reject(err);
			});
	});

	
};


module.exports = App;