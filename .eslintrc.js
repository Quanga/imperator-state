module.exports = {
	env: {
		es6: true,
		node: true,
		browser: true,
		mocha: true,
	},
	extends: ["eslint:recommended", "prettier"],
	plugins: ["prettier"],

	parserOptions: {
		ecmaVersion: 2018,
	},

	rules: {
		"prettier/prettier": ["error"],
		"no-console": 0,
	},
};
