/* eslint-disable no-unused-vars */
const { assets } = require("../assets");
const Utils = require("../sharedUtils");

const Header = function(reportObj, theme) {
	const utils = new Utils();
	console.log("HEADER", theme);

	return {
		columns: [
			{
				width: 370,
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
									text: "",
									style: "standard"
								}
							]
						}
					]
				]
			},
			{ svg: assets[theme.name].logo, width: 90 }
		],

		margin: [0, 0, 0, 20]
	};
};

module.exports = Header;
