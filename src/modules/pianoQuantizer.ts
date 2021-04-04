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

const whiteKeys = new Array(60).fill(0).map((item, index) => {
	const whiteKeys = [0, 2, 4, 5, 7, 9, 11];

	return {
		id: 'note:' + (whiteKeys[index % 7] + Math.floor(index / 7) * 12),
		onValue: true,
		offValue: false,
		x: index * 18 + 2 * index,
		y: 80,
		width: 18,
		height: 20,
	};
});

const blackKeys = new Array(60).fill(0).map((item, index) => {
	const blackKeys = [1, 3, 6, 8, 10];

	return {
		id: 'note:' + (blackKeys[index % 5] + Math.floor(index / 5) * 12),
		onValue: true,
		offValue: false,
		x: 13 + index * 18 + 2 * index,
		y: 40,
		width: 12,
		height: 40,
	};
});

const pianoQuantizer: ModuleType = {
	connectors: [
		{ id: 'in', x: 5, y: 20, isInput: true },
		{ id: 'out', x: 1285, y: 20 },
	],
	engine: 'quantizer',
	height: 100,
	name: 'Quantizer',
	sliders: [],
	steppers: [],
	switches: [...whiteKeys, ...blackKeys],
	transformer,
	width: 1300,
	category: 'Quantizer',
};

export default pianoQuantizer;
