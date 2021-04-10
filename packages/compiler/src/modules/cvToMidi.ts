import { createFunctionBody } from '../../../byteCodeUtils/src';
import { ModuleGenerator } from '../types';

enum Memory {
	NOTE_INPUT_POINTER,
	CLOCK_INPUT_POINTER,
	MIDI_CHANNEL,
}

const cvToMidi: ModuleGenerator = function (moduleId, offset, config) {
	const functionBody = createFunctionBody([], []);

	return {
		moduleId,
		functionBody,
		offset: offset(0),
		initialMemory: [0, 0, config.channel || 0],
		memoryAddresses: [
			{ address: offset(Memory.NOTE_INPUT_POINTER), id: 'in:note' },
			{ address: offset(Memory.CLOCK_INPUT_POINTER), id: 'in:clock' },
			{ address: offset(Memory.MIDI_CHANNEL), id: 'channel' },
		],
	};
};

export default cvToMidi;
