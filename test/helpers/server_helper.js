var rslv = require('path').resolve,
	fork = require('child_process').fork;

function ServerHelper() {
	this.__serverProc = null;
}

ServerHelper.prototype.startServer = function () {

	return new Promise((resolve, reject) => {

		console.log(':: STARTING SERVER....');

		var server = rslv('server.js');

		this.__serverProc = fork(server);

		//this.__serverProc.on('message', (msg) => {
		//    console.log('server process message:', msg);
		//});

		this.__serverProc.on('error', (err) => {
			console.log(err);
			reject(err);
		});

		setTimeout(() => {
			resolve();
		}, 5000);
	});
};

ServerHelper.prototype.stopServer = function () {

	return new Promise((resolve) => {

		console.log(':: STOPPING TEST SERVER....');

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