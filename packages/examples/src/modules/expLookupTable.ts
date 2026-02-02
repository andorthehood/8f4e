import type { ExampleModule } from '@8f4e/editor-state';

const exp = new Array(512).fill(0).map((value, index) => {
	return Math.exp(index / 512 - 1);
});

const sineLookupTable: ExampleModule = {
	title: 'Exponent Function Lookup Table (-1...1)',
	author: 'Andor Polgar',
	category: 'Lookup Tables',
	code: `module expLUT

float[] lut 512 

${exp
	.map((value, index) => {
		return `init lut[${index}] ${value.toFixed(4)}`;
	})
	.join('\n')}

moduleEnd`,
	tests: [],
};

export default sineLookupTable;
