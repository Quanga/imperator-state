module.exports = {
	nyc: {
		include: ["lib/**/*.js"],
		exclude: ["**/*.spec.js", "docs/**", "test/**", "ecosystem.config.js", ".eslintrc.js", ".mocharc.js"]
	}
};
