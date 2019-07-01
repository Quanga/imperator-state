const ExclusionSect = function(reportObj) {
	return {
		table: {
			headerRows: 0,
			widths: [50, 50, 50, 50, 50],
			body: [
				[
					{ text: "SERIAL", style: "tableHeaderLeft" },
					{ text: "STATUS", style: "tableHeader" },
					{ text: "DETONATORS", style: "tableHeader" }
				],
				[
					{ text: "0", fontSize: 8, alignment: "left" },
					{ text: "0", style: "tableContentCenter" },
					{ text: "0", style: "tableContentCenter" }
				]
			]
		},
		layout: "noBorders"
	};
};

module.exports = ExclusionSect;
