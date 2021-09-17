const uniq = require('./helpers/uniq');

const mergeItems = function ({items, conf, debug = false}) {
	const {nExclusives, mapFn, distFn, threshold, mergeFn} = conf;

	if (typeof (nExclusives) !== 'number') {
		throw (new TypeError('nExclusives is mandatory'));
	}

	if (items.length > nExclusives) {
		throw (new Error(`items ${items.length} should be less than nExclusives ${3}`));
	}

	if (uniq(items.map(b => b._exclusionIndex)).length !== items.length) {
		throw (new Error('_exclusionIndex should be uniques'));
	}

	if (items.length === 0) {
		throw (new Error('items should not be empty'));
	}

	if (!Array.isArray(items)) {
		throw (new TypeError('items should be an array'));
	}

	if (items.length === 1) {
		const avItem = mergeFn({items, weights: [1], conf});
		return Object.assign(avItem, {confidence: 1 / nExclusives});
	}

	const proximity = (a, b) => {
		if (threshold === 0) {
			return Math.abs(threshold - distFn(a, b)) === 0 ? 0 : 1;
		}

		return Math.abs(threshold - distFn(a, b)) / threshold;
	};

	const mappedItems = items.map(mapFn);
	const matrix = mappedItems.map((_, i) => mappedItems.map((_, j) => proximity(mappedItems[i], mappedItems[j])));

	const weights = matrix.map(row => row.reduce((a, b) => a + b) - 1);
	const avItem = mergeFn({items, weights, conf});

	// Metric build so 1 >= confidence >= 1 / nExclusives
	const confidence = weights
		.map(w => (w + 1) / nExclusives)
		.reduce((a, b) => a + b) / weights.length;
	if (debug) {
		console.log(matrix, items[0], items[7], {threshold});
	}

	if (Number.isNaN(confidence)) {
		throw (new TypeError('confidence should not be NaN'));
	}

	return Object.assign({}, avItem, {confidence});
};

module.exports = mergeItems;
