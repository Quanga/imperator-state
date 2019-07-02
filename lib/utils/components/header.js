/* eslint-disable no-unused-vars */
const { axxisLogo } = require("../assets");
const Utils = require("../sharedUtils");

const Header = function(reportObj) {
	const utils = new Utils();

	return {
		columns: [
			[
				{ text: "BLAST REPORT", style: "header" },
				{
					text: [
						{ text: "GENERATED:    ", style: "date" },
						{
							text: utils.generateDate(Date.now(), "FULL") || "NA",
							style: "standard"
						}
					]
				},
				{
					text: [
						{ text: "OPERATOR:   ", style: "date" },
						{
							text: "JOESEPH BLOGGS",
							style: "standard"
						}
					]
				}
			],
			{ svg: axxisLogo, x: 90 }
		],
		margin: [0, 0, 0, 20]
	};
};

module.exports = Header;
