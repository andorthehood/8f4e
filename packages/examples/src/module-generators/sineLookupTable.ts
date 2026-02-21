export const sineLookupTableMetadata = {
	title: 'Sine Lookup Table',
	category: 'Lookup Tables',
} as const;

const sine = new Array(256).fill(0).map((value, index) => {
	return Math.sin((index / 255) * (2 * Math.PI));
});

const sineLookupTable = `module sineLUT

${sine
	.map((value, index) => {
		return `float sin${index} ${value.toFixed(4)}`;
	})
	.join('\n')}

moduleEnd`;

export default sineLookupTable;
