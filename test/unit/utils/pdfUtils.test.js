/* eslint-disable no-unused-vars */
const PdfUtils = require("../../../lib/utils/pdfUtils");
const reportData = require("./testBlastModelData");
const reportData2 = require("./testBlast2");
describe("UNIT -Utils", async function() {
	this.timeout(10000);

	context("PDF Utils", async () => {
		it("can create a pdf", async function() {
			let pdfUtils = new PdfUtils();

			pdfUtils.createContent(reportData);
			await pdfUtils.createPdf(reportData);
			const pdfUtils2 = new PdfUtils();
			pdfUtils2.createContent(reportData2);
			await pdfUtils2.createPdf(reportData2);
		});
	});
});
