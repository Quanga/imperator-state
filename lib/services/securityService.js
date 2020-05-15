const { defaultGroups, defaultUsers } = require("../configs/uiConstants/defaultAppConstants");

/**
 * @category Services
 * @module lib/services/SecurityService
 */
/**
 * @class
 * @summary System service to upsert or remove users for the UI and Mesh
 */
class SecurityService {
	constructor() {}

	/**
	 * @summary Happner Component Start.
	 * @param {$happn} $happn Dependancy Injection of the Happner Framework
	 * @return {Promise}
	 */
	async start($happn) {
		const { securityService } = $happn.exchange;
		const { log } = $happn;

		try {
			await securityService.checkUsers();
		} catch (error) {
			log.error(error);
		}
	}
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
	async setStartupUsers($happn) {
		const { security } = $happn.exchange;
		const { log } = $happn;

		const upsertUser = (user) =>
			new Promise((resolve, reject) => {
				security.upsertUser(user, (err) => {
					if (err) return reject(err);
					log.info(`User = ${user.username} upserted.....>>>>`);
					resolve(user);
				});
			});

		const upsertGroup = (group) =>
			new Promise((resolve, reject) => {
				security.upsertGroup(group, { overwritePermissions: true }, (err) => {
					if (err) return reject(err);
					resolve();
				});
			});

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
	}

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
	async checkStartUpUsers($happn) {
		const { security, securityService } = $happn.exchange;
		const { log } = $happn;
		const listUser = (user) =>
			new Promise((resolve) => {
				security.listUsers(user.username).then((user) => {
					if (user.length > 0) {
						resolve(user[0]);
					} else {
						resolve(null);
					}
				});
			});

		await securityService.setStartupUsers();
		let result = [];
		for (const user of defaultUsers) {
			const systemUser = await listUser(user);
			if (
				systemUser &&
				systemUser.application_data &&
				systemUser.application_data.state === "INSECURE"
			) {
				log.warn(`User ${systemUser.username} is not secure.  Please urgently change password in UI`);
				result.push(systemUser);
			}
		}
		return result.length === 0;
	}

	/**
	 * @summary Utility function to return the users that are already listed on the system.
	 * @param {$happn} $happn Dependancy Injection of the Happner Framework
	 * @param {string} userName
	 * @return {Promise<any>} List of users
	 */
	async listUsers($happn, userName) {
		const { security } = $happn.echange;
		let users = await security.listUsers(userName);
		return users;
	}

	/**
	 * @summary Upsert user for UI system.
	 * @param {$happn} $happn Dependancy Injection of the Happner Framework
	 * @param {userObj} user User Object as per Happner User Format
	 * @return {Promise} result
	 */
	async upsertUiUser($happn, user) {
		const { security } = $happn.exchange;
		const { log } = $happn;

		await security.upsertUser(user, (err) => {
			if (err) return log.error("Cannot Upset user ", err);
			log.info(`User ${user.username} added to group ${user.group}`);
			return `User added - ${user.username} to group ${user.group}`;
		});
	}

	async deleteGroup($happn, group) {
		const { security } = $happn.exchange;
		const { log } = $happn;

		await security.deleteGroup(group, (err) => {
			if (err) return log.error("Cannot delete group ", err);
			log.info(`Group Removed ${group}`);
			return `Group Removed - ${group}`;
		});
	}

	async deleteUser($happn, user) {
		const { security } = $happn.exchange;
		const { log } = $happn;

		await security.deleteUser(user, (err) => {
			if (err) return log.error("Cannot delete group ", err);
			log.info(`User Removed ${user}`);
			return `User Removed - ${user}`;
		});
	}
}

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
