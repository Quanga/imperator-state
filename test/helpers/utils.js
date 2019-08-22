const os = require("os");
const fs = require("fs");

module.exports = {
	timer: ms =>
		new Promise(resolve => {
			setTimeout(() => {
				resolve();
			}, ms);
		}),
	removeDB: directory =>
		new Promise(resolve => {
			const fullPath = `${os.homedir()}${directory}`;
			fs.unlink(fullPath, err => {
				if (err) {
					console.log(`${fullPath} - not found to delete`);
					return resolve();
				}
				console.log(`${fullPath} - deleted`);
				resolve();
			});
		})
};
