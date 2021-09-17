const uniq = require('./helpers/uniq');

const mergeGroups = require('./merge-groups');
const signature = require('./signature');

const mergeItems = require('./merge-items');

const groupItemsFromCouples = function ({coupleItems, conf}) {
	const locked = [];
	const lockedBoxIds = {};
	const exclusionKey = {conf};

	const addNewLock = function (lock) {
		const lockId = locked.length;

		locked.push(lock);
		const boxIds = lock.items.map(signature);
		for (const id of boxIds) {
			lockedBoxIds[id] = lockId;
		}
	};

	const deleteLock = function (lockId) {
		// Console.log({lockId, lock: locked[lockId]})
		for (const id of locked[lockId].items.map(signature)) {
			delete lockedBoxIds[id];
		}

		locked[lockId] = null;
	};

	const isUsedBoxId = (id => typeof (lockedBoxIds[id]) === 'number');
	for (const items of coupleItems) {
		const boxIds = items.map(signature);

		const values = boxIds.filter(isUsedBoxId);

		if (values.length === 0) {
			// The box is locked
			addNewLock({items: items.concat(), centroid: mergeItems({items, conf})});
		} else if (values.length === items.length) {
			const lockIndexes = uniq(values.map(id => lockedBoxIds[id]));
			if (uniq(lockIndexes).length !== 1) {
				const newLocks = mergeGroups({groups: lockIndexes.map(index => locked[index]), conf});

				// Debugging
				lockIndexes.forEach(deleteLock);
				newLocks.forEach(addNewLock);
			}
		} else {
			const boxLocked = boxIds.map((id, index) => ({id, index})).filter(({id}) => isUsedBoxId(id)).map(({index}) => items[index])[0];
			const boxNotLocked = boxIds.map((id, index) => ({id, index})).filter(({id}) => !isUsedBoxId(id)).map(({index}) => items[index])[0];

			const boxLockedId = signature(boxLocked);
			const boxNotLockedId = signature(boxNotLocked);

			const lockId = lockedBoxIds[boxLockedId];
			const lockedItem = locked[lockId];
			let newMerged;
			let newBoxes;
			if (!lockedItem.items.map(b => b[exclusionKey]).includes(boxNotLocked[exclusionKey])) {
				newBoxes = lockedItem.items.concat([boxNotLocked]);
				newMerged = mergeItems({items: newBoxes, conf});
			}

			if (newMerged && newMerged.confidence > lockedItem.centroid.confidence) {
				lockedBoxIds[boxNotLockedId] = lockId;
				lockedItem.items = newBoxes;
				lockedItem.centroid = newMerged;
			} else {
				const items = [boxNotLocked];
				const centroid = mergeItems({items, conf});
				addNewLock({
					items,
					centroid,
				});
			}
		}
	}

	return locked.filter(l => Boolean(l));
};

module.exports = groupItemsFromCouples;
