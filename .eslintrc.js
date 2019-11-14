module.exports = {
	env: {
		es6: true,
		node: true,
		browser: true,
	},
	extends: "eslint:recommended",
	plugins: ["prettier"],
	parserOptions: {
		ecmaVersion: 2018,
	},
	rules: {
		"prettier/prettier": "error",
		indent: ["error", "tab"],
		"linebreak-style": ["error", "unix"],

		semi: ["error", "always"],
		"no-console": 0,
		"max-len": ["error", { code: 100, ignoreStrings: true, tabWidth: 2 }],
	},
};
