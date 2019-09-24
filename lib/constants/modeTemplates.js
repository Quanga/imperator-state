const { themes } = require("../constants/typeConstants");

module.exports = {
	AXXIS100: {
		commands: [8, 4, 5],
		extendedWindowId: true,
		theme: themes.AXXIS
	},
	AXXIS100_CFC: {
		commands: [8, 4, 5, 36],
		extendedWindowId: false,
		theme: themes.AXXIS
	},
	AXXIS500: {
		commands: [8, 4, 5, 22, 23],
		extendedWindowId: true,
		theme: themes.AXXIS
	},
	HYDRA: {
		commands: [8, 4, 5, 22, 23],
		extendedWindowId: false,
		theme: themes.HYDRA
	},
	AXXIS500_WIFI: {
		commands: [8, 4, 5, 22, 23, 24],
		extendedWindowId: true,
		theme: themes.AXXIS
	},
	AXXIS500_CFC: {
		commands: [8, 4, 5, 22, 23, 36],
		extendedWindowId: true,
		theme: themes.AXXIS
	},
	IBS: {
		commands: [8, 1, 2, 3],
		extendedWindowId: false,
		theme: themes.AECE
	}
};
