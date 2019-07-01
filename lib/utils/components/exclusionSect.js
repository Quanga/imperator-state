const ExclusionSect = function(reportObj) {
	const { disarmedUnits } = reportObj.snapshots.start;
	const [...rows] = createRows(disarmedUnits);
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
				rows
			]
		},
		layout: "noBorders"
	};
};

const createRows = function(unitsObj) {
	const unitKeys = Object.keys(unitsObj);
	let rows = [];
	console.log(unitKeys);

	for (const unitKey of unitKeys) {
		rows.push([
			{ text: unitsObj[unitKey].data.serial, fontSize: 8, alignment: "left" },
			{ text: "0", style: "tableContentCenter" },
			{ text: "0", style: "tableContentCenter" }
		]);
	}
	console.log(rows);
	return rows;
};

module.exports = ExclusionSect;
