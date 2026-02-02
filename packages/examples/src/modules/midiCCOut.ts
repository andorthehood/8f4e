import type { ExampleModule } from '@8f4e/editor-state';

const midiCCOut: ExampleModule = {
	title: 'MIDI CC Out',
	author: 'Andor Polgar',
	category: 'MIDI',
	code: `module midiccout

int cc 1
int channel 1
int* in

moduleEnd`,
	tests: [],
};

export default midiCCOut;
