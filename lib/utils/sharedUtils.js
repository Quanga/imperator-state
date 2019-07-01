const moment = require("moment");

const generateDate = function(dateVal, typeStr) {
	switch (typeStr) {
	case "FULL": {
		return moment(dateVal).format("MMMM Do YYYY h:mm:ss a");
	}
	case "DATE": {
		return moment(dateVal).format("MMMM Do YYYY");
	}
	case "TIME": {
		return moment(dateVal).format("h:mm:ss a");
	}
	}
	return "NA";
};

module.exports = { generateDate };
