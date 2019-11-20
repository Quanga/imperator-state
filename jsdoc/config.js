"use strict";

module.exports = {
	plugins: ["plugins/markdown", "node_modules/jsdoc-mermaid", "node_modules/better-docs/category"],
	tags: {
		allowUnknownTags: ["category", "mermaid"],
		dictionaries: ["jsdoc", "closure"],
	},
	source: {
		include: ["lib", "app.js", "server.js"],
		includePattern: ".+\\.js(doc|x)?$",
		excludePattern: "(^|\\/|\\\\)_",
	},
	opts: {
		encoding: "utf8",
		destination: "docs/",
		readme: "readme.md",
		recurse: true,
		verbose: true,
		//		template: "node_modules/better-docs",
		template: "./jsdoc-template",
	},
	templates: {
		referenceTitle: "State Server API",
		disableSort: false,
		collapse: false,
		resources: {
			"happner-2": "https://github.com/happner/happner-2",
		},
	},
	// templates: {
	// 	cleverLinks: false,
	// 	monospaceLinks: false
	// default: {
	// 	staticFiles: {
	// 		include: ["./docs-src/statics"]
	// 	}
	// },
	// "better-docs": {
	// 	name: "State Management Server",
	// 	//logo: "images/logo.png",
	// 	navigation: [
	// 		{
	// 			label: "Github",
	// 			href: "https://github.com/SoftwareBrothers/admin-bro"
	// 		},
	// 		{
	// 			label: "Example Application",
	// 			href: "https://admin-bro-example-app.herokuapp.com/admin"
	// 		}
	// 	]
	// }
	//}
};
