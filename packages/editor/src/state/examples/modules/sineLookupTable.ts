const sineLookupTable = new Array(256).fill(0).map((value, index) => {
	return Math.sin((index / 255) * (2 * Math.PI));
});

export default `module sineLookupTable

${sineLookupTable
	.map((value, index) => {
		return `float sin${index} ${value.toFixed(4)}`;
	})
	.join('\n')}

end`;
