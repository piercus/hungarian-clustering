const uniq = require('./helpers/uniq');
const duplicated = require('./helpers/duplicated');
const groupItemsFromCouples = require('./group-items-from-couples');
const matchCoupleItems = require('./match-couple-items');
const getCouples = require('./get-couples');
const signature = require('./signature');
const mergeItems = require('./merge-items');
const mergeGeneric = require('./merge-generic');

/**
* @typedef {String} WorkerIdAndIteration
* @description a string in the format <workerId>-<iteration>
*/
/**
* @typedef {Object} Item
*/
/**
* @typedef {Item} Centroid
* @param {Number} confidence
*/
/**
* @typedef {Object} Cluster
* @param {Centroid} centroid
* @param {Array.<Item>} items
*/
/**
* @typedef {Item | Centroid} Item
*/
/**
* @typedef {Object} HungarianConf
* @property {Number} nExclusives
* @property {Number} threshold
* @property {MergeFn} mergeFn
* @property {DistFn} distFn
* @property {MapFn} mapFn
*/
/**
* @callback MergeFn
* This functions takes weighted items as input and merge them into a Centroid, containing a confidence property
*
* In most cases, this merge function can be easily created using `app/backend/shared/hungarian-consolidation/merge-generic.js`
* see example in `app/backend/bounding-boxes/utils/merge-boxes.js`
*
* @param {Array.<Item>} opts.items
* @param {Array.<Number>} opts.weights
* @param {HungarianConf} opts.conf
* @returns {Centroid}
*/
/**
* @callback DistFn
* Distance callback is a function that takes 2 arguments are returns a number between 0 and 1
* The number should equal 0 when a and b are the same object
* @param {Object} a
* @param {Object} b
* @returns {Number}
*/
/**
* @callback MapFn
* @param {Object} o
* @returns {Object}
*/
/**
* This algorithm is a conditional clustering algorithm
* It takes items (opts.items) as inputs and cluster th contents using following conditions
*  * items having same value of "exclusionKey" (opts.items[i][exclusionKey] is the same) goes to different cluster
*  * The clustering mechanism is based on the Hungarian_algorithm (also called Munkres) (see https://en.wikipedia.org/wiki/Hungarian_algorithm)
*  * Clustering is determinist
*  * Clustering does not depend on input's (items order) order.
*
* @param {Array.<Item>} items
* @param {Number} threshold
* @param {string} exclusionKey for example "label", consolidation is made label per label
* @param {DistFn} distFn
* @param {MergeFn} mergeFn
* @param {Array.<Number> | Null} numberKeys if null, we use the first items and his keys
* @param {MapFn} [MapFn=Identity]
* @returns {Array.<Cluster>}
*/
const hungarianClustering = function ({
	items,
	threshold,
	exclusionKey,
	distFn,
	mergeFn,
	numberKeys = null,
	mapFn = o => o,
}) {
	if (items.length === 0) {
		return [];
	}

	if (!mergeFn) {
		if (numberKeys === null) {
			numberKeys = Object.keys(items[0]).filter(k => k !== exclusionKey);
			if (numberKeys.some(k => typeof (items[0][k]) !== 'number')) {
				throw (new Error(`Please implement mergeFn function, in order to be able to merge your non-numeric items parameters (${numberKeys.filter(k => typeof (items[k]) !== 'number')})`));
			}
		}

		mergeFn = mergeGeneric.bind(this, numberKeys);
	}

	const exclusionIds = uniq(items.map((item, index) => (typeof (exclusionKey) === 'string' ? item[exclusionKey] : index)));
	const excludedItems = exclusionIds.map((exclId, _exclusionIndex) =>
		items
			.filter((item, index) => (typeof (exclusionKey) === 'string' ? item[exclusionKey] === exclId : index === _exclusionIndex))
			.map((item, _itemIndex) => Object.assign({}, item, {_exclusionIndex, _itemIndex})),
	);

	const conf = {
		nExclusives: excludedItems.length,
		exclusionKey,
		threshold,
		mergeFn,
		distFn,
		mapFn,
	};
	const totalItems = items.length;
	const couplesIndexes = getCouples(excludedItems.length);

	let allCouplesItemsSorted;
	if (excludedItems.length === 1) {
		const preds = excludedItems[0];
		const matched = matchCoupleItems(preds, [], conf);
		allCouplesItemsSorted = matched.map(a => a.items);
	} else {
		allCouplesItemsSorted = couplesIndexes
			.flatMap(([i0, i1]) => {
				const preds0 = excludedItems[i0];
				const preds1 = excludedItems[i1];
				const matched = matchCoupleItems(preds0, preds1, {threshold, mapFn, distFn});
				return matched;
			})
			.sort((a, b) => a.dist - b.dist)
			.map(a => a.items);
	}

	const aloneItems = allCouplesItemsSorted.filter(items => items.length === 1);
	const coupleItems = allCouplesItemsSorted.filter(items => items.length === 2);

	const groups = groupItemsFromCouples({
		coupleItems,
		conf,
	});

	const boxIds = groups.flatMap(g => g.items.map(signature));
	const dups = duplicated(boxIds);
	if (dups.length > 0) {
		throw (new Error('should not output any duplicated box'));
	}

	const aloneItemsIds = aloneItems.map(b => signature(b[0]));
	const remainingAlone = uniq(aloneItemsIds)
		.filter(bId => !boxIds.includes(bId))
		.map(bId => {
			const items = aloneItems[aloneItemsIds.indexOf(bId)];
			return {items, centroid: mergeItems({items, conf})};
		});

	// Console.log(`${remainingAlone.length} remains alone`)

	const result = groups.concat(remainingAlone)
		.map(annotation => Object.assign({}, annotation, {items: annotation.items.map(s => {
			delete s._itemIndex;
			return s;
		})}));

	// Uncomment for logging
	//
	// const byNumber = new Array(nExclusives).fill(1).map((_,i) => ({
	// 	count: res.filter(({items}) => items.length === i+1).length,
	// 	nExclusives: i+1
	// }));
	// console.log(`${res.length} groups of total (${res.map(r => r.items.length).reduce((a,b) => a+b, 0)}) (${byNumber.map(({count, nExclusives}) => nExclusives+': '+count).join(', ')})`);

	const totalItemsEnd = result.map(r => r.items.length).reduce((a, b) => a + b, 0);
	if (totalItemsEnd !== totalItems) {
		console.log(result);
		throw (new Error(`Cannot find expected number of items expecting ${totalItems} but got ${totalItemsEnd}`));
	}

	for (const cluster of result) {
		for (const it of cluster.items) {
			delete it._exclusionIndex;
			delete it._itemIndex;
		}
	}

	return result;
};

module.exports = hungarianClustering;
