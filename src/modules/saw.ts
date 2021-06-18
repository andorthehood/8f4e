import addDefaultOutputPositions from './helpers/addDefaultOutputPositions';
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
		sliders: [
			{
				height: hGrid * 5,
				id: 'rate',
				maxValue: 2000,
				minValue: 0,
				resolution: 10,
				width: vGrid * 2,
				x: vGrid,
				y: hGrid * 2,
			},
		],
		steppers: [],
		switches: [],
		width: MODULE_WIDTH_S * vGrid,
	};
}
