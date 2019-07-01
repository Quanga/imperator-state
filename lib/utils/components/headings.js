const createMainHeading = function(title) {
	return {
		margin: [0, 0, 0, 10],

		table: {
			widths: ["*"],
			body: [
				[
					{
						border: [false, false, false, true],
						fillColor: "#f4c222",
						text: { text: title, color: "black", fontSize: 12, bold: true }
					}
				]
			]
		},
		layout: { paddingTop: () => 7, paddingBottom: () => 7 }
	};
};

const createSubHeading = function(title) {
	return {
		margin: [0, 10, 0, 5],
		table: {
			widths: ["*"],
			body: [
				[
					{
						border: [false, false, false, true],
						fillColor: "#aaaaaa",
						text: { text: title, color: "black", fontSize: 10, bold: true }
					}
				]
			]
		}
	};
};

module.exports = { createMainHeading, createSubHeading };
