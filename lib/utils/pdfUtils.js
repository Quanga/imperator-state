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

const { styles, defaultStyle, fonts } = require("./styles");

module.exports = class pdfUtil {
	createContent(reportObj) {
		this.docDefinition = {
			...pageSetup,
			content: [
				header(reportObj),
				createMainHeading("BLAST INFORMATION"),
				reportOverviewSect(reportObj),
				createSubHeading("BLAST OVERVIEW"),
				blastOverview(reportObj),
				createSubHeading("PRE-BLAST SUMMARY"),
				preBlastSect(reportObj),
				createSubHeading("POST-BLAST SUMMARY"),
				...postBlastSummary(reportObj),

				createSubHeading("EXCLUSIONS"),
				...exclusionSect(reportObj)
			],
			styles,
			defaultStyle
		};

		this.options = {};
		this.printer = new PdfPrinter(fonts);
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
