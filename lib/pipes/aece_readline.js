const Transform = require("stream").Transform;

/**
 * A transform stream that waits for a sequence of "ready" bytes before emitting a ready event and emitting data events
 * @summary To use the `Ready` parser provide a byte start sequence. After the bytes have been received a ready event is fired and data events are passed through.
 * @extends Transform
 * @example
const SerialPort = require('serialport')
const Ready = require('@serialport/parser-ready')
const port = new SerialPort('/dev/tty-usbserial1')
const parser = port.pipe(new Ready({ delimiter: 'READY' }))
parser.on('ready', () => console.log('the ready byte sequence has been received'))
parser.on('data', console.log) // all data after READY is received
 */
class AeceParser extends Transform {
	/**
	 *
	 * @param {object} options options for the parser
	 * @param {string|Buffer|array} options.delimiter data to look for before emitted "ready"
	 */
	constructor(options = {}) {

        if (options.startDelimiter === 'undefined' || startDelimiter === null) {
            startDelimiter = '\r'
        }

        if (options.encoding === 'undefined' || encoding === null) {
            encoding = 'hex'
        }

		super(options);
		this.delimiter = Buffer.from(options.delimiter);
		this.readOffset = 0;
		this.ready = false;
    }
    
     


	_transform(chunk, encoding, cb) {
		if (this.ready) {
			this.push(chunk);
			return cb();
	    }

		const delimiter = this.delimiter;
	    let chunkOffset = 0;

		while (this.readOffset < delimiter.length && chunkOffset < chunk.length) {
			if (delimiter[this.readOffset] === chunk[chunkOffset]) {
				this.readOffset++;
			} else {
				this.readOffset = 0;
			}
			chunkOffset++;
		}
		if (this.readOffset === delimiter.length) {
			this.ready = true;
			this.emit("ready");
			const chunkRest = chunk.slice(chunkOffset);
			if (chunkRest.length > 0) {
				this.push(chunkRest);
			}
		}
		cb();
    }
    



    // IncomingMessageReader.prototype.readline = function (startDelimiter, encoding) {

        // Delimiter buffer saved in closure
       

        return function (emitter, buffer) {

            data += buffer.toString(encoding).toLowerCase();
            var parts = data.split(delimiter);

            var currentPos = 0;
            var partsLen = parts.length;
            var length = null;

            parts.forEach(function (part) {
                var hexLen = '';

                if (partsLen == 1 && part.length >= 2)
                    hexLen = parts[0].substr(0, 2);
                else if (currentPos > 0 && part.length >= 2)
                    hexLen = parts[currentPos].substr(0, 2);

                if (hexLen != '') {
                    length = parseInt(hexLen, 16);

                    if ((length * 2) == (startDelimiter.length + part.length)) {
                        emitter.emit('data', delimiter + part);
                    }
                }

                currentPos++;
            });

            var lastPart = parts[parts.length - 1];

            if (lastPart.length == ((length * 2) - delimiter.length)) {
                data = '';
            } else {
                data = delimiter + lastPart;
            }
        };
    // };
}

module.exports = AeceParser;
