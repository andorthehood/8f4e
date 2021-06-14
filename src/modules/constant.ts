import { I16_SIGNED_LARGEST_NUMBER, I16_SIGNED_SMALLEST_NUMBER } from 'compiler';
import addDefaultInputPositions from '../helpers/addDefaultInputPositions';
import { ModuleGeneratorProps, ModuleType } from '../state/types';
import { MODULE_HEIGHT_S, MODULE_WIDTH_S } from './consts';

export default function constant({ vGrid, hGrid }: ModuleGeneratorProps): ModuleType {
	return {
		category: 'Other',
		config: {
			out: 0,
		},
		engine: 'constant',
		height: MODULE_HEIGHT_S * hGrid,
		inputs: addDefaultInputPositions([{ id: 'out' }], vGrid, hGrid),
		name: 'Constant',
		outputs: [],
		sliders: [
			{
				id: 'out',
				x: 10,
				y: 20,
				width: 10,
				height: 50,
				minValue: I16_SIGNED_SMALLEST_NUMBER,
				maxValue: I16_SIGNED_LARGEST_NUMBER,
				resolution: 100,
			},
		],
		steppers: [],
		switches: [],
		width: MODULE_WIDTH_S * vGrid,
	};
}
