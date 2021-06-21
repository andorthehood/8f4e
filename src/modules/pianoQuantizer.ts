import addDefaultInputPositions from './helpers/addDefaultInputPositions';
import addDefaultOutputPositions from './helpers/addDefaultOutputPositions';
import { midiNoteToInt16 } from '../state/helpers/midi';
import { MemoryTransformer, Module, ModuleGeneratorProps, ModuleType, Switch } from '../state/types';
import { MODULE_HEIGHT_S, MODULE_WIDTH_XXL } from './consts';
import generateBorderLines from './helpers/generateBorderLines';
import generatePianoKeyLayout from './helpers/generatePianoKeyLayout';
import { MemoryAddressLookup } from 'compiler';

const transformer: MemoryTransformer = function (
	module: Module,
	memoryBuffer: Int32Array,
	memoryAddressLookup: MemoryAddressLookup
) {
	const activeNotes = Object.keys(module.state)
		.filter(key => key.startsWith('note') && module.state[key])
		.map(note => parseInt(note.split(':')[1], 10))
		.slice(0, module.engine.config.allocatedNotes);

	activeNotes.forEach((note, index) => {
		memoryBuffer[memoryAddressLookup[module.id + '_notes'] / memoryBuffer.BYTES_PER_ELEMENT + index] = midiNoteToInt16(
			note
		);
	});

	memoryBuffer[memoryAddressLookup[module.id + '_numberOfNotes'] / memoryBuffer.BYTES_PER_ELEMENT] = activeNotes.length;
};

export default function pianoQuantizer({ vGrid, hGrid }: ModuleGeneratorProps): ModuleType {
	const width = MODULE_WIDTH_XXL * vGrid;
	const height = MODULE_HEIGHT_S * hGrid;
	const pianoX = vGrid;
	const pianoY = hGrid * 4.5;
	const keyCount = 128;

	return {
		category: 'Quantizer',
		drawer: {
			name: 'piano',
			config: {
				keyCount,
				x: pianoX,
				y: pianoY,
			},
		},
		engine: { name: 'quantizer', config: { allocatedNotes: 32 } },
		height,
		initialState: {},
		inputs: addDefaultInputPositions([{ id: 'in' }], vGrid, hGrid),
		lines: [...generateBorderLines(vGrid, hGrid, width, height)],
		name: 'Quantizer',
		outputs: addDefaultOutputPositions([{ id: 'out' }], vGrid, hGrid, width),
		sliders: [],
		steppers: [],
		switches: [
			...generatePianoKeyLayout<Switch>({ keyCount, vGrid, hGrid }, ({ index, x, y, ...rest }) => {
				return {
					id: 'note:' + index,
					onValue: true,
					offValue: false,
					x: x + pianoX,
					y: y + pianoY,
					...rest,
				};
			}),
		],
		transformer,
		width,
	};
}
