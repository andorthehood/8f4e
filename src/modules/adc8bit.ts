import { Config } from '@8f4e/synth-compiler/dist/modules/adc.asm';

import addDefaultInputPositions from './helpers/addDefaultInputPositions';
import addDefaultOutputPositions from './helpers/addDefaultOutputPositions';

import { ModuleType } from '../state/types';
import { HGRID } from '../view/drawers/consts';

export default function adc8bit(): ModuleType<Config> {
	const width = 8 * HGRID;
	const height = 12 * HGRID;

	return {
		buttons: [],
		category: 'Bitwise',
		engine: { name: 'adc', config: { resolution: 8 } },
		height,
		initialState: {},
		inputs: addDefaultInputPositions([{ id: 'in' }]),
		name: '8bit ADC',
		outputs: addDefaultOutputPositions(
			[...new Array(8).fill(0).map((item, i) => ({ id: 'out:' + (i + 1), label: 'bit' + i }))],
			width
		),
		sliders: [],
		steppers: [],
		width,
	};
}
