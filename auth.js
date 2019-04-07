function MeshAuth() {
	this.sudoGrp = {
		name: "AECE",

		custom_data: "AECE",

		permissions: {
			methods: {
				"*": { authorized: true }
			},
			events: {
				"*": { authorized: true }
			}
		}
	};

	this.sudo = {
		username: "AECE_Admin",
		password: "admin",
		custom_data: {
			something: "useful"
		},
		application_data: {
			something: "untouchable by the user"
		},
		groups: {}
	};
}

MeshAuth.prototype.startAuth = function($happn) {
	const { info: logInfo, error: logError } = $happn.log;
	return new Promise(resolve => {
		this.upsertDefaultGroup($happn)
			.then(() => {
				this.upsertDefaultUser($happn);
			})
			.then(() => {
				logInfo("Auth Started");
				resolve();
			})
			.catch(err => {
				logError("Auth Startup Error ", err);
			});
	});
};

MeshAuth.prototype.upsertDefaultGroup = function($happn) {
	const { security } = $happn.exchange;
	return new Promise((resolve, reject) => {
		security.upsertGroup(this.sudoGrp, function(err, upserted) {
			if (err) reject(err);

			resolve(upserted);
			//group was upserted, permissions were merged with existing group if it existed
		});
	});
};

MeshAuth.prototype.upsertDefaultUser = function($happn) {
	const { security } = $happn.exchange;

	return new Promise((resolve, reject) => {
		this.sudo.groups["AECE"] = true;

		security.upsertUser(this.sudo, function(err, result) {
			if (err) reject(err);

			resolve(result);
		});
	});
};
MeshAuth.prototype.stopAuth = function() {
	return new Promise(resolve => {
		resolve();
	});
};

module.exports = MeshAuth;
