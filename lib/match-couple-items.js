const munkres = require('munkres-js');

const squarify = function (mat1, fullfill = 0) {
	let newColIndexes = [];
	let newRowIndexes = [];

	const mat = mat1.concat().map(r => r.concat());
	if (mat.length > mat[0].length) {
		const colstoAdd = mat.length - mat[0].length;
		newColIndexes = Array.from({length: colstoAdd}).fill(1).map((_, i) => i + mat[0].length);
		for (const r of mat) {
			r.push(...(Array.from({length: colstoAdd}).fill(fullfill)));
		}
	} else if (mat.length < mat[0].length) {
		const rowsToAdd = mat[0].length - mat.length;
		newRowIndexes = Array.from({length: rowsToAdd}).fill(1).map((_, i) => i + mat.length);

		mat.push(...Array.from({length: rowsToAdd}).fill(1).map(() => Array.from({length: mat[0].length}).fill(fullfill)));
	}

	return {
		newColIndexes,
		newRowIndexes,
		matrix: mat,
	};
};

const matchCoupleItems = function (preds0, preds1, {threshold, distFn, mapFn}) {
	if (preds0.length === 0) {
		return preds1.map((p, index) => ({
			items: [preds1[index]],
			dist: 1,
		}));
	}

	if (preds1.length === 0) {
		return preds0.map((p, index) => ({
			items: [preds0[index]],
			dist: 1,
		}));
	}

	const m1 = preds1.map(mapFn);
	const inverseIouMatrix = preds0.map(mapFn).map(p0 => m1.map(p1 => distFn(p0, p1)));
	const {matrix, newColIndexes, newRowIndexes} = squarify(inverseIouMatrix);

	const matches = munkres(matrix);

	const matchingTest = ([row, col]) => (!newColIndexes.includes(col) && !newRowIndexes.includes(row) && matrix[row][col] <= threshold);

	const matched = matches
		.filter(matchingTest)
		.map(([row, col]) => ({
			items: [Object.assign({}, preds0[row]), Object.assign({}, preds1[col])],
			dist: inverseIouMatrix[row][col],
		}));

	const nonMatched = matches.filter(o => !matchingTest(o))
		.flatMap(([row, col]) => {
			const result = [];
			if (!newColIndexes.includes(col)) {
				result.push({
					items: [preds1[col]],
					dist: 1,
				});
			}

			if (!newRowIndexes.includes(row)) {
				result.push({
					items: [preds0[row]],
					dist: 1,
				});
			}

			return result;
		});

	return matched.sort((a, b) => a.dist - b.dist).concat(nonMatched);
};

module.exports = matchCoupleItems;
