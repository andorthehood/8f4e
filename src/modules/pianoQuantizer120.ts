import addDefaultInputPositions from './helpers/addDefaultInputPositions';
import addDefaultOutputPositions from './helpers/addDefaultOutputPositions';
import { midiNoteToInt16 } from '../state/helpers/midi';
import { ModuleGeneratorProps, ModuleType, Button, ButtonClickHandler } from '../state/types';
import { MODULE_HEIGHT_S, MODULE_WIDTH_XXL } from './consts';
import generateBorderLines from './helpers/generateBorderLines';
import generatePianoKeyLayout from './helpers/generatePianoKeyLayout';
import { insertState, extractState } from 'compiler/modules/quantizer';
import { Config } from 'compiler/modules/quantizer';

const onButtonClick: ButtonClickHandler = function (module, memoryBuffer, memoryAddressLookup, value) {
	const { activeNotes } = extractState(memoryBuffer, memoryAddressLookup[module.id]);

	if (activeNotes.includes(value)) {
		activeNotes.splice(activeNotes.indexOf(value), 1);
	} else {
		activeNotes.push(value);
	}

	insertState({ activeNotes }, memoryBuffer, memoryAddressLookup[module.id]);
};

export default function pianoQuantizer({ vGrid, hGrid }: ModuleGeneratorProps): ModuleType<Config> {
	const width = MODULE_WIDTH_XXL * vGrid;
	const height = MODULE_HEIGHT_S * hGrid;
	const pianoX = vGrid;
	const pianoY = hGrid * 4.5;
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
