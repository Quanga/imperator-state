const { themes } = require("../constants/typeConstants");

module.exports = {
	AXXIS100: {
		commands: [8, 4, 5],
		theme: themes.AXXIS
	},
	AXXIS100_CFC: {
		commands: [8, 4, 5, 36],
		theme: themes.AXXIS
	},
	AXXIS500: {
		commands: [8, 4, 5, 22, 23],
		theme: themes.AXXIS
	},
	HYDRA: {
		commands: [8, 4, 5, 22, 23],
		theme: themes.HYDRA
	},
	AXXIS500_WIFI: {
		commands: [8, 4, 5, 22, 23, 24],
		theme: themes.AXXIS
	},
	AXXIS500_CFC: {
		commands: [8, 4, 5, 22, 23, 36],
		theme: themes.AXXIS
	},
	IBS: {
		commands: [8, 1, 2, 3],
		theme: themes.AECE
	}
};
