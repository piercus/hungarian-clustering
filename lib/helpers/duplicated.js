const uniq = require('./uniq');

const duplicated = array => uniq(array.filter((a, i) => array.indexOf(a) !== i));

module.exports = duplicated;
