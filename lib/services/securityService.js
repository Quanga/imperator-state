/**
 * @category System
 * @module lib/services/securityService
 */

/**
 * @category System
 * @class
 * @summary System service to upsert or remove users for the UI and Mesh
 */
function SecurityService() {}

/**
 * @summary Happner Component Start.
 * @param {$happn} $happn Dependancy Injection of the Happner Framework
 * @return {Promise}
 */
SecurityService.prototype.start = function($happn) {
	const { securityService } = $happn.exchange;
	const { log } = $happn;

	return (async () => {
		log.info("Security Service Starting.........");
		await securityService.checkUsers();
	})();
};

/**
 * @summary Happner Component Stop.
 * @param {$happn} $happn Dependancy Injection of the Happner Framework
 * @return {Promise}
 */
SecurityService.prototype.stop = function($happn) {
	const { log } = $happn;

	return (async () => {
		log.info("Security Service Starting.........");
	})();
};

/**
 * @summary Check users.
 * @param {$happn} $happn Dependancy Injection of the Happner Framework
 * @param {string} searchStr
 * @return {Promise<any>} List of users
 */
SecurityService.prototype.checkUsers = function($happn) {
	const { security } = $happn.exchange;
	const { log } = $happn;

	//check the system for the default users for the mesh

	//if they dont exist then add them, if they do then carry on
	return (async () => {
		const testUser = {
			username: "TEST_UNIT",
			password: "happn",
			groups: { _ADMIN: true }
		};
		const meshUser = {
			username: "MESH_UNIT",
			password: "1234",
			groups: { _ADMIN: true }
		};
		const meshUser2 = {
			username: "MESH_UNIT2",
			password: "happn",
			groups: { _ADMIN: true }
		};

		security.upsertUser(testUser, err => {
			if (err) return log.info("User  Error", err);

			log.info("User Upserted");
		});

		security.upsertUser(meshUser, err => {
			if (err) return log.info("User  Error", err);

			log.info("User Upserted");
		});

		security.upsertUser(meshUser2, err => {
			if (err) return log.info("User  Error", err);

			log.info("User Upserted");
		});
	})();
};

/**
 * @summary Utility function to return the users that are already listed on the system.
 * @param {$happn} $happn Dependancy Injection of the Happner Framework
 * @param {string} userName
 * @return {Promise<any>} List of users
 */
SecurityService.prototype.listUsers = function($happn, userName) {
	const { security } = $happn.echange;

	return async () => {
		let users = await security.listUsers(userName);
		return users;
	};
};

/**
 * @summary Upsert user for UI system.
 * @param {$happn} $happn Dependancy Injection of the Happner Framework
 * @param {userObj} user User Object as per Happner User Format
 * @return {Promise} result
 */
SecurityService.prototype.upsertUiUser = function($happn, user) {
	const { security } = $happn.echange;
	const { log } = $happn;

	return (async () => {
		await security.upsertUser(user, (err, result) => {
			if (err) return log.error("Cannot Upset user ", err);

			log.info(`User ${user} added`);
			return result;
		});
	})();
};

module.exports = SecurityService;

/**
 * @typedef userObj
 * @summary Happner User Object
 * @property {string}  username Case sensitive string for username
 * @property {string}  password Case sensitive string for password
 * @property {object}  custom_data 
 * @property {object}  application_data 
 * @property {object}  groups Group KVP where key is Group name and pair boolean
 * 
 * @example 
  const testUpsertUser = {
	username: 'USERNAME',
	password: 'PASSWORD',
	custom_data: { something: 'useful' },
	application_data: { something: 'untouchable by the user' },
	groups:{}
	};
 */
