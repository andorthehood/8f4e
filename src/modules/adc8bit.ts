import addDefaultInputPositions from './helpers/addDefaultInputPositions';
import addDefaultOutputPositions from './helpers/addDefaultOutputPositions';
import source from './engines/adc.asm';

import { ModuleType } from '../state/types';
import { HGRID } from '../view/drawers/consts';

export default function adc8bit(): ModuleType {
	const width = 8 * HGRID;
	const height = 12 * HGRID;

	return {
		buttons: [],
		category: 'Bitwise',
		engine: { source: source({ resolution: 8 }) },
		height,
		initialState: {},
		inputs: addDefaultInputPositions([{ id: 'in' }]),
		name: '8bit ADC',
		outputs: addDefaultOutputPositions(
			[...new Array(8).fill(0).map((item, i) => ({ id: 'out:' + (i + 1), label: 'bit' + i }))],
			width
		),
		width,
	};
}
