/* eslint-disable no-unused-vars */
function StatsService() {
	this.graphite = null;
	this.running = false;
}

StatsService.prototype.startClient = function($happn) {
	const { log } = $happn;

	//return new Promise((resolve, reject) => {});
};

StatsService.prototype.write = function($happn, payload) {
	if (this.running) {
		console.log(payload);
		this.graphite.write({ ...payload }, Date.now());
	}
};

module.exports = StatsService;
