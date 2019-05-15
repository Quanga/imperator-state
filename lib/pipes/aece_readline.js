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

	_transform(chunk, encoding, cb) {
		this.storedBuffer = Buffer.concat([this.storedBuffer, chunk]);

		const findStartDelimiter = async () => {
			try {
				const { delimiter } = this;
				let fullOffset = 0;

				if (this.storedBuffer.length < 3) return;

				while (
					this.readOffset !== delimiter.length &&
					fullOffset < this.storedBuffer.length
				) {
					if (delimiter[this.readOffset] === this.storedBuffer[fullOffset]) {
						if (this.readOffset + 1 === delimiter.length) {
							this.delmiterStart = fullOffset - 1;
						}
						this.readOffset++;
					} else {
						this.delmiterStart = undefined;
						this.readOffset = 0;
					}
					fullOffset++;
				}

				if (this.readOffset === delimiter.length) {
					if (this.storedBuffer.length > 2) {
						if (this.delmiterStart === undefined) return;
						let newBuffer = this.storedBuffer.slice(this.delmiterStart);
						delete this.delmiterStart;

						this.storedBuffer = Buffer.alloc(newBuffer.length);
						newBuffer.copy(this.storedBuffer, 0);
					}

					this.emit("ready");
					this.ready = true;
					await getLengthBytes();
				}
			} catch (err) {
				return Promise.reject(err);
			}
		};

		let getLengthBytes = async () => {
			try {
				if (this.storedBuffer.length < 3) return;

				this.packetLength = this.storedBuffer[2];
				if (this.packetLength === 170) {
					console.log("EXTRA BYTE AA RECEIVED");
					this.storedBuffer = Buffer.from([...this.storedBuffer].slice(1));
					this.packetLength = this.storedBuffer[2];
				}

				if (this.storedBuffer.length >= this.packetLength) {
					await getPacket();
				}
			} catch (err) {
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
					if (!this.ready) {
						await findStartDelimiter();
					} else {
						await getLengthBytes();
					}
				}
			} catch (err) {
				return Promise.reject(err);
			}
		};

		let process = async () => {
			try {
				if (!this.ready) {
					await findStartDelimiter();
				} else {
					await getLengthBytes();
				}
			} catch (err) {
				return cb(err);
			}
			cb();
		};

		process();
	}
}

module.exports = AeceParser;
