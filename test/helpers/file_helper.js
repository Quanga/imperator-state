var rimraf = require("rimraf");

function FileHelper() { }

FileHelper.prototype.clearQueueFiles = function () {


	//var self = this;

	let clearQueuesSync = async function () {
		try {
			console.log(":: CLEARING QUEUES....");

		} catch (err) {
			console.log(err);
		}
	};

	return clearQueuesSync();
};

FileHelper.prototype.clearFiles = function (folderPath) {
	return new Promise(function (resolve, reject) {
		console.log("removing: ", folderPath);

		rimraf(folderPath + "/*", function (err, result) {
			if (err) {
				console.log("Error removing files: ", err);
				return reject(err);
			}

			resolve(result);
		});
	});
};

module.exports = FileHelper;
