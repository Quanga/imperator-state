const PdfUtils = require("../../../lib/utils/pdfUtils");

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
		pdfUtils.createContent();
		await pdfUtils.createPdf();
		await timer(2000);
	});
});
