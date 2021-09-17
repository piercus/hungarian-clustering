const uniq = function (array) {
	return array.filter((a, index) => array.indexOf(a) === index);
};

module.exports = uniq;
