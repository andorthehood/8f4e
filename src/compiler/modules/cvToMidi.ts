import { createFunctionBody } from '../wasm/sections';
import { ModuleGenerator } from './types';

const enum Memory {
	NOTE_INPUT_POINTER = 0x00,
	CLOCK_INPUT_POINTER = 0x04,
	MIDI_CHANNEL = 0x08,
}

const cvToMidi: ModuleGenerator = function (moduleId, offset) {
	const functionBody = createFunctionBody([], []);

	return {
		moduleId,
		functionBody,
		offset,
		initialMemory: [0, 0, 0],
		memoryAddresses: [
			{ address: Memory.NOTE_INPUT_POINTER + offset, id: 'cvin', isInputPointer: true },
			{ address: Memory.CLOCK_INPUT_POINTER + offset, id: 'clockin', isInputPointer: true },
			{ address: Memory.MIDI_CHANNEL + offset, id: 'channel' },
		],
	};
};

export default cvToMidi;
