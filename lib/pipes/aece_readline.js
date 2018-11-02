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

		this.packetLength = 0;

		this.storedBuffer = Buffer.alloc(0);
	}

	async _transform(chunk, encoding, cb) {
		this.storedBuffer = Buffer.concat([this.storedBuffer, chunk]);

		let findStartDelimiter = async () => {
			try {
				const delimiter = this.delimiter;
				let chunkOffset = 0;

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
					let newBuffer = this.storedBuffer.slice(chunkOffset - 2);
					this.storedBuffer = Buffer.alloc(newBuffer.length);
					newBuffer.copy(this.storedBuffer, 0);
					this.emit("ready");
					this.ready = true;
					await getLengthBytes(3);
				}
			} catch (err) {
				console.log(err);
				return Promise.reject(err);
			}
		};

		let getLengthBytes = async () => {
			try {
				this.packetLength = this.storedBuffer[2];

				if (this.storedBuffer.length >= this.packetLength) {
					await getPacket();
				}
			} catch (err) {
				console.log(err);
				return Promise.reject(err);
			}
		};

		let getPacket = async () => {
			try {
				let packet = this.storedBuffer.slice(0, this.packetLength);
				this.push(packet);

				let newBuffer = this.storedBuffer.slice(this.packetLength);
				this.storedBuffer = Buffer.alloc(newBuffer.length);
				newBuffer.copy(this.storedBuffer, 0);

				this.ready = false;
				this.packetLength = 0;
				this.readOffset = 0;

				if (this.storedBuffer.length > 0) {
					await process();
				}
			} catch (err) {
				console.log(err);
				return Promise.reject(err);
			}
		};

		let process = async () => {
			if (!this.ready) {
				await findStartDelimiter();
			} else {
				await getLengthBytes();
			}

			cb();
		};

		await process();
	}
}

module.exports = AeceParser;
