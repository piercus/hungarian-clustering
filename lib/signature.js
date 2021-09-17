const signature = (o => {
	const {_exclusionIndex, _itemIndex} = o;
	if (typeof (_exclusionIndex) !== 'number') {
		throw (new TypeError('_exclusionIndex should be number'));
	}

	if (typeof (_itemIndex) !== 'number') {
		throw (new TypeError('_itemIndex should be number'));
	}

	return _exclusionIndex + '-' + _itemIndex;
});
module.exports = signature;
