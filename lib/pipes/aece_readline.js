const Transform = require("stream").Transform;

class AeceParser extends Transform {
	/**
	 * @param {object} options options for the parser
	 * @param {string|Buffer|array} options.delimiter data to look for before emitted "ready"
	 */
	constructor(options = {}) {
		if (options.delimiter === "undefined" || options.delimiter === null) {
			options.delimiter = "AAAA";
		}

		if (options.encoding === "undefined" || options.encoding === null) {
			options.encoding = "hex";
		}
		super(options);

		this.delimiter = Buffer.from(options.delimiter);
		this.readOffset = 0;
		this.ready = false;

		this.position = 0;
		this.lengthbuffer = Buffer.alloc(3);

		this.fullposition = 0;
		this.fullbuffer = Buffer.alloc(30);

		this.packetLength = 0;

		this._pending = 0;
		this._flushcb = undefined;
	}

	_transform(chunk, encoding, cb) {
		var self = this;
		//console.log("incoming chunk", chunk);

		let findStartDelimiter = async () => {
			try {
				//console.log("finding start delimiter");
				const delimiter = this.delimiter;
				let chunkOffset = 0;

				while (
					this.readOffset < delimiter.length &&
					chunkOffset < chunk.length
				) {
					if (delimiter[this.readOffset] === chunk[chunkOffset]) {
						this.readOffset++;
					} else {
						this.readOffset = 0;
					}
					chunkOffset++;
				}

				if (this.readOffset === delimiter.length) {
					this.ready = true;
					//console.log("READY");
					await this.emit("ready");
				}
			} catch (err) {
				console.log(err);
			}
		};

		let getPacket = async () => {
			try {
				let packetcursor = 0;
				++this._pending;
				// console.log("getting packet");
				// console.log("looking for bytes", bytes);

				while (packetcursor < chunk.length) {
					// console.log(
					// 	`writing chuck cursor-${chunk[packetcursor]} to ${
					// 		this.fullposition
					// 	}`
					// );

					this.fullbuffer[this.fullposition] = chunk[packetcursor];
					packetcursor++;
					this.fullposition++;
					// console.log(
					// 	`full position - ${this.fullposition} of ${this.packetLength}`
					// );

					if (this.fullposition === this.packetLength) {
						//console.log("pushing ", this.fullbuffer);
						self.push(this.fullbuffer);
						await reset();
						return cb();
					}
				}
				cb();
			} catch (err) {
				console.log(err);
			}
		};

		let getLengthBytes = async bytes => {
			try {
				console.log(`packet length --- ${this.packetLength}`);

				if (this.packetLength === 0) {
					let cursor = 0;
					//this.lengthbuffer = Buffer.alloc(3);
					//console.log("getting length bytes");
					//console.log("chunk length", chunk.length);
					//console.log("chuck- ", chunk);

					while (cursor < chunk.length) {
						this.lengthbuffer[this.position] = chunk[cursor];
						cursor++;
						this.position++;
						if (this.position == bytes) {
							//console.log("FOUND LENGTH", this.lengthbuffer[2]);
							this.packetLength = this.lengthbuffer[2];
							this.fullbuffer = Buffer.alloc(this.packetLength);
							getPacket();
						}
					}
				} else {
					getPacket();
				}
			} catch (err) {
				console.log(err);
			}
		};

		let reset = async () => {
			try {
				//console.log("RESETTING");
				this.lengthbuffer = Buffer.alloc(3);
				this.fullposition = 0;
				this.packetLength = 0;
				this.fullbuffer = null;
				this.position = 0;
			} catch (err) {
				console.log(err);
			}
		};

		let process = async () => {
			if (!this.ready) {
				await findStartDelimiter();

				//return cb();
			}
			//findStartDelimiter();
			await getLengthBytes(3);
		};

		return process();

		//cb();
	}

	_flush(callback) {
		console.log("flushing");
		this._flushcb = callback;
	}
}

module.exports = AeceParser;
