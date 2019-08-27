/**
 * @category System
 * @module lib/services/securityService
 */
const { defaultGroups, defaultUsers } = require("../constants/defaultAppConstants");

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
	const { securityService, stateService } = $happn.exchange;
	const { name } = $happn;

	return (async () => {
		try {
			await securityService.checkUsers();
			stateService.updateState({ service: name, state: "STARTED" });
		} catch (error) {
			stateService.updateState({ service: name, state: "FAILED", error });
		}
	})();
};

/**
 * @summary Happner Component Stop.
 * @param {$happn} $happn Dependancy Injection of the Happner Framework
 * @return {Promise}
 */
SecurityService.prototype.stop = function($happn) {
	const { stateService } = $happn;
	const { name } = $happn;

	return (async () => {
		stateService.updateState({ service: name, state: "STOPPED" });
	})();
};

/**
 * @summary Initial user and group setup for an empty database
 * @param {$happn} $happn Dependancy Injection of the Happner Framework
 * @returns {Promise} void
 * @mermaid graph LR
 				A[App]-.->B(entry)
				subgraph setStartupUsers
				B-->C[upsertGroups]
				C-->D[upsertUsers]
				end
 */
SecurityService.prototype.setStartupUsers = function($happn) {
	const { security } = $happn.exchange;
	const { log } = $happn;

	const upsertUser = user =>
		new Promise(resolve => {
			security.upsertUser(user, err => {
				if (err) {
					log.error("cannot create user", err);
				}
				log.info(`User = ${user} upserted.....>>>>`);
				resolve();
			});
		});

	const upsertGroup = group =>
		new Promise(resolve => {
			security.upsertGroup(group, { overwritePermissions: true }, err => {
				if (err) {
					log.error("cannot create group", err);
				}
				resolve();
			});
		});

	return (async () => {
		try {
			log.warn("Setting up temporary users....ensure that these are changed using the UI");

			for (const group of defaultGroups) {
				await upsertGroup(group);
			}

			for (const user of defaultUsers) {
				await upsertUser(user);
			}
		} catch (err) {
			log.error("Error setting up default users and groups", err);
		}
	})();
};

/**
 * @summary check that the initail user password has been modified from the default
 * @param {$happn} $happn Dependancy Injection of the Happner Framework
 * @returns {Promise<boolean>} bool
 * @mermaid graph LR
				defaultUsers-->|get|B[application_data.state]
				B-->|INSECURE|E[resultArray]
				B-->|SECURE|null
				E -->|return|R[resultArray >0]
				
 */
SecurityService.prototype.checkStartUpUsers = function($happn) {
	const { security, securityService } = $happn.exchange;
	const { log } = $happn;

	const listUser = user =>
		new Promise(resolve => {
			security.listUsers(user.username).then(user => {
				if (user.length > 0) {
					resolve(user[0]);
				} else {
					resolve(null);
				}
			});
		});

	return (async () => {
		await securityService.setStartupUsers();

		let result = [];
		for (const user of defaultUsers) {
			const systemUser = await listUser(user);

			if (
				systemUser &&
				systemUser.application_data &&
				systemUser.application_data.state === "INSECURE"
			) {
				log.warn(
					`User ${systemUser.username} is not secure.  Please urgently change password in UI`
				);
				result.push(systemUser);
			}
		}

		return result.length === 0;
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
	const { security } = $happn.exchange;
	const { log } = $happn;

	return (async () => {
		await security.upsertUser(user, err => {
			if (err) return log.error("Cannot Upset user ", err);

			log.info(`User ${user.username} added to group ${user.group}`);
			return `User added - ${user.username} to group ${user.group}`;
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
