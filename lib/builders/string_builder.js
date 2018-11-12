function StringBuilder() {}

StringBuilder.prototype.append = function(rightItem) {
	const self = this;
	let result = null;

	return {
		to: function(leftItem) {
			result = leftItem + rightItem;
			//result = rightItem + leftItem;

			return {
				complete: function() {
					return result;
				},
				and: function(item) {
					return self.append(item).to(result);
				},
				then: function() {
					return self;
				}
			};
		}
	};
};

module.exports = StringBuilder;
