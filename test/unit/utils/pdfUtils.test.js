/* eslint-disable no-unused-vars */
const PdfUtils = require("../../../lib/utils/pdfUtils");
const reportData = require("./testBlastModelData");
const reportData2 = require("./testBlast2");
describe("UNIT - PDF_UTILS", async function() {
	this.timeout(10000);

	const timer = duration =>
		new Promise((resolve, reject) => {
			setTimeout(() => {
				resolve();
			}, duration);
		});
	it("can create a pdf", async function() {
		try {
			let pdfUtils = new PdfUtils();

			pdfUtils.createContent(reportData);
			await pdfUtils.createPdf(reportData);
			const pdfUtils2 = new PdfUtils();
			pdfUtils2.createContent(reportData2);
			await pdfUtils2.createPdf(reportData2);
		} catch (err) {
			console.log(err);
		}
	});
});
