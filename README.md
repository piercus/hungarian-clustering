## hungarian clustering

This repo implements a clustering tools implemented on top of [https://github.com/addaleax/munkres-js](munkres-js).

The implementation relies on following ideas : 
* The implementation is fully symetric against the order of the items as input
* The implementation is fully determinist, (no need any seeding mechanism)
* The threshold decides wether a new item should go in a cluster or not
* It is possible to add a "exclusion" condition to prevent 2 items being in the same cluster
* It returns a confidence

This clustering algorithm is useful to merge observations from different sensors (or sources) :
* Each observation is an item
* The id of the sensor is used as "exclusionKey", so if the same sensor detects 2 different observation, there are not merge with each others
* The confidence gives an idea about how many sources have observed it compared to the maximum number of sources that may observe it

## Example

### Simple example
```js
const items = [{x:22, y: 33},{x: 23, y: 32}, {x: 200, y: 130}]

const distFn = (a,b) => {
	return (a.x - b.x)*(a.x - b.x) + (a.y - b.y)*(a.y - b.y)
};

const threshold = 10;

const clusters = hungarianClustering({	
	items,
	threshold,
	distFn
});

console.log(clusters);
// [
//   { centroid: {x:22, y: 33, confidence: 0.66}, items: [{x:22, y: 33},{x: 23, y: 32}]},
//   { centroid: {x: 200, y: 130, confidence: 0.33}, items: [{x: 200, y: 130}]}
// ]
```

### With exclusionKey

```js
const items = [{x:22, y: 33, sensorId: 1},{x: 23, y: 32, sensorId: 2}, {x: 200, y: 130, sensorId: 1}]

const distFn = (a,b) => {
	return (a.x - b.x)*(a.x - b.x) + (a.y - b.y)*(a.y - b.y)
};

const threshold = 10;

const clusters = hungarianClustering({	
	items,
	exclusionKey: "sensorId",
	threshold,
	distFn
});

console.log(clusters);
// [
//   { centroid: {x:22, y: 33, confidence: 0.66}, items: [{x:22, y: 33},{x: 23, y: 32}]},
//   { centroid: {x: 200, y: 130, confidence: 0.33}, items: [{x: 200, y: 130}]}
// ]
```