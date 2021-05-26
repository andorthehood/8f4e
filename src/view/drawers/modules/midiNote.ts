import { font } from '../../../../packages/sprite-generator/src';
import { int16ToMidiNote } from '../../../state/helpers/midi';
import { State } from '../../../state/types';

const midiNoteLookup = new Array(128).fill(0).map((item, index) => {
	const notes = ['c', 'c#', 'd', 'd#', 'e', 'f', 'g', 'g#', 'a', 'a#', 'b'];
	const octave = Math.floor(index / 12);
	return notes[index % 12] + octave;
});

export default function drawer(engine, state: State, id) {
	const address = state.compiler.outputAddressLookup[id + '_' + 'out'] / state.compiler.memoryBuffer.BYTES_PER_ELEMENT;

	if (!address) {
		return;
	}

	const value = midiNoteLookup[int16ToMidiNote(state.compiler.memoryBuffer[address])];

	engine.setSpriteLookup(font('small_white'));
	engine.drawText(20, 20, `${value}`);
}
