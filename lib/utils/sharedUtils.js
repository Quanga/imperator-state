const moment = require("moment");
class sharedUtils {
	generateDate(dateVal, typeStr) {
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
	}
}

module.exports = sharedUtils;
