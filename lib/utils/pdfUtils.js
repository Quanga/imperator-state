const PdfPrinter = require("pdfmake");
const fs = require("fs");
const { axxisLogo, pageSetup, divider } = require("./assets");
const { createMainHeading, createSubHeading } = require("./assets");

const { styles, defaultStyle, fonts } = require("./styles");
const { generateDate } = require("./sharedUtils");

module.exports = class pdfUtil {
	createContent(reportObj) {
		this.docDefinition = {
			...pageSetup,
			content: [
				{
					columns: [
						[
							{ text: "BLAST REPORT", style: "header" },
							{
								text: [
									{ text: "GENERATED:    ", style: "date" },
									{
										text: generateDate(Date.now(), "FULL") || "NA",
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
				},
				divider,
				createMainHeading("BLAST INFORMATION"),
				{
					table: {
						headerRows: 0,
						widths: [180, 80, 80],
						body: [
							[
								{ text: "BLAST ID:", style: "date" },
								{ text: "DATE:", style: "date" },
								{ text: "TIME:", style: "date" }
							],
							[
								{ text: reportObj.id, style: "standard" },

								{
									text: generateDate(reportObj.created, "DATE") || "NA",
									style: "standard"
								},
								{
									text: generateDate(reportObj.created, "TIME") || "NA",
									style: "standard"
								}
							]
						]
					},
					layout: "noBorders"
				},
				createSubHeading("BLAST OVERVIEW"),
				{
					table: {
						widths: [80, "auto", "auto"],
						body: [
							[
								[
									{ text: "CONTOL UNIT", fontSize: 7, bold: true },
									{ text: "10", fontSize: 19, bold: true, color: "#dbae1f" }
								],
								{
									table: {
										widths: [45, 30, 35, 35, 30],
										body: [
											[
												{ text: "BOOSTERS", fontSize: 8, bold: true },
												{ text: "TOTAL", fontSize: 7, alignment: "center" },
												{ text: "EXCLUDED", fontSize: 7, alignment: "center" },
												{ text: "DISARMED", fontSize: 7, alignment: "center" },
												{ text: "FIRED", fontSize: 7, alignment: "center" }
											],
											[
												{ text: " ", fontSize: 8 },
												{ text: "0", style: "tableContentCenter" },
												{ text: "0", style: "tableContentCenter" },
												{ text: "0", style: "tableContentCenter" },
												{ text: "0", style: "tableContentCenter" }
											]
										]
									},
									layout: {
										hLineWidth: function(i, node) {
											return i === 0 || i === node.table.body.length ? 0.3 : 0;
										},
										vLineWidth: function(i, node) {
											return i === 0 || i === node.table.widths.length
												? 0.3
												: 0;
										}
									}
								},
								{
									table: {
										widths: [55, 30, 45, 30],
										body: [
											[
												{ text: "DETONATORS", fontSize: 8, bold: true },
												{ text: "TOTAL", fontSize: 7, alignment: "center" },
												{ text: "CONNECTED", fontSize: 7, alignment: "center" },
												{ text: "FIRED", fontSize: 7, alignment: "center" }
											],
											[
												{ text: " ", fontSize: 8 },
												{ text: "0", style: "tableContentCenter" },
												{ text: "0", style: "tableContentCenter" },
												{ text: "0", style: "tableContentCenter" }
											]
										]
									},
									layout: {
										hLineWidth: function(i, node) {
											return i === 0 || i === node.table.body.length ? 0.3 : 0;
										},
										vLineWidth: function(i, node) {
											return i === 0 || i === node.table.widths.length
												? 0.3
												: 0;
										}
									}
								}
							]
						]
					},
					layout: "noBorders"
				},
				{
					text:
						"Units displayed in this report are only units which have detonators logged, tagged or detected, and units which are in an ARMED state during the FIRING CYCLE. Units DISARMED prior to the cycle with no loaded detonators will be excluded from this report. Further information can be aquired from the system logs if necessary.",
					fontSize: 5,
					alignment: "center",
					margin: [0, 10, 0, 0]
				},
				createSubHeading("PRE-BLAST SUMMARY"),
				{
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
							}
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
				},
				createSubHeading("POST-BLAST SUMMARY"),
				{ text: "SUCCESSFUL INITIATION", style: "tableHeading" },
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
					layout: "noBorders",
					margin: [0, 0, 0, 20]
				},
				{ text: "FAILED INITIATION", style: "tableHeading" },
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

				createSubHeading("EXCLUSIONS"),
				{
					table: {
						headerRows: 0,
						widths: [50, 50, 50, 50, 50],
						body: [
							[
								{ text: "SERIAL", style: "tableHeaderLeft" },
								{ text: "STATUS", style: "tableHeader" },
								{ text: "DETONATORS", style: "tableHeader" }
							],
							[
								{ text: "0", fontSize: 8, alignment: "left" },
								{ text: "0", style: "tableContentCenter" },
								{ text: "0", style: "tableContentCenter" }
							]
						]
					},
					layout: "noBorders"
				}
			],
			styles,
			defaultStyle
		};

		this.options = {};
		this.printer = new PdfPrinter(fonts);
	}

	async createPdf(filename) {
		const pdfDoc = this.printer.createPdfKitDocument(this.docDefinition);
		await pdfDoc.pipe(fs.createWriteStream(`br-${filename}.pdf`));
		pdfDoc.end();
	}
};
