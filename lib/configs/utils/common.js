const fields = require("../fields/fieldConstants");

//used to ignore in working out the diffs
const diffIgnore = [fields.path, fields.createdAt, fields.modifiedAt];

module.exports = { diffIgnore };
