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
		//indent: ["error", "tab"],
		//indent: [2, 2, { SwitchCase: 1 }, { MemberExpression: 1 }],
		//"linebreak-style": ["error", "unix"],
		//"max-len": 0,
		//"newline-per-chained-call": [2, { ignoreChainWithDepth: 1 }],
		//"no-confusing-arrow": 0,
		"no-console": 0,
		//"no-unused-vars": 2,
		//"no-use-before-define": 1,

		//semi: ["error", "always"],
		// "no-console": 0,
		//"max-len": ["error", { code: 100, ignoreStrings: true, tabWidth: 2 }],
	},
};
