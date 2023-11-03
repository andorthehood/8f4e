import { ExampleModule } from '../../../packages/editor/src/state/types';

const sine = new Array(256).fill(0).map((value, index) => {
	return Math.sin((index / 255) * (2 * Math.PI));
});

const sineLookupTable: ExampleModule = {
	title: 'Sine Lookup Table',
	author: 'Andor Polgar',
	category: 'Lookup Tables',
	code: `module sineLUT

${sine
	.map((value, index) => {
		return `float sin${index} ${value.toFixed(4)}`;
	})
	.join('\n')}

moduleEnd`,
	tests: [],
};

export default sineLookupTable;
