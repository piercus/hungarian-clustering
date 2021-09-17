const test = require('ava');
const hungarianClustering = require('../index.js');

const distFn = (a, b) => ((a.x - b.x) * (a.x - b.x)) + ((a.y - b.y) * (a.y - b.y));

test('simple test', t => {
	const items = [{x: 22, y: 33}, {x: 23, y: 32}, {x: 200, y: 130}];

	const threshold = 10;

	const clusters = hungarianClustering({
		items,
		threshold,
		distFn,
	});
	t.deepEqual(clusters, [
		{centroid: {x: 22.5, y: 32.5, confidence: 0.6}, items: [{x: 22, y: 33}, {x: 23, y: 32}]},
		{centroid: {x: 200, y: 130, confidence: 1 / 3}, items: [{x: 200, y: 130}]},
	]);
});
test('With exclusion key', t => {
	const items = [{x: 22, y: 33, sensorId: 1}, {x: 23, y: 32, sensorId: 2}, {x: 200, y: 130, sensorId: 1}];

	const threshold = 10;

	const clusters = hungarianClustering({
		items,
		exclusionKey: 'sensorId',
		threshold,
		distFn,
	});
	t.deepEqual(clusters, [
		{centroid: {x: 22.5, y: 32.5, confidence: 0.9}, items: [{x: 22, y: 33, sensorId: 1}, {x: 23, y: 32, sensorId: 2}]},
		{centroid: {x: 200, y: 130, confidence: 0.5}, items: [{x: 200, y: 130, sensorId: 1}]},
	]);
});
