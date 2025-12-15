import type { ExampleModule } from '@8f4e/editor-state';

const A = 440;

const midiFrequencies = new Array(128).fill(0).map((value, note) => {
	return (A / 32) * 2 ** ((note - 9) / 12);
});

const midiFrequenciesLookupTable: ExampleModule = {
	title: 'MIDI Frequencies Lookup Table',
	author: 'Andor Polgar',
	category: 'Lookup Tables',
	code: `module midiLUT

float[] notes 128
${midiFrequencies
	.map((value, note) => {
		return `init notes[${note}] ${value.toFixed(4)}`;
	})
	.join('\n')}

moduleEnd`,
	tests: [],
};

export default midiFrequenciesLookupTable;
