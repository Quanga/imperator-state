function DataMapper() {
	this.__instance = null;
}
DataMapper.prototype.mapInsertPacket = function(packet) {
	const {
		data,
		complete,
		start,
		length,
		command: pcommand,
		serial: pserial
	} = packet;

	return new Promise(resolve => {
		resolve({
			message: complete,
			start: start,
			length: length,
			command: pcommand,
			serial: pserial,
			data_device_type: data != null ? data.deviceType : null,
			data_device_id: data != null ? data.deviceId : null,
			data_raw_bit_0: data != null ? data.raw[0] : null,
			data_raw_bit_1: data != null ? data.raw[1] : null,
			data_raw_bit_2: data != null ? data.raw[2] : null,
			data_raw_bit_3: data != null ? data.raw[3] : null,
			data_raw_bit_4: data != null ? data.raw[4] : null,
			data_raw_bit_5: data != null ? data.raw[5] : null,
			data_raw_bit_6: data != null ? data.raw[6] : null,
			data_raw_bit_7: data != null ? data.raw[7] : null,
			crc: packet.crc,
			created_at: null
		});
	});
};

/***
 * @summary handle the node update Mapping
 * @param parsedPacket - parse packet
 * @param foundResult - record from database
 */
DataMapper.prototype.mapUpdateNode = function(parsedPacket, foundResult) {
	let mapAsync = async () => {
		parsedPacket.id = foundResult.id;
		try {
			foundResult.serial = parseInt(foundResult.serial);
			//compare the incoming with the db values and report the changed values
			let compareResult = await this.checkDifference(parsedPacket, foundResult);
			let changes = Object.entries(compareResult).filter(
				x =>
					x[1]["incoming"] !== undefined &&
					x[1]["incoming"] !== null &&
					x[1]["existing"] !== undefined
			);
			if (changes.length > 0) {
				foundResult.dirty = changes;
			}

			foundResult = await mapProps(parsedPacket, foundResult);
		} catch (err) {
			console.log("error", err);
			return Promise.reject(err);
		}

		return foundResult;
	};

	let mapProps = async (newNode, dbNode) => {
		for (let key in newNode) {
			if (dbNode.hasOwnProperty(key)) {
				let propResult = newNode[key];
				if (propResult != null) {
					if (newNode[key] != null) {
						dbNode[key] = newNode[key];
					}
				}
			}
		}
		return dbNode;
	};
	return mapAsync();
};

/***
 * @summary check the difference betweein two ojects
 * @param parsedPacket - parse packet
 * @param foundResult - record from database
 */
DataMapper.prototype.checkDifference = function(leftObj, rightObj) {
	let checkDifAsync = async () => {
		const empty = {};
		const isObject = x => Object(x) === x;
		try {
			const diff1 = (left = {}, right = {}, rel = "incoming") =>
				Object.entries(left)
					.map(
						([k, v]) =>
							isObject(v) && isObject(right[k])
								? [k, diff1(v, right[k], rel)]
								: right[k] !== v
									? [k, { [rel]: v }]
									: [k, empty]
					)
					.reduce(
						(acc, [k, v]) => (v === empty ? acc : { ...acc, [k]: v }),
						empty
					);
			const merge = (left = {}, right = {}) =>
				Object.entries(right).reduce(
					(acc, [k, v]) =>
						isObject(v) && isObject(left[k])
							? { ...acc, [k]: merge(left[k], v) }
							: { ...acc, [k]: v },
					left
				);
			const diff = (x = {}, y = {}) =>
				merge(diff1(x, y, "incoming"), diff1(y, x, "existing"));
			let result = diff(leftObj, rightObj);
			// console.log(result);
			return result;
		} catch (err) {
			console.log(err);
			return Promise.reject(err);
		}
	};
	return checkDifAsync();
};

module.exports = DataMapper;
