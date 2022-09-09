import chordNamer from '..';

const fixtures: [notes: number[], chord: string][] = [
	// C
	[[0, 4, 7], 'C'],
	[[12, 16, 19], 'C'],
	[[0, 4, 7, 12, 16, 19], 'C'],
	[[0, 16, 19], 'C'],
	[[0, 12, 16, 19], 'C'],
	[[4, 7, 12], 'C'],
	// D
	[[2, 6, 9], 'D'],
	[[14, 18, 21], 'D'],
	[[2, 6, 9, 14, 18, 21], 'D'],
	[[2, 18, 21], 'D'],
	[[2, 14, 18, 21], 'D'],
	[[6, 9, 14], 'D'],
	// Cm
	[[0, 3, 7], 'Cm'],
];

describe('chord namer', () => {
	test.each(fixtures)('given notes: %p the chord is: %p', (notes, chord) => {
		expect(chordNamer(notes)).toBe(chord);
	});
});
