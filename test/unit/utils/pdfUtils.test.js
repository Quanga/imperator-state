const PdfUtils = require("../../../lib/utils/pdfUtils");
const reportData = require("./testBlastModelData");
describe("UNIT - PDF_UTILS", async function() {
	this.timeout(10000);

	const timer = duration =>
		new Promise((resolve, reject) => {
			setTimeout(() => {
				resolve();
			}, duration);
		});
	it("can create a pdf", async function() {
		const pdfUtils = new PdfUtils();
		await timer(1000);
		pdfUtils.createContent(reportData);
		await pdfUtils.createPdf(reportData.id);
		await timer(2000);
	});
});
