const duplicated = require('./helpers/duplicated');
const mergeItems = require('./merge-items');

const mergeGroups = function ({groups, conf}) {
	if (groups.length !== 2) {
		throw (new Error('not implemented ! yet ?!'));
	}

	const allItems = groups.map(l => l.items).reduce((a, b) => a.concat(b));

	return findBestGroupsFromItems({items: allItems.concat(), conf});
};

const findBestGroupsFromItems = function ({items, conf}) {
	const existing = items.map(b => ({centroid: mergeItems({items: [b], conf}), items: [b]}));
	return findBestGroupsFromGroups({
		groups: existing,
		conf,
	});
};

const findBestGroupsFromGroups = function ({groups, cache = null, conf}) {
	if (groups.length === 1) {
		return groups;
	}

	let max = 0;
	let maxIndexes = null;

	cache = groups.map((b1, i1) => groups.map((b2, i2) => {
		if (cache && cache[i1] && cache[i1][i2]) {
			return cache[i1][i2];
		}

		if (i2 > i1) {
			const allExclusionIndexes = b1.items.map(({_exclusionIndex}) => _exclusionIndex).concat(b2.items.map(({_exclusionIndex}) => _exclusionIndex));
			const dup = duplicated(allExclusionIndexes);
			if (dup.length === 0) {
				const items = b1.items.concat(b2.items);
				const m = {
					centroid: mergeItems({items, conf}),
					items,
				};
				// Console.log('here it is', m.centroid.confidence, m.items.length)
				if (m.centroid.confidence > max && m.centroid.confidence > b1.centroid.confidence && m.centroid.confidence > b2.centroid.confidence) {
					maxIndexes = [i1, i2];
					max = m.centroid.confidence;
				}

				return m;
			}

			return null;
		}

		return null;
	}));

	if (!maxIndexes) {
		// Console.log('no maxIndexes', cache, max, groups.map(g=> g.centroid.confidence))
		return groups;
	}

	groups.splice(maxIndexes[1], 1);
	groups.splice(maxIndexes[0], 1);
	groups.push(cache[maxIndexes[0]][maxIndexes[1]]);

	for (const row of cache) {
		row.splice(maxIndexes[1], 1);
		row.splice(maxIndexes[0], 1);
	}

	cache.splice(maxIndexes[1], 1);
	cache.splice(maxIndexes[0], 1);

	return findBestGroupsFromGroups({
		groups,
		cache,
		conf,
	});
};

module.exports = mergeGroups;
