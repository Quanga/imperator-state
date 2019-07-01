/* eslint-disable no-unused-vars */
const BlastOverview = function(reportObj) {
	return [
		{
			table: {
				widths: [80, "auto", "auto"],
				body: [
					[
						[
							{ text: "CONTOL UNIT", fontSize: 7, bold: true },
							{ text: "10", fontSize: 19, bold: true, color: "#dbae1f" }
						],
						{
							table: {
								widths: [45, 30, 35, 35, 30],
								body: [
									[
										{ text: "BOOSTERS", fontSize: 8, bold: true },
										{ text: "TOTAL", fontSize: 7, alignment: "center" },
										{ text: "EXCLUDED", fontSize: 7, alignment: "center" },
										{ text: "DISARMED", fontSize: 7, alignment: "center" },
										{ text: "FIRED", fontSize: 7, alignment: "center" }
									],
									[
										{ text: " ", fontSize: 8 },
										{ text: "0", style: "tableContentCenter" },
										{ text: "0", style: "tableContentCenter" },
										{ text: "0", style: "tableContentCenter" },
										{ text: "0", style: "tableContentCenter" }
									]
								]
							},
							layout: {
								hLineWidth: function(i, node) {
									return i === 0 || i === node.table.body.length ? 0.3 : 0;
								},
								vLineWidth: function(i, node) {
									return i === 0 || i === node.table.widths.length ? 0.3 : 0;
								}
							}
						},
						{
							table: {
								widths: [55, 30, 45, 30],
								body: [
									[
										{ text: "DETONATORS", fontSize: 8, bold: true },
										{ text: "TOTAL", fontSize: 7, alignment: "center" },
										{ text: "CONNECTED", fontSize: 7, alignment: "center" },
										{ text: "FIRED", fontSize: 7, alignment: "center" }
									],
									[
										{ text: " ", fontSize: 8 },
										{ text: "0", style: "tableContentCenter" },
										{ text: "0", style: "tableContentCenter" },
										{ text: "0", style: "tableContentCenter" }
									]
								]
							},
							layout: {
								hLineWidth: function(i, node) {
									return i === 0 || i === node.table.body.length ? 0.3 : 0;
								},
								vLineWidth: function(i, node) {
									return i === 0 || i === node.table.widths.length ? 0.3 : 0;
								}
							}
						}
					]
				]
			},
			layout: "noBorders"
		},
		{
			text:
				"Units displayed in this report are only units which have detonators logged, tagged or detected, and units which are in an ARMED state during the FIRING CYCLE. Units DISARMED prior to the cycle with no loaded detonators will be excluded from this report. Further information can be aquired from the system logs if necessary.",
			fontSize: 5,
			alignment: "center",
			margin: [0, 10, 0, 0]
		}
	];
};

module.exports = BlastOverview;
