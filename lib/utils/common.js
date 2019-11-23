const moment = require("moment");
const diff = require("deep-object-diff").diff;

const utils = {
	groupBy: (arr, key) => {
		const props = key.split(".");

		return arr.reduce((rv, x, i) => {
			const k = props.reduce((acc, prop) => {
				return acc && acc[prop];
			}, arr[i]);

			(rv[k] = rv[k] || []).push(x);
			return rv;
		}, {});
	},
	generateDate: (dateVal, typeStr) => {
		if (!typeStr) {
			throw new Error("you need to send in a Date, time or full");
		}

		switch (typeStr) {
			case "FULL": {
				return moment(dateVal).format("Do MMMM YYYY h:mm:ss a");
			}
			case "DATE": {
				return moment(dateVal).format("Do MMMM YYYY");
			}
			case "TIME": {
				return moment(dateVal).format("h:mm:ss a");
			}
		}
		return "NA";
	},
	getDiffAsync: (current, next, ignoreArr = []) =>
		new Promise(resolve => {
			const diffs = diff(current, next);

			const res = Object.keys(diffs).reduce((acc, cur) => {
				if (ignoreArr.indexOf(cur) !== -1) return acc;

				if (diffs[cur] !== null) acc[cur] = diffs[cur];

				return acc;
			}, {});

			resolve(Object.keys(res).length > 0 ? res : null);
		}),
	removeNulls: obj => {
		return Object.keys(obj).reduce((acc, prop) => {
			if (obj[prop] !== null) acc[prop] = obj[prop];
			return acc;
		}, {});
	},
	checkObjExists: (obj, key) => {
		return new Promise((resolve, reject) => {
			if (!key && key !== 0) reject(`No typeId exists`);

			if (!obj[key]) {
				obj[key] = {};
			}
			resolve(obj);
		});
	},
};

module.exports = utils;
