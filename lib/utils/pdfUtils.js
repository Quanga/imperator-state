const PdfPrinter = require("pdfmake");
const fs = require("fs");
const path = require("path");
const os = require("os");
const makeDir = require("make-dir");
const { pageSetup } = require("./assets");
const { createMainHeading, createSubHeading } = require("./components/headings");

const header = require("./components/header.js");
const reportOverviewSect = require("./components/reportOverviewSect");
const blastOverview = require("./components/blastOverviewSect");
const preBlastSect = require("./components/preBlastSect");
const exclusionSect = require("./components/exclusionSect");
const postBlastSummary = require("./components/postBlastSection");

const themedStyles = require("./styles");

module.exports = class pdfUtil {
	createContent(reportObj, theme) {
		//console.log("STYLES", themedStyles(theme));
		this.docDefinition = {
			...pageSetup,
			content: [
				header(reportObj, theme),
				createMainHeading("BLAST INFORMATION", theme),
				reportOverviewSect(reportObj, theme),
				createSubHeading("BLAST OVERVIEW"),
				blastOverview(reportObj, theme),
				createSubHeading("PRE-BLAST SUMMARY"),
				preBlastSect(reportObj, theme),
				createSubHeading("POST-BLAST SUMMARY"),
				...postBlastSummary(reportObj, theme),

				createSubHeading("EXCLUSIONS"),
				...exclusionSect(reportObj, theme)
			],
			styles: themedStyles(theme).styles,
			defaultStyle: themedStyles(theme).defaultStyle
		};

		this.options = {};
		this.printer = new PdfPrinter(themedStyles(theme).fonts);
	}

	async createPdf(filename) {
		const pdfDoc = this.printer.createPdfKitDocument(this.docDefinition);
		pdfDoc.on("error", err => console.log(err));

		const pdfDir = path.resolve(os.homedir(), "./pdf/blasts/");

		if (!fs.existsSync(pdfDir)) {
			await makeDir(pdfDir);
		}

		const fileDir = path.resolve(pdfDir, `br-${filename.id}.pdf`);
		return await this.savePdfToFile(pdfDoc, fileDir);
	}

	savePdfToFile(pdf, fileName) {
		return new Promise(resolve => {
			let pendingStepCount = 2;

			const stepFinished = () => {
				if (--pendingStepCount == 0) {
					resolve(fs.readFileSync(writeStream.path));
				}
			};

			const writeStream = fs.createWriteStream(fileName);
			writeStream.on("close", stepFinished);
			pdf.pipe(writeStream);

			pdf.end();

			stepFinished();
		});
	}
};
