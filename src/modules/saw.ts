import addDefaultOutputPositions from '../helpers/addDefaultOutputPositions';
import { ModuleGeneratorProps, ModuleType } from '../state/types';
import { MODULE_HEIGHT_S, MODULE_WIDTH_S } from './consts';

export default function saw({ vGrid, hGrid }: ModuleGeneratorProps): ModuleType {
	return {
		config: {
			rate: 1000,
		},
		category: 'Oscillator',
		engine: 'saw',
		height: MODULE_HEIGHT_S * hGrid,
		inputs: [],
		name: 'Saw',
		outputs: addDefaultOutputPositions([{ id: 'out' }], vGrid, hGrid, MODULE_WIDTH_S * vGrid),
		sliders: [{ id: 'rate', x: 10, y: 20, width: 10, height: 50, minValue: 0, maxValue: 2000, resolution: 10 }],
		steppers: [],
		switches: [],
		width: MODULE_WIDTH_S * vGrid,
	};
}
