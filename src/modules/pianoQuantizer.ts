import { midiNoteToInt16 } from '../state/helpers/midi';
import { MemoryTransformer, ModuleType } from '../state/types';

const transformer: MemoryTransformer = function (module, memoryBuffer, memoryAddressLookup) {
	const activeNotes = Object.keys(module.config)
		.filter(key => key.startsWith('note') && module.config[key])
		.map(note => parseInt(note.split(':')[1], 10))
		.slice(0, module.config.allocatedNotes);

	activeNotes.forEach((note, index) => {
		memoryBuffer[memoryAddressLookup[module.id + '_notes'] / memoryBuffer.BYTES_PER_ELEMENT + index] = midiNoteToInt16(
			note
		);
	});

	memoryBuffer[memoryAddressLookup[module.id + '_numberOfNotes'] / memoryBuffer.BYTES_PER_ELEMENT] = activeNotes.length;
};

const whiteKeys = [0, 2, 4, 5, 7, 9, 11];
const blackKeys = [1, 3, 6, 8, 10];
const blackKeyPositions = [13, 33, 73, 93, 113];
const allKeys = [...whiteKeys, ...blackKeys];
const whiteKeyWidth = 18;
const spacing = 2;
const keyboardWidth = whiteKeyWidth * whiteKeys.length + spacing * whiteKeys.length;

const getWhiteKeyIndex = function (note: number): number {
	return whiteKeys.indexOf(note % allKeys.length);
};

const getBlackKeyIndex = function (note: number): number {
	return blackKeys.indexOf(note % allKeys.length);
};

const pianoKeys = new Array(128).fill(0).map((item, index) => {
	const whiteKeyIndex = getWhiteKeyIndex(index);
	const blackKeyIndex = getBlackKeyIndex(index);
	const isWhite = blackKeyIndex === -1;
	const octave = Math.floor(index / allKeys.length);

	if (isWhite) {
		return {
			id: 'note:' + index,
			onValue: true,
			offValue: false,
			x: whiteKeyIndex * whiteKeyWidth + spacing * whiteKeyIndex + keyboardWidth * octave,
			y: 80,
			width: 18,
			height: 20,
		};
	} else {
		return {
			id: 'note:' + index,
			onValue: true,
			offValue: false,
			x: blackKeyPositions[blackKeyIndex] + keyboardWidth * octave,
			y: 40,
			width: 12,
			height: 40,
		};
	}
});

const pianoQuantizer: ModuleType = {
	category: 'Quantizer',
	connectors: [
		{ id: 'in', x: 5, y: 20, isInput: true },
		{ id: 'out', x: 1285, y: 20 },
	],
	config: {
		allocatedNotes: 32,
	},
	engine: 'quantizer',
	height: 100,
	name: 'Quantizer',
	sliders: [],
	steppers: [],
	switches: [...pianoKeys],
	transformer,
	width: 1500,
};

export default pianoQuantizer;
