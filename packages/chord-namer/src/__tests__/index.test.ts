import chordNamer from '..';

const fixtures: [notes: number[], chord: string][] = [
	[[0, 4, 7], 'C'],
	[[12, 16, 19], 'C'],
	[[0, 16, 19], 'C'],
	[[0, 12, 16, 19], 'C'],
	[[0, 3, 7], 'Cm'],
];

describe('chord namer', () => {
	test.each(fixtures)('given notes: %p the chord is: %p', (notes, chord) => {
		expect(chordNamer(notes)).toBe(chord);
	});
});
