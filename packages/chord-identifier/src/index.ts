const enum Intervals {
	UNISON,
	MINOR_SECOND,
	MAJOR_SECOND,
	MINOR_THIRD,
	MAJOR_THIRD,
	PERFECT_FOURTH,
	TRITONE,
	PERFECT_FIFTH,
	MINOR_SIXTH,
	MAJOR_SIXTH,
	MINOR_SEVENTH,
	MAJOR_SEVENTH,
	OCTAVE,
}

const chords = {
	major: [Intervals.MAJOR_THIRD, Intervals.PERFECT_FIFTH],
	minor: [Intervals.MINOR_THIRD, Intervals.PERFECT_FIFTH],
	augmented: [Intervals.MAJOR_THIRD, Intervals.MAJOR_SIXTH],
	diminished: [Intervals.MINOR_THIRD, Intervals.TRITONE],
};

const chordSignsMajor = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const chordSignsMinor = ['Cm', 'Cm#', 'Dm', 'Dm#', 'Em', 'Fm', 'Fm#', 'Gm', 'Gm#', 'Am', 'Am#', 'Bm'];

export default function (midiNotes: number[]): string {
	const notes = Array.from(new Set(midiNotes.map(note => note % 12))).sort((a, b) => a - b);

	const chordType = Object.keys(chords).find(chordType => {
		if (chords[chordType][0] === notes[1] - notes[0] && chords[chordType][1] === notes[2] - notes[0]) {
			return chordType;
		}
	});

	switch (chordType) {
		case 'major':
			return chordSignsMajor[notes[0]];
		case 'minor':
			return chordSignsMinor[notes[0]];
		default:
			return '';
	}
}
