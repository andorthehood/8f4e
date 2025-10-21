import type { ExampleModule } from '@8f4e/editor-state';

const midiNoteOut: ExampleModule = {
	title: 'MIDI Note Out',
	author: 'Andor Polgar',
	category: 'MIDI',
	code: `module midinoteout

int* note
int channel 1
int* gate
int* velocity

moduleEnd`,
	tests: [],
};

export default midiNoteOut;
