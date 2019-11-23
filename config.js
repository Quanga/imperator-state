module.exports = {
	nodered: {
		functionGlobalContext: {
			fields: { data: "data" },
		},
		editorTheme: {
			page: {
				title: "Happner node-red prototype",
			},
			header: {
				title: "Happner node-red prototype",
			},
			deployButton: {},
			menu: {},
			palette: {
				editable: false,
			},
			projects: {
				enabled: false, // Enable the projects feature
			},
		},
	},
	nodes: {
		filter: {
			names: [],
			type: "blacklist",
		},
	},
};
