import { Engine } from '@8f4e/2d-engine';
import { font } from '@8f4e/sprite-generator';

import { int16ToMidiNote } from '../../../state/helpers/midi';
import { State } from '../../../state/types';

const midiNoteLookup = new Array(128).fill(0).map((item, index) => {
	const notes = ['c', 'c#', 'd', 'd#', 'e', 'f', 'g', 'g#', 'a', 'a#', 'b'];
	const octave = Math.floor(index / 12);
	return notes[index % 12] + octave;
});

export default function drawer(engine: Engine, state: State, id: string): void {
	const address = state.compiler.memoryAddressLookup.get(id + 'out');

	if (!address) {
		return;
	}

	const value = midiNoteLookup[int16ToMidiNote(state.compiler.memoryBuffer[address])];

	engine.setSpriteLookup(font('white'));
	engine.drawText(20, 20, `${value}`);
}
