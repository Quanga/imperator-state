const PdfPrinter = require("pdfmake");
const fs = require("fs");
const { pageSetup, divider } = require("./assets");
const {
	createMainHeading,
	createSubHeading
} = require("./components/headings");
const header = require("./components/header.js");
const reportOverviewSect = require("./components/reportOverviewSect");
const blastOverview = require("./components/blastOverviewSect");
const preBlastSect = require("./components/preBlastSect");
const exclusionSect = require("./components/exclusionSect");

const { styles, defaultStyle, fonts } = require("./styles");

module.exports = class pdfUtil {
	createContent(reportObj) {
		this.docDefinition = {
			...pageSetup,
			content: [
				header(reportObj),
				divider,
				createMainHeading("BLAST INFORMATION"),
				reportOverviewSect(reportObj),
				createSubHeading("BLAST OVERVIEW"),
				...blastOverview(reportObj),
				createSubHeading("PRE-BLAST SUMMARY"),
				preBlastSect(reportObj),
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
				exclusionSect(reportObj),
				divider
			],
			styles,
			defaultStyle
		};

		this.options = {};
		this.printer = new PdfPrinter(fonts);
	}

	async createPdf(filename) {
		const pdfDoc = this.printer.createPdfKitDocument(this.docDefinition);
		pdfDoc.pipe(fs.createWriteStream(`br-${filename.id}.pdf`));
		pdfDoc.end();
	}
};
