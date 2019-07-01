/* eslint-disable no-unused-vars */
const Utils = require("../sharedUtils");
const utils = new Utils();

const reportOverviewSect = function(reportObj) {
	const { created, firingComplete, blastClosed, id, state } = reportObj;
	try {
		return [
			{
				table: {
					headerRows: 0,
					widths: [160, 70, 70, 70, 70],
					body: [
						[
							{ text: "BLAST ID", style: "date" },
							{ text: "DATE", style: "date" },
							{ text: "INITIATION", style: "date" },
							{ text: "FIRING", style: "date" },
							{ text: "COMPLETE", style: "date" }
						],
						[
							{ text: id, style: "standard" },

							{
								text: utils.generateDate(created, "DATE") || "NA",
								style: "standard"
							},
							{
								text: utils.generateDate(firingComplete, "TIME") || "NA",
								style: "standard"
							},
							{
								text: utils.generateDate(created, "TIME") || "NA",
								style: "standard"
							},
							{
								text: utils.generateDate(blastClosed, "TIME") || "NA",
								style: "standard"
							}
						]
					]
				},
				layout
			},
			{
				table: {
					headerRows: 0,
					widths: [160, 70, 70, 70, 70],
					body: [
						[
							{ text: "", style: "date" },
							{ text: "", style: "date" },
							{ text: "FIRE TIME", style: "date" },
							{ text: "DATA RETURN", style: "date" },
							{ text: "DATA", style: "date" }
						],
						[
							{ text: "", style: "standard" },
							{ text: "", style: "standard" },
							{
								text: `${getSeconds(firingComplete, created)} sec`,
								style: "standard"
							},
							{
								text: `${getSeconds(blastClosed, firingComplete)} sec`,
								style: "standard"
							},
							{
								text: getDataState(state),
								style: "standard"
							}
						]
					]
				},
				layout,
				margin: [0, 10, 0, 0]
			}
		];
	} catch (err) {
		console.log(err);
	}
};

const getSeconds = function(inVal, outVal) {
	let val = (inVal - outVal) / 1000;
	return Math.floor(val);
};

const getDataState = function(state) {
	switch (state) {
	case "BLAST_DATA_COMPLETE": {
		return "COMPLETE";
	}
	default:
		return "INCOMPLETE";
	}
};

const layout = {
	hLineWidth: function(i, node) {
		return 0;
	},
	vLineWidth: function(i, node) {
		return 0;
	},

	paddingLeft: function(i, node) {
		return 4;
	},
	paddingRight: function(i, node) {
		return 4;
	},
	paddingTop: function(i, node) {
		return 0;
	},
	paddingBottom: function(i, node) {
		return 0;
	}
};

module.exports = reportOverviewSect;
