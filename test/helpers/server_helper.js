const rslv = require("path").resolve;
const { fork } = require("child_process");

function ServerHelper() {
	this.__serverProc = null;
}

ServerHelper.prototype.startServer = function() {
	return new Promise((resolve, reject) => {
		console.log(":: STARTING SERVER............");
		if (this.__serverProc === null) {
			var server = rslv("server.js");

			this.__serverProc = fork(server, {
				silent: false,
				detached: true
			});

			// this.__serverProc.on("message", msg => {
			// 	console.log("server process message:", msg);
			// });

			this.__serverProc.on("error", err => {
				console.log(err);
				reject(err);
			});

			this.__serverProc.on("exception", function(err) {
				console.log(err);
			});
		}
		resolve();
	});
};

ServerHelper.prototype.stopServer = function() {
	return new Promise(resolve => {
		console.log(":: STOPPING TEST SERVER....");

		try {
			this.__serverProc.kill();
			resolve();
		} catch (err) {
			console.log(err);
			resolve();
		}
	});
};

module.exports = ServerHelper;
