import type { ExampleModule } from '@8f4e/editor-state';

const midiPianoKeyboardC3: ExampleModule = {
	title: 'MIDI Piano Keyboard (First key: C3)',
	author: 'Andor Polgar',
	category: 'MIDI',
	code: `module piano
int[] notes 12
int notesCount 0
# piano notes notesCount 48
moduleEnd`,
	tests: [],
};

export default midiPianoKeyboardC3;
