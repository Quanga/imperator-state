/* eslint-disable no-unused-vars */
const { axxisLogo } = require("../assets");
const Utils = require("../sharedUtils");
const utils = new Utils();

const Header = function(reportObj) {
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
		]
	};
};

module.exports = Header;
