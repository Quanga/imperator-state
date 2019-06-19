/* eslint-disable no-unused-vars */
const diff = require("deep-object-diff").diff;

// function DataMapper() {
// }
class DataMapper {
	getUpdates(nextState, prevState) {
		const getUpdatesAsync = () => {
			//nextState.data.serial = parseInt(nextState.data.serial);
			const diffs = diff(prevState.data, nextState.data);

			let diffNulls = Object.keys(diffs).filter(x => diffs[x] === null);
			let filterOut = ["modified", "path", "created", ...diffNulls];

			for (let index = 0; index < filterOut.length; index++) {
				const element = filterOut[index];
				delete diffs[element];
			}

			if (Object.keys(diffs).length > 0) {
				return diffs;
			}
			return null;
		};
		return getUpdatesAsync();
	}
}
// /***
//  * @summary handle the node update Mapping
//  * @param nextState - parse packet
//  * @param foundResult - record from database
//  */
// DataMapper.prototype.mapUpdateNode = function(nextState, prevState) {
// 	let mapAsync = async () => {
// 		try {
// 			nextState.data.serial = parseInt(nextState.data.serial);

// 			const diffs = diff(prevState.data, nextState.data);
// 			let diffNulls = Object.keys(diffs).filter(x => diffs[x] === null);
// 			let filterOut = ["modified", "path", "created", ...diffNulls];

// 			for (let index = 0; index < filterOut.length; index++) {
// 				const element = filterOut[index];
// 				delete diffs[element];
// 			}

// 			if (Object.keys(diffs).length > 0) {
// 				nextState.meta.dirty = diffs;
// 			}

// 			let result = await mapProps(nextState, prevState);
// 			return result;
// 		} catch (err) {
// 			return Promise.reject(err);
// 		}
// 	};

// };

/***
 * @summary check the difference betweein two ojects
 * @param parsedPacket - parse packet
 * @param foundResult - record from database
 */
// DataMapper.prototype.checkDifference = function(leftObj, rightObj) {
// 	let checkDifAsync = async () => {
// 		try {
// 			const empty = {};
// 			const isObject = x => Object(x) === x;

// 			const diff1 = (left = {}, right = {}, rel = "incoming") =>
// 				Object.entries(left)
// 					.map(([k, v]) =>
// 						isObject(v) && isObject(right[k])
// 							? [k, diff1(v, right[k], rel)]
// 							: right[k] !== v
// 								? [k, { [rel]: v }]
// 								: [k, empty]
// 					)
// 					.reduce(
// 						(acc, [k, v]) => (v === empty ? acc : { ...acc, [k]: v }),
// 						empty
// 					);

// 			const merge = (left = {}, right = {}) =>
// 				Object.entries(right).reduce(
// 					(acc, [k, v]) =>
// 						isObject(v) && isObject(left[k])
// 							? { ...acc, [k]: merge(left[k], v) }
// 							: { ...acc, [k]: v },
// 					left
// 				);

// 			const diff = (x = {}, y = {}) =>
// 				merge(diff1(x, y, "incoming"), diff1(y, x, "existing"));

// 			let result = diff(leftObj, rightObj);

// 			return result;
// 		} catch (err) {
// 			return Promise.reject(err);
// 		}
// 	};
// 	return checkDifAsync();
// };

module.exports = DataMapper;
