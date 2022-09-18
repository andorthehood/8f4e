import { Config } from '@8f4e/synth-compiler/dist/modules/quantizer.asm';

import addDefaultInputPositions from './helpers/addDefaultInputPositions';
import addDefaultOutputPositions from './helpers/addDefaultOutputPositions';
import { MODULE_HEIGHT_S, MODULE_WIDTH_L } from './consts';
import generatePianoKeyLayout from './helpers/generatePianoKeyLayout';

import { Button, ModuleType } from '../state/types';
import { HGRID, VGRID } from '../view/drawers/consts';

export default function pianoQuantizer(): ModuleType<Config> {
	const width = MODULE_WIDTH_L;
	const height = MODULE_HEIGHT_S;
	const pianoX = VGRID;
	const pianoY = HGRID * 4.5;
	const keyCount = 24;

	return {
		buttons: [
			...generatePianoKeyLayout<Button>({ keyCount }, ({ index, x, y, ...rest }) => {
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
		initialState: {},
		inputs: addDefaultInputPositions([{ id: 'in' }]),
		name: 'Quantizer 24',
		outputs: addDefaultOutputPositions([{ id: 'out' }], width),
		sliders: [],
		steppers: [],
		width,
	};
}
