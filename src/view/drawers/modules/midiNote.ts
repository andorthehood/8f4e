import { font } from '../../../../packages/spriteGenerator/src';
import { int16ToMidiNote } from '../../../state/helpers/midi';

const midiNoteLookup = new Array(128).fill(0).map((item, index) => {
	const notes = ['c', 'c#', 'd', 'd#', 'e', 'f', 'g', 'g#', 'a', 'a#', 'b'];
	const octave = Math.floor(index / 12);
	return notes[index % 12] + octave;
});

const drawer = function (engine, state, id) {
	const address =
		state.ui.compiler.outputAddressLookup[id + '_' + 'out'] / state.ui.compiler.memoryBuffer.BYTES_PER_ELEMENT;

	if (!address) {
		return;
	}

	const value = midiNoteLookup[int16ToMidiNote(state.ui.compiler.memoryBuffer[address])];

	engine.setSpriteLookup(font('small_white'));
	engine.drawText(20, 20, `${value}`);
};

export default drawer;
