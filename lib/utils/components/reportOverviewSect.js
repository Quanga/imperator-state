const Utils = require("../sharedUtils");
const utils = new Utils();

const reportOverviewSect = function(reportObj) {
	try {
		return {
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
						{ text: reportObj.id, style: "standard" },

						{
							text: utils.generateDate(reportObj.created, "DATE") || "NA",
							style: "standard"
						},
						{
							text: utils.generateDate(reportObj.created, "TIME") || "NA",
							style: "standard"
						},
						{
							text: utils.generateDate(reportObj.created, "TIME") || "NA",
							style: "standard"
						},
						{
							text: utils.generateDate(reportObj.blastClosed, "TIME") || "NA",
							style: "standard"
						}
					]
				]
			},
			layout: "noBorders"
		};
	} catch (err) {
		console.log(err);
	}
};

module.exports = reportOverviewSect;
