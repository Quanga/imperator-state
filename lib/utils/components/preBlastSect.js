/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable no-unused-vars */
const PreBlastSect = function(reportObj, theme) {
	const { excludedUnits } = reportObj.snapshots.start;
	const allRes = aggregateAll(excludedUnits);
	const rows = createRows(excludedUnits);

	return {
		columns: [
			[
				{ text: "DISARMED UNITS WITH DETONATORS", style: "tableHeading" },
				rows.length > 0
					? {
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
								...rows
							]
						},
						layout: "noBorders"
					  }
					: {
						text: "No disarmed units with loaded detonators were reported for this blast event",
						style: "standard"
					  },
				{
					text: "UNHANDLED WARNINGS",
					style: "tableHeading",
					margin: [0, 15, 0, 0]
				},
				{
					text: "No unhandled warnings  were reported for this blast event",
					style: "standard"
				}
			],
			rows.length > 0
				? {
					table: {
						widths: [100, 100],
						body: [
							[
								{
									text: `TOTAL UNITS: ${allRes.allUnits}`,
									fontSize: 8,
									bold: true
								},
								{
									text: `TOTAL DETONATORS: ${allRes.allDets}`,
									fontSize: 8,
									bold: true
								}
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
				: {}
		]
	};
};

const aggregateAll = function(units) {
	const unitKeys = Object.keys(units);
	const result = {
		allUnits: unitKeys.length,
		allDets: unitKeys.reduce((acc, cur) => acc + units[cur].units.unitsCount, 0)
	};

	return result;
};

const createRows = function(units) {
	const unitKeys = Object.keys(units);
	let rows = [];

	for (const unitKey of unitKeys) {
		rows.push([
			{
				text: units[unitKey].data.serial || "0",
				fontSize: 8,
				alignment: "left"
			},
			{
				text: units[unitKey].units.taggedCount || "0",
				style: "tableContentCenter"
			},
			{
				text: units[unitKey].units.loggedCount || "0",
				style: "tableContentCenter"
			},
			{
				text:
					units[unitKey].units.unitsCount -
						units[unitKey].units.taggedCount -
						units[unitKey].units.loggedCount || "0",
				style: "tableContentCenter"
			},
			{
				text: units[unitKey].units.programCount || "0",
				style: "tableContentCenter"
			}
		]);
	}
	return rows;
};

module.exports = PreBlastSect;
