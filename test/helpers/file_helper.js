var rimraf = require('rimraf');
var async = require('async');
var path = require('path');
var Promise = require('bluebird');

function FileHelper() {
}

FileHelper.prototype.clearQueueFiles = function () {

	var inNew = path.resolve('./incoming_queue_data/new');
	var inCur = path.resolve('./incoming_queue_data/cur');
	var inTmp = path.resolve('./incoming_queue_data/tmp');

	var outNew = path.resolve('./outgoing_queue_data/new');
	var outCur = path.resolve('./outgoing_queue_data/cur');
	var outTmp = path.resolve('./outgoing_queue_data/tmp');

	var self = this;

	return new Promise(function (resolve, reject) {

		console.log(':: CLEARING QUEUES....');

		async.series([
			function (cb) {
				self.clearFiles(inNew)
					.then(cb)
					.catch(cb);
			}, function (cb) {
				self.clearFiles(inCur)
					.then(cb)
					.catch(cb);
			}, function (cb) {
				self.clearFiles(inTmp)
					.then(cb)
					.catch(cb);
			}, function (cb) {
				self.clearFiles(outNew)
					.then(cb)
					.catch(cb);
			}, function (cb) {
				self.clearFiles(outCur)
					.then(cb)
					.catch(cb);
			}, function (cb) {
				self.clearFiles(outTmp)
					.then(cb)
					.catch(cb);
			}
		], function (err) {

			if (err)
				return reject(err);

			resolve();
		});
	});

};

FileHelper.prototype.clearFiles = function (folderPath) {

	return new Promise(function (resolve, reject) {

		console.log('removing: ', folderPath);

		rimraf(folderPath + '/*', function (err, result) {
			if (err) {
				console.log('Error removing files: ', err);
				return reject(err);
			}

			resolve(result);
		});
	});
};

module.exports = FileHelper;