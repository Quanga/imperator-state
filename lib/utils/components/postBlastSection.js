/* eslint-disable no-unused-vars */
/* eslint-disable no-mixed-spaces-and-tabs */
const PostBlastSection = function(reportObj, theme) {
	const { start, end } = reportObj.snapshots;

	//create succes and fail items
	let success = [];
	let fail = [];

	const getSuccess = () => {
		const allUnitKeys = Object.keys(start.blastUnits);

		allUnitKeys.forEach(u => {
			if (
				end &&
				end.blastUnits[u] &&
				start.blastUnits[u].units.detonatorStatusCount > 0 &&
				end.blastUnits[u].units.detonatorStatusCount === 0
			) {
				success.push(u);
			} else {
				fail.push(u);
			}
		});
	};
	getSuccess();

	const sucessRows = createRows(success, start.blastUnits, end.blastUnits);
	const failRows = createRows(fail, start.blastUnits, end.blastUnits);

	return [
		{ text: "SUCCESSFUL INITIATION", style: "tableHeading" },
		sucessRows.length > 0
			? {
				table: {
					headerRows: 0,
					widths: [50, 50, 50, 50, 50, 50],
					body: [
						[
							{ text: "SERIAL", style: "tableHeaderLeft" },
							{ text: "TAGGED", style: "tableHeader" },
							{ text: "LOGGED", style: "tableHeader" },
							{ text: "DISCOVERED", style: "tableHeader" },
							{ text: "PROGRAMMED", style: "tableHeader" },
							{ text: "FIRED", style: "tableHeader" }
						],
						...sucessRows
					]
				},
				layout: "noBorders",
				margin: [0, 0, 0, 20]
			  }
			: {
				text: "No successfull Initiations reported within this blast event.",
				style: "standard",
				margin: [0, 0, 0, 20]
			  },
		{ text: "FAILED INITIATION", style: "tableHeading" },
		failRows.length > 0
			? {
				table: {
					headerRows: 0,
					widths: [50, 50, 50, 50, 50, 50],
					body: [
						[
							{ text: "SERIAL", style: "tableHeaderLeft" },
							{ text: "TAGGED", style: "tableHeader" },
							{ text: "LOGGED", style: "tableHeader" },
							{ text: "DISCOVERED", style: "tableHeader" },
							{ text: "PROGRAMMED", style: "tableHeader" },
							{ text: "FIRED", style: "tableHeader" }
						],
						...failRows
					]
				},
				layout: "noBorders"
			  }
			: {
				text: "No failured Initiations reported within this blast event.",
				style: "standard"
			  }
	];
};

const createRows = function(unitKeys, start, end) {
	let rows = [];

	const detStatus = uKey => {
		if (end && end[uKey])
			return start[uKey].units.detonatorStatusCount - end[uKey].units.detonatorStatusCount;

		return 0;
	};

	for (const unitKey of unitKeys) {
		rows.push([
			{
				text: start[unitKey].data.serial || "0",
				fontSize: 8,
				alignment: "left"
			},
			{
				text: start[unitKey].units.taggedCount || "0",
				style: "tableContentCenter"
			},
			{
				text: start[unitKey].units.loggedCount || "0",
				style: "tableContentCenter"
			},
			{
				text:
					start[unitKey].units.unitsCount -
						start[unitKey].units.taggedCount -
						start[unitKey].units.loggedCount || "0",
				style: "tableContentCenter"
			},
			{
				text: start[unitKey].units.programCount || "0",
				style: "tableContentCenter"
			},
			{
				text: detStatus(unitKey) || "0",
				style: "tableContentCenter"
			}
		]);
	}
	return rows;
};

module.exports = PostBlastSection;
