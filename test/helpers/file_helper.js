var rimraf = require("rimraf");
var path = require("path");

function FileHelper() {}

FileHelper.prototype.clearQueueFiles = function() {
	var inNew = path.resolve("./incoming_queue_data/new");
	var inCur = path.resolve("./incoming_queue_data/cur");
	var inTmp = path.resolve("./incoming_queue_data/tmp");

	var outNew = path.resolve("./outgoing_queue_data/new");
	var outCur = path.resolve("./outgoing_queue_data/cur");
	var outTmp = path.resolve("./outgoing_queue_data/tmp");

	var self = this;

	let clearQueuesSync = async function() {
		try {
			console.log(":: CLEARING QUEUES....");
			await self.clearFiles(inNew);
			await self.clearFiles(inCur);
			await self.clearFiles(inTmp);
			await self.clearFiles(outNew);
			await self.clearFiles(outCur);
			await self.clearFiles(outTmp);
		} catch (err) {
			console.log(err);
		}
	};

	return clearQueuesSync();
};

FileHelper.prototype.clearFiles = function(folderPath) {
	return new Promise(function(resolve, reject) {
		console.log("removing: ", folderPath);

		rimraf(folderPath + "/*", function(err, result) {
			if (err) {
				console.log("Error removing files: ", err);
				return reject(err);
			}

			resolve(result);
		});
	});
};

module.exports = FileHelper;
