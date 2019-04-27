var Graphite = require("graphite-client");
var os = require("os");

function StatsService() {
	this.graphite = null;
	this.running = false;
}

StatsService.prototype.startClient = function($happn) {
	const { error: logError, info: logInfo } = $happn.log;

	return new Promise((resolve, reject) => {
		this.graphite = new Graphite(os.hostname(), 2003, "UTF-8");

		this.graphite.on("end", function() {
			this.running = false;
			logError("Graphite client disconnected");
		});

		this.graphite.on("error", function(error) {
			this.running = false;
			reject();
			logError("Graphite connection failure. " + error);
		});
		//this.running = true;

		this.graphite.connect(() => {
			console.log("CONNECTING", this.graphite);
			//this.running = true;
			logInfo("Connected to Graphite server");
			//this.write($happn, { happn: 2 });
			resolve();
		});
	});
};

StatsService.prototype.write = function($happn, payload) {
	if (this.running) {
		console.log(payload);
		this.graphite.write({ ...payload }, Date.now());
	}
};

module.exports = StatsService;
