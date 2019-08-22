module.exports = {
	nyc: {
		include: ["lib/**/*.js"],
		exclude: [
			"**/*.spec.js",
			"docs/**",
			"jsdoc/**",
			"test/**",
			"ecosystem.config.js",
			".eslintrc.js",
			".mocharc.js",
			"fonts/"
		]
	}
};
