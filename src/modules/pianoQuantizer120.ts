import addDefaultInputPositions from './helpers/addDefaultInputPositions';
import addDefaultOutputPositions from './helpers/addDefaultOutputPositions';
import { midiNoteToInt16 } from '../state/helpers/midi';
import { ModuleType, Button, ButtonClickHandler } from '../state/types';
import { MODULE_HEIGHT_S, MODULE_WIDTH_XXL } from './consts';
import generateBorderLines from './helpers/generateBorderLines';
import generatePianoKeyLayout from './helpers/generatePianoKeyLayout';
import { insertState, extractState, Config } from '@8f4e/synth-compiler/dist/modules/quantizer.asm';
import { HGRID, VGRID } from '../view/drawers/consts';

const onButtonClick: ButtonClickHandler = function (module, memoryBuffer, memoryAddressLookup, value) {
	const { activeNotes } = extractState(memoryBuffer, memoryAddressLookup[module.id].__startAddress);

	if (activeNotes.includes(value)) {
		activeNotes.splice(activeNotes.indexOf(value), 1);
	} else {
		activeNotes.push(value);
	}

	insertState({ activeNotes }, memoryBuffer, memoryAddressLookup[module.id].__startAddress);
};

export type PianoQuantizer = ModuleType<
	Config,
	{ keyCount: number; x: number; y: number; notes: Map<number, number>; keyNumbers: Map<number, number> }
>;

export default function pianoQuantizer(): PianoQuantizer {
	const width = MODULE_WIDTH_XXL;
	const height = MODULE_HEIGHT_S;
	const pianoX = VGRID * 5;
	const pianoY = HGRID * 3;
	const keyCount = 120;

	return {
		buttons: [
			...generatePianoKeyLayout<Button>({ keyCount }, ({ index, x, y, ...rest }) => {
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
				notes: new Map(new Array(keyCount).fill(0).map((item, index) => [midiNoteToInt16(index), index])),
				keyNumbers: new Map(new Array(keyCount).fill(0).map((item, index) => [midiNoteToInt16(index), index % 12])),
			},
		},
		engine: { name: 'quantizer', config: { allocatedNotes: 32 } },
		height,
		initialState: {},
		inputs: addDefaultInputPositions([{ id: 'in' }]),
		lines: [...generateBorderLines(width, height)],
		name: 'Quantizer 120',
		outputs: addDefaultOutputPositions([{ id: 'out' }], width),
		insertState,
		extractState,
		sliders: [],
		steppers: [],
		width,
	};
}
