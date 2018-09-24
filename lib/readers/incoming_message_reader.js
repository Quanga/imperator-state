/**
 * Created by grant on 2016/07/12.
 */

function IncomingMessageReader() {}

IncomingMessageReader.prototype.getReadFunc = function (options) {
	return new Promise((resolve, reject) => {
		try {
			let result = this.readline(options.startDelimiter);
			resolve(result);
		} catch (err) {
			reject(err);
		}
	});
};

IncomingMessageReader.prototype.readline = function (startDelimiter, encoding) {
	if (typeof startDelimiter === 'undefined' || startDelimiter === null) {
		startDelimiter = '\r';
	}

	if (typeof encoding === 'undefined' || encoding === null) {
		encoding = 'hex';
	}
	// Delimiter buffer saved in closure
	var data = '';
	var delimiter = startDelimiter.toLowerCase();

	return (emitter, buffer) => {
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
};

module.exports = IncomingMessageReader;