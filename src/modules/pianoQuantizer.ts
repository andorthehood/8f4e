import { midiNoteToInt16 } from '../state/helpers/midi';
import { MemoryTransformer, ModuleType } from '../state/types';

const transformer: MemoryTransformer = function (module, memoryBuffer, memoryAddressLookup) {
	const activeNotes = Object.keys(module.config)
		.filter(key => key.startsWith('note') && module.config[key])
		.map(note => parseInt(note.split(':')[1], 10))
		.slice(0, 12);

	activeNotes.forEach((note, index) => {
		memoryBuffer[memoryAddressLookup[module.id + '_notes'] / memoryBuffer.BYTES_PER_ELEMENT + index] = midiNoteToInt16(
			note
		);
	});

	memoryBuffer[memoryAddressLookup[module.id + '_numberOfNotes'] / memoryBuffer.BYTES_PER_ELEMENT] = activeNotes.length;
};

const pianoQuantizer: ModuleType = {
	connectors: [
		{ id: 'in', x: 5, y: 20, isInput: true },
		{ id: 'out', x: 185, y: 20 },
	],
	engine: 'quantizer',
	height: 100,
	name: 'Quantizer',
	sliders: [],
	steppers: [],
	switches: [
		...new Array(128).fill(0).map((item, index) => {
			return {
				id: 'note:' + index,
				onValue: true,
				offValue: false,
				x: index * 10 + 5,
				y: 70,
				width: 10,
				height: 10,
			};
		}),
	],
	transformer,
	width: 1300,
};

export default pianoQuantizer;
