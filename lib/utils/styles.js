const styles = {
	fonts: {
		Roboto: {
			normal: "fonts/Roboto-Regular.ttf",
			bold: "fonts/Roboto-Medium.ttf",
			italics: "fonts/Roboto-Italic.ttf",
			bolditalics: "fonts/Roboto-MediumItalic.ttf"
		}
	},
	styles: {
		header: {
			margin: [0, 10, 0, 0],
			fontSize: 22,
			bold: true
		},
		date: {
			fontSize: 8,
			bold: true
		},
		standard: {
			fontSize: 8
		},
		tableExample: {
			margin: [0, 5, 0, 15]
		},
		tableHeaderLeft: {
			fontSize: 7,
			bold: true,
			border: [false, false, false, false],
			fillColor: "#eeeeee"
		},
		tableHeader: {
			fontSize: 6,
			bold: true,
			alignment: "center",
			border: [false, false, false, false],
			fillColor: "#eeeeee"
		},
		tableContentCenter: {
			fontSize: 8,
			bold: true,
			alignment: "center"
		},
		tableWarning: {
			fontSize: 5,
			alignment: "center",
			width: "auto"
		},
		tableHeading: {
			fontSize: 9,
			bold: true,
			color: "#dbae1f",
			margin: [0, 0, 0, 5]
		}
	},
	defaultStyle: {
		columnGap: 10,
		fontSize: 10
	}
};

module.exports = styles;
