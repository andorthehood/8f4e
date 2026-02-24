const A = 440;

const midiFrequencies = new Array(128).fill(0).map((value, note) => {
	return (A / 32) * 2 ** ((note - 9) / 12);
});

const midiFrequenciesLookupTable = `module midiLUT

float[] notes 128
${midiFrequencies
	.map((value, note) => {
		return `init notes[${note}] ${value.toFixed(4)}`;
	})
	.join('\n')}

moduleEnd`;

export default midiFrequenciesLookupTable;
