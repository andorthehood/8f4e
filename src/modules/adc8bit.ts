import addDefaultInputPositions from './helpers/addDefaultInputPositions';
import addDefaultOutputPositions from './helpers/addDefaultOutputPositions';
import { ModuleGeneratorProps, ModuleType } from '../state/types';
import { MODULE_HEIGHT_M, MODULE_WIDTH_S } from './consts';

export default function adc8bit({ vGrid, hGrid }: ModuleGeneratorProps): ModuleType {
	return {
		category: 'Bitwise',
		config: {
			resolution: 8,
		},
		engine: 'adc',
		height: MODULE_HEIGHT_M * hGrid,
		inputs: addDefaultInputPositions([{ id: 'in' }], vGrid, hGrid),
		name: '8bit ADC',
		outputs: addDefaultOutputPositions(
			[...new Array(8).fill(0).map((item, i) => ({ id: 'out:' + (i + 1), label: 'bit' + i }))],
			vGrid,
			hGrid,
			MODULE_WIDTH_S * vGrid
		),
		sliders: [],
		steppers: [],
		switches: [],
		width: MODULE_WIDTH_S * vGrid,
	};
}
