const getCouples = function (length) {
	const result = [];
	for (let i = 0; i < length; i++) {
		for (let j = i + 1; j < length; j++) {
			result.push([i, j]);
		}
	}

	return result;
};

module.exports = getCouples;
