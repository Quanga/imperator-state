const { themes } = require("../../constants/typeConstants");

module.exports = {
	AXXIS100: {
		name: "AXXIS100",
		commands: [8, 4, 5],
		unitTypes: [0, 3, 4],
		constraints: {
			maxDetLoad: 101,
			maxDetTiming: 15000,
			firingTime: 120000,
			reportTime: 300000,
		},
		theme: themes.AXXIS,
	},
	AXXIS100_CFC: {
		name: "AXXIS100_CFC",
		commands: [8, 4, 5, 36],
		unitTypes: [0, 3, 4],
		constraints: {
			maxDetLoad: 101,
			maxDetTiming: 15000,
			firingTime: 120000,
			reportTime: 300000,
		},
		theme: themes.AXXIS,
	},
	AXXIS500: {
		name: "AXXIS500",
		commands: [8, 4, 5, 22, 23],
		unitTypes: [0, 3, 4],
		constraints: {
			maxDetLoad: 501,
			maxDetTiming: 15000,
			firingTime: 420000,
			reportTime: 420000,
		},
		theme: themes.AXXIS,
	},
	HYDRA: {
		name: "HYDRA",
		commands: [8, 4, 5, 22, 23],
		unitTypes: [0, 3, 4],
		constraints: {
			maxDetLoad: 501,
			maxDetTiming: 40000,
			firingTime: 120000,
			reportTime: 420000,
		},
		theme: themes.HYDRA,
	},
	AXXIS500_WIFI: {
		name: "AXXIS500_WIFI",
		commands: [8, 4, 5, 22, 23, 24],
		unitTypes: [0, 3, 4],
		constraints: {
			maxDetLoad: 501,
			maxDetTiming: 15000,
			firingTime: 420000,
			reportTime: 420000,
		},
		theme: themes.AXXIS,
	},
	AXXIS500_CFC: {
		name: "AXXIS500_CFC",
		commands: [8, 4, 5, 22, 23, 36],
		unitTypes: [0, 3, 4, 5],
		constraints: {
			maxDetLoad: 501,
			maxDetTiming: 15000,
			firingTime: 420000,
			reportTime: 420000,
		},
		theme: themes.AXXIS,
	},
	IBS: {
		name: "IBS",
		commands: [8, 1, 2, 3],
		unitTypes: [0, 1, 2],
		constraints: {
			maxDetLoad: 101,
			firingTime: 120000,
			reportTime: 420000,
		},
		theme: themes.AECE,
	},
};
