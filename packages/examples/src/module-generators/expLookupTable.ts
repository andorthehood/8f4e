export const expLookupTableMetadata = {
	title: 'Exponent Function Lookup Table (-1...1)',
	category: 'Lookup Tables',
} as const;

const exp = new Array(512).fill(0).map((value, index) => {
	return Math.exp(index / 512 - 1);
});

const expLookupTable = `module expLUT

${exp
	.map(value => {
		return `float ${value.toFixed(4)}`;
	})
	.join('\n')}

moduleEnd`;

export default expLookupTable;
