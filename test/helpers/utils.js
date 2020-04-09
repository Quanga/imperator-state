const os = require("os");
const fs = require("fs");
const moment = require("moment");

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
		}),
	compressList: (data, serial) =>
		new Promise((resolve, reject) => {
			if (!data) reject("No data supplied");

			const entries = data.toString();
			const packets = entries.match(/aaaa[0-9 a-f]*/gm);
			const dates = entries.match(/\d*-\d*-\d*\s\d*:\d*:\d*/g);

			const uniqueDates = dates.filter((v, i, a) => a.indexOf(v) === i);

			let results = [];
			//loop through groups of dates now and number them by addind one ms to each one
			uniqueDates.forEach(group => {
				const groupofDates = dates.filter(x => x === group);

				groupofDates.forEach((element, i) => {
					const momentDate = moment(element).format("x");
					const incre = parseInt(momentDate) + i;

					results.push(incre);
				});
			});

			let combined = [];

			packets.forEach((packet, i) => {
				if (i === 0) {
					combined.push({
						createdAt: results[i],
						packet,
						time: moment(results[i], "x").format("HH:mm:ss.SSSS"),
					});
				}

				if (i !== 0 && combined[combined.length - 1].packet !== packet) {
					combined.push({
						createdAt: results[i],
						packet,
						time: moment(results[i], "x").format("HH:mm:ss.SSSS"),
					});
				}
			});

			let res;

			if (serial) {
				const reg = new RegExp(`aaa.{5}${serial}`, "g");
				res = combined.filter(x => x.packet.match(reg));
			} else {
				res = combined;
			}

			return resolve(res);
		}),
	asyncLogin: client =>
		new Promise((resolve, reject) => {
			client.on("login/allow", () => {
				console.log("CLIENT CONNECTED:::::::::::::::::::::::::");
				resolve();
			});

			client.on("login/deny", () => reject());

			client.on("login/error", err => {
				console.log("CLIENT ISSUE::::::", err);
			});

			client.login({
				username: "_ADMIN",
				password: "happn",
			});
		}),
	holdTillDrained: sendQueue =>
		new Promise(resolve => {
			sendQueue.on("drain", () => {
				return resolve();
			});
		}),
	removeDbFolder: async dbPath => {
		const dbFolder = await new Promise((resolve, reject) => {
			fs.stat(dbPath, (err, stats) => {
				if (err) return reject(err);

				resolve(stats);
			});
		});

		if (dbFolder.isDirectory()) {
			await new Promise((resolve, reject) => {
				fs.rmdir(dbPath, { recursive: true }, err => {
					if (err) return reject(err);
					console.log("db folder was deleted");
					resolve();
				});
			});
		}
	},
};
