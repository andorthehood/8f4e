export const sineLookupTableMetadata = {
	title: 'Sine Lookup Table',
	category: 'Lookup Tables',
} as const;

const sine = new Array(256).fill(0).map((value, index) => {
	return Math.sin((index / 255) * (2 * Math.PI));
});

const sineLookupTable = `module sineLUT
@tab 8
${sine
	.map(value => {
		return `float	${value.toFixed(4)}`;
	})
	.join('\n')}

moduleEnd`;

export default sineLookupTable;
