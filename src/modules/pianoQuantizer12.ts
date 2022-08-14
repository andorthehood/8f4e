import addDefaultInputPositions from './helpers/addDefaultInputPositions';
import addDefaultOutputPositions from './helpers/addDefaultOutputPositions';
import { ModuleGeneratorProps, ModuleType, Button } from '../state/types';
import { MODULE_HEIGHT_S, MODULE_WIDTH_M } from './consts';
import generateBorderLines from './helpers/generateBorderLines';
import generatePianoKeyLayout from './helpers/generatePianoKeyLayout';
import { Config } from '@8f4e/synth-compiler/dist/modules/quantizer';

export default function pianoQuantizer({ vGrid, hGrid }: ModuleGeneratorProps): ModuleType<Config> {
	const width = MODULE_WIDTH_M * vGrid;
	const height = MODULE_HEIGHT_S * hGrid;
	const pianoX = vGrid;
	const pianoY = hGrid * 4.5;
	const keyCount = 12;

	return {
		buttons: [
			...generatePianoKeyLayout<Button>({ keyCount, vGrid, hGrid }, ({ index, x, y, ...rest }) => {
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
		initialState: { octave: 1 },
		inputs: addDefaultInputPositions([{ id: 'in' }], vGrid, hGrid),
		lines: [...generateBorderLines(vGrid, hGrid, width, height)],
		name: 'Quantizer 12',
		outputs: addDefaultOutputPositions([{ id: 'out' }], vGrid, hGrid, width),
		sliders: [],
		steppers: [
			{ id: 'octave', x: vGrid * 26, y: 5 * hGrid, width: vGrid * 2, height: hGrid, minValue: 1, maxValue: 8 },
		],
		width,
	};
}
