require("dotenv").config();
const Happner = require("happner-2");
const Config = require("./config.js");

Happner.create(Config).catch(function(error) {
	console.error(error.stack || error.toString());
	process.exit(1);
});
