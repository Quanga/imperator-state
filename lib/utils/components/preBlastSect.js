/* eslint-disable no-unused-vars */
const PreBlastSect = function(reportObj) {
	return {
		columns: [
			[
				{ text: "DISARMED UNITS WITH DETONATORS", style: "tableHeading" },
				{
					table: {
						headerRows: 0,
						widths: [50, 50, 50, 50, 50],
						body: [
							[
								{ text: "SERIAL", style: "tableHeaderLeft" },
								{ text: "TAGGED", style: "tableHeader" },
								{ text: "LOGGED", style: "tableHeader" },
								{ text: "DISCOVERED", style: "tableHeader" },
								{ text: "PROGRAMMED", style: "tableHeader" }
							],
							[
								{ text: "0", fontSize: 8, alignment: "left" },
								{ text: "0", style: "tableContentCenter" },
								{ text: "0", style: "tableContentCenter" },
								{ text: "0", style: "tableContentCenter" },
								{ text: "0", style: "tableContentCenter" }
							]
						]
					},
					layout: "noBorders"
				},
				{
					text: "UNHANDLED WARNINGS",
					style: "tableHeading",
					margin: [0, 15, 0, 0]
				},
				{ text: "NONE", style: "standard" }
			],
			{
				table: {
					widths: [100, 100],
					body: [
						[
							{ text: "TOTAL UNITS: 0", fontSize: 8, bold: true },
							{ text: "TOTAL DETONATORS: 0", fontSize: 8, bold: true }
						],
						[
							{
								text:
									"Units that are dis-armed but have detonators programmed are displayed in this section.  Be aware of these units as they will not be initiated in this blast and therefore may contain live detonators post-blast",
								style: "tableWarning",
								colSpan: 2
							}
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
	};
};

module.exports = PreBlastSect;
