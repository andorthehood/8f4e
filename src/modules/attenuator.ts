import addDefaultInputPositions from '../helpers/addDefaultInputPositions';
import addDefaultOutputPositions from '../helpers/addDefaultOutputPositions';
import { ModuleGeneratorProps, ModuleType } from '../state/types';
import { MODULE_HEIGHT_S, MODULE_WIDTH_S } from './consts';

export default function attenuator({ vGrid, hGrid }: ModuleGeneratorProps): ModuleType {
	return {
		category: 'Other',
		config: {
			divisor: 1,
		},
		engine: 'attenuator',
		height: MODULE_HEIGHT_S * hGrid,
		inputs: addDefaultInputPositions([{ id: 'in' }], vGrid, hGrid),
		name: 'Attenuator',
		outputs: addDefaultOutputPositions([{ id: 'out' }], vGrid, hGrid, MODULE_WIDTH_S * vGrid),
		sliders: [{ id: 'divisor', x: 10, y: 20, width: 10, height: 50, minValue: 1, maxValue: 100, resolution: 1 }],
		steppers: [],
		switches: [],
		width: MODULE_WIDTH_S * vGrid,
	};
}
