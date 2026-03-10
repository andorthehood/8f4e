const A = 440;

const midiFrequencies = new Array(128).fill(0).map((value, note) => {
	return (A / 32) * 2 ** ((note - 9) / 12);
});

const midiFrequenciesLookupTable = `module midiLUT
; @tab 8
${midiFrequencies
	.map(value => {
		return `float	${value.toFixed(4)}`;
	})
	.join('\n')}

moduleEnd`;

export default midiFrequenciesLookupTable;
