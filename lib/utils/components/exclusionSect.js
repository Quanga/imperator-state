/* eslint-disable no-mixed-spaces-and-tabs */
const ExclusionSect = function(reportObj) {
	const { disarmedUnits } = reportObj.snapshots.start;
	const rows = createRows(disarmedUnits);

	return [
		{
			text:
				"Units which are either disarmed with no loaded detonators or units which have been determined to be offline or unresponsive are displayed in this section",
			fontSize: 6,
			alignment: "center",
			italic: true,
			margin: [0, 0, 0, 10]
		},
		{ text: "EXCLUDED UNITS", style: "tableHeading" },
		rows.length > 0
			? {
				table: {
					headerRows: 0,
					widths: [50, 50, 50, 50, 50],
					body: [
						[
							{ text: "SERIAL", style: "tableHeaderLeft" },
							{ text: "STATUS", style: "tableHeader" },
							{ text: "DETONATORS", style: "tableHeader" }
						],
						...rows
					]
				},
				layout: "noBorders"
			  }
			: {
				text: "No units were excluded from this blast event",
				style: "standard"
			  }
	];
};

const createRows = function(unitsObj) {
	const unitKeys = Object.keys(unitsObj);
	let rows = [];
	console.log(unitKeys);

	for (const unitKey of unitKeys) {
		rows.push([
			{ text: unitsObj[unitKey].data.serial, fontSize: 8, alignment: "left" },
			{
				text: unitsObj[unitKey].data.keySwitchStatus ? "ARMED" : "DISARMED",
				style: "tableContentCenter"
			},
			{
				text: unitsObj[unitKey].units.unitsCount,
				style: "tableContentCenter"
			}
		]);
	}
	console.log(rows);
	return rows;
};

module.exports = ExclusionSect;
