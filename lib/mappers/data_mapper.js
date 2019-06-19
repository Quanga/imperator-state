const diff = require("deep-object-diff").diff;

class DataMapper {
	getUpdates(nextState, prevState) {
		const getUpdatesAsync = () => {
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

module.exports = DataMapper;
