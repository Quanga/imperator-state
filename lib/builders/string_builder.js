/**
 * Created by grant on 2016/10/27.
 */

function StringBuilder() {}

StringBuilder.prototype.append = function(rightItem) {
	let result = null;
	const self = this;

	return {
		to: function(leftItem) {
			result = leftItem + rightItem;

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
