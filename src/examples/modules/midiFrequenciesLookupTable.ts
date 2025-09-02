import type { ExampleModule } from '../../../packages/editor/src/state/types';

const A = 440;

const midiFrequencies = new Array(128).fill(0).map((value, note) => {
	return (A / 32) * 2 ** ((note - 9) / 12);
});

const midiFrequenciesLookupTable: ExampleModule = {
	title: 'MIDI Frequencies Lookup Table',
	author: 'Andor Polgar',
	category: 'Lookup Tables',
	code: `module midiLUT

${midiFrequencies
	.map((value, note) => {
		return `float note${note} ${value.toFixed(4)}`;
	})
	.join('\n')}

moduleEnd`,
	tests: [],
};

export default midiFrequenciesLookupTable;
