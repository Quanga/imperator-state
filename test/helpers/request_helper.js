const request = require("supertest");

class RequestHelper {
	constructor() {
		this.response = null;
	}

	async getAll() {
		try {
			let req = await request("http://localhost:55000");
			await req
				.get("/rest/method/eventService/getModelStructureFlat")
				.then(res => {
					//response = res.body.data;
					let body = res.body.data;
					this.response = body.map(item => {
						return item.data;
					});
				});
			return this.response;
		} catch (err) {
			return Promise.reject(err);
		}
	}

	async getBlastModel() {
		try {
			let req = await request("http://localhost:55000");
			await req.get("/rest/method/eventService/getBlastModel").then(res => {
				//response = res.body.data;
				let body = res.body.data;
				this.response = body;
			});
			return this.response;
		} catch (err) {
			return Promise.reject(err);
		}
	}

	async getAllBlastModels() {
		let req = await request("http://localhost:55000");
		await req.get("/rest/method/eventService/getAllBlastModels").then(res => {
			//response = res.body.data;
			let body = res.body.data;
			this.response = body;
		});
		return this.response;
	}
	catch(err) {
		return Promise.reject(err);
	}
}

module.exports = RequestHelper;
