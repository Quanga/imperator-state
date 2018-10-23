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

		this.storedBuffer = Buffer.alloc(0);
	}

	_transform(chunk, encoding, cb) {
		this.storedBuffer = Buffer.concat([this.storedBuffer, chunk]);
		//console.log("storedbuffer", this.storedBuffer.toString("hex"));

		let findStartDelimiter = async () => {
			try {
				const delimiter = this.delimiter;
				let chunkOffset = 0;
				//console.log("FINDING DELIMITER");

				while (
					this.readOffset < delimiter.length &&
					chunkOffset < this.storedBuffer.length
				) {
					if (delimiter[this.readOffset] === this.storedBuffer[chunkOffset]) {
						this.readOffset++;
					} else {
						this.readOffset = 0;
					}
					chunkOffset++;
				}

				if (this.readOffset === delimiter.length) {
					this.emit("ready");
					this.ready = true;
				}
			} catch (err) {
				console.log(err);
			}
		};

		let getPacket = async () => {
			try {
				// console.log(
				// 	`storedbuffer - ${this.storedBuffer.toString(
				// 		"hex"
				// 	)} storebuffer length - ${this.storedBuffer.length}  packetLength - ${
				// 		this.packetLength
				// 	}  fullposi - ${this.fullposition}  `
				// );
				let packetcursor = 0;
				while (packetcursor < this.packetLength) {
					this.fullbuffer[this.fullposition] = this.storedBuffer[packetcursor];
					if (packetcursor === this.storedBuffer.length) {
						return;
					}
					packetcursor++;
					this.fullposition++;

					if (this.fullposition === this.packetLength) {
						this.ready = false;
						this.push(this.fullbuffer);

						this.lengthbuffer = Buffer.alloc(3);

						let newBuffer = chunk.slice(
							this.packetLength,
							this.storedBuffer.length
						);

						this.storedBuffer = Buffer.alloc(
							this.storedBuffer.length - this.packetLength
						);

						newBuffer.copy(this.storedBuffer, 0);

						this.fullposition = 0;
						this.packetLength = 0;

						//console.log("chunk length", chunk.length);

						//console.log("storedbuffer", this.storedBuffer.toString("hex"));
						if (this.storedBuffer.length > 0) {
							process();
						}
					}
				}
			} catch (err) {
				console.log(err);
			}
		};

		let getLengthBytes = async bytes => {
			try {
				if (this.packetLength < 1) {
					let cursor = 0;
					this.position = 0;

					while (cursor < this.storedBuffer.length) {
						this.lengthbuffer[this.position] = chunk[cursor];
						cursor++;
						this.position++;
						if (this.position == bytes) {
							this.packetLength = this.lengthbuffer[2];
							this.fullbuffer = Buffer.alloc(this.packetLength);
							break;
						}
					}
					if (this.storedBuffer.length >= this.packetLength) {
						await getPacket();
					}
				} else {
					if (this.storedBuffer.length >= this.packetLength) {
						await getPacket();
					} else {
						return;
					}
				}
			} catch (err) {
				console.log(err);
			}
		};

		let process = async () => {
			if (!this.ready) {
				await findStartDelimiter();
			}
			await getLengthBytes(3);
			cb();
		};

		process();
	}
}

module.exports = AeceParser;
