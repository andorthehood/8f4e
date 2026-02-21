export const expLookupTableMetadata = {
	title: 'Exponent Function Lookup Table (-1...1)',
	category: 'Lookup Tables',
} as const;

const exp = new Array(512).fill(0).map((value, index) => {
	return Math.exp(index / 512 - 1);
});

const expLookupTable = `module expLUT

float[] lut 512

${exp
	.map((value, index) => {
		return `init lut[${index}] ${value.toFixed(4)}`;
	})
	.join('\n')}

moduleEnd`;

export default expLookupTable;
