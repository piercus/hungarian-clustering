// Const keys = ['left', 'top', 'width', 'height']; // bounding boxes
// keys = ['x', 'y']; // keypoints

const mergeGeneric = function (keys, {weights, items}) {
	const sumBox = items
		.map((box, index) => {
			const result = {weight: weights[index]};
			for (const k of keys) {
				result[k] = box[k] * weights[index];
			}

			return result;
		})
		.reduce((a, b) => {
			const result = {weight: a.weight + b.weight};
			for (const k of keys) {
				result[k] = a[k] + b[k];
			}

			return result;
		});

	const avBox = {};

	for (const k of keys) {
		if (sumBox.weight === 0) {
			avBox[k] = sumBox[k];
		} else {
			avBox[k] = sumBox[k] / sumBox.weight;
		}

		if (Number.isNaN(avBox[k])) {
			throw (new TypeError('should not be NaN'));
		}
	}

	return avBox;
};

module.exports = mergeGeneric;
