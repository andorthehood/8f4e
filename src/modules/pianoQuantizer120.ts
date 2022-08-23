import addDefaultInputPositions from './helpers/addDefaultInputPositions';
import addDefaultOutputPositions from './helpers/addDefaultOutputPositions';
import { midiNoteToInt16 } from '../state/helpers/midi';
import { ModuleGeneratorProps, ModuleType, Button, ButtonClickHandler } from '../state/types';
import { MODULE_HEIGHT_S, MODULE_WIDTH_XXL } from './consts';
import generateBorderLines from './helpers/generateBorderLines';
import generatePianoKeyLayout from './helpers/generatePianoKeyLayout';
import { insertState, extractState } from '@8f4e/synth-compiler/dist/modules/quantizer';
import { Config } from '@8f4e/synth-compiler/dist/modules/quantizer';

const onButtonClick: ButtonClickHandler = function (module, memoryBuffer, memoryAddressLookup, value) {
	const { activeNotes } = extractState(memoryBuffer, memoryAddressLookup[module.id].__startAddress);

	if (activeNotes.includes(value)) {
		activeNotes.splice(activeNotes.indexOf(value), 1);
	} else {
		activeNotes.push(value);
	}

	insertState({ activeNotes }, memoryBuffer, memoryAddressLookup[module.id].__startAddress);
};

interface PrecalculatedValues {
	notes: Map<number, number>;
	keyNumbers: Map<number, number>;
}

export type PianoQuantizer = ModuleType<Config, PrecalculatedValues>;

export default function pianoQuantizer({ vGrid, hGrid }: ModuleGeneratorProps): PianoQuantizer {
	const width = MODULE_WIDTH_XXL * vGrid;
	const height = MODULE_HEIGHT_S * hGrid;
	const pianoX = vGrid * 5;
	const pianoY = hGrid * 3;
	const keyCount = 128;

	return {
		buttons: [
			...generatePianoKeyLayout<Button>({ keyCount, vGrid, hGrid }, ({ index, x, y, ...rest }) => {
				return {
					id: 'note:' + index,
					value: midiNoteToInt16(index),
					onClick: onButtonClick,
					x: x + pianoX,
					y: y + pianoY,
					...rest,
				};
			}),
		],
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
		precalculatedValues: {
			notes: new Map(new Array(127).fill(0).map((item, index) => [midiNoteToInt16(index), index])),
			keyNumbers: new Map(new Array(127).fill(0).map((item, index) => [midiNoteToInt16(index), index % 12])),
		},
		initialState: {},
		inputs: addDefaultInputPositions([{ id: 'in' }], vGrid, hGrid),
		lines: [...generateBorderLines(vGrid, hGrid, width, height)],
		name: 'Quantizer 120',
		outputs: addDefaultOutputPositions([{ id: 'out' }], vGrid, hGrid, width),
		insertState,
		extractState,
		sliders: [],
		steppers: [],
		width,
	};
}
