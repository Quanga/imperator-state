/* eslint-disable max-len */
const axxisLogo = `<svg width="214.33px" height="66.744px" enable-background="new 0 0 214 66" version="1.1" viewBox="0 0 214 66" xml:space="preserve" xmlns="http://www.w3.org/2000/svg">
<path d="m53.357 61.255h-11.682l-4.644-12.084h-21.257l-4.386 12.084h-11.388l20.711-53.174h11.355l21.291 53.174zm-19.769-21.036l-7.33-19.735-7.18 19.735h14.51z" fill="#1D1D1B"/>
<polygon points="43.491 61.255 61.587 33.63 45.193 8.31 57.683 8.31 68.308 25.324 78.699 8.31 91.086 8.31 74.619 34.023 92.715 61.255 79.824 61.255 68.085 42.948 56.31 61.255" fill="#1D1D1B"/>
<polygon points="130.07 61.255 130.07 8.31 140.5 8.31 140.5 61.255" fill="#1D1D1B"/>
<path d="m141.85 43.045l10.06-1.026c0.595 3.52 1.824 6.094 3.686 7.742 1.847 1.635 4.341 2.464 7.484 2.464 3.325 0 5.846-0.731 7.523-2.206 1.693-1.46 2.542-3.168 2.542-5.125 0-1.264-0.359-2.328-1.074-3.209-0.703-0.893-1.945-1.659-3.723-2.303-1.203-0.445-3.968-1.213-8.271-2.328-5.543-1.426-9.426-3.184-11.66-5.264-3.145-2.922-4.723-6.49-4.723-10.7 0-2.713 0.74-5.241 2.218-7.605 1.478-2.352 3.617-4.149 6.393-5.386 2.788-1.227 6.141-1.845 10.077-1.845 6.436 0 11.267 1.462 14.518 4.382 3.243 2.938 4.949 6.836 5.113 11.727l-10.33 0.472c-0.444-2.736-1.399-4.705-2.855-5.895-1.454-1.201-3.637-1.795-6.546-1.795-3.004 0-5.365 0.632-7.058 1.92-1.096 0.816-1.642 1.92-1.642 3.293 0 1.266 0.512 2.341 1.533 3.233 1.301 1.138 4.474 2.329 9.503 3.556 5.031 1.239 8.749 2.511 11.159 3.825 2.407 1.325 4.294 3.121 5.662 5.412 1.359 2.293 2.04 5.117 2.04 8.475 0 3.047-0.811 5.906-2.446 8.553-1.63 2.666-3.934 4.648-6.91 5.936-2.979 1.299-6.702 1.943-11.149 1.943-6.47 0-11.448-1.549-14.914-4.657-3.47-3.107-5.545-7.64-6.21-13.589z" fill="#1D1D1B"/>
<polygon points="191.39 22.093 191.39 10.121 187.12 10.121 187.12 7.68 198.57 7.68 198.57 10.121 194.3 10.121 194.3 22.093" fill="#1D1D1B"/>
<polygon points="200.41 22.093 200.41 7.68 204.76 7.68 207.38 17.513 209.96 7.68 214.33 7.68 214.33 22.093 211.63 22.093 211.63 10.747 208.76 22.093 205.96 22.093 203.11 10.747 203.11 22.093" fill="#1D1D1B"/>
<linearGradient id="a" x1="106.38" x2="106.38" y2="66.744" gradientUnits="userSpaceOnUse">
    <stop stop-color="#CBAA27" offset="0"/>
    <stop stop-color="#C9A827" offset=".1978"/>
    <stop stop-color="#C0A125" offset=".3288"/>
    <stop stop-color="#B19423" offset=".4405"/>
    <stop stop-color="#9C831F" offset=".5412"/>
    <stop stop-color="#806D1B" offset=".6347"/>
    <stop stop-color="#5E5115" offset=".7229"/>
    <stop stop-color="#37310E" offset=".8052"/>
    <stop stop-color="#121208" offset=".871"/>
</linearGradient>
<polygon points="91.533 66.744 106.38 44.111 121.21 66.744 137.39 66.744 114.37 31.946 135.33 0 119.65 0 106.42 19.936 93.231 0 77.479 0 98.427 31.974 75.358 66.744" fill="url(#a)"/>
</svg>`;

const pageSetup = {
	pageSize: "a4",
	pageOrientation: "portrait",
	pageMargins: [40, 50, 40, 50],
	info: {
		title: "BlastReport",
		author: "Blast Server",
		subject: "Blast Document",
		keywords: "Blast Document"
	},
	footer: function(currentPage, pageCount) {
		return currentPage.toString() + " of " + pageCount;
	}
};

const marginInPoints = function(marginInMilimeter) {
	return ((marginInMilimeter / 2.54) * 72) / 10;
};

const divider = function() {
	return {
		canvas: [
			{
				type: "line",
				x1: 0,
				y1: marginInPoints(2),
				x2: marginInPoints(180),
				y2: marginInPoints(2),
				lineWidth: 0.5,
				alignment: "center"
			}
		]
	};
};

module.exports = {
	pageSetup,
	axxisLogo,
	divider
};
