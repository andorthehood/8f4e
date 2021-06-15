import { I16_SIGNED_LARGEST_NUMBER } from 'compiler';
import addDefaultInputPositions from './helpers/addDefaultInputPositions';
import addDefaultOutputPositions from './helpers/addDefaultOutputPositions';
import { ModuleGeneratorProps, ModuleType } from '../state/types';
import { MODULE_HEIGHT_S, MODULE_WIDTH_S } from './consts';

export default function offset({ vGrid, hGrid }: ModuleGeneratorProps): ModuleType {
	return {
		category: 'Other',
		config: {
			offset: 0,
		},
		engine: 'offset',
		height: MODULE_HEIGHT_S * hGrid,
		inputs: addDefaultInputPositions([{ id: 'in' }], vGrid, hGrid),
		name: 'Offset',
		outputs: addDefaultOutputPositions([{ id: 'out' }], vGrid, hGrid, MODULE_WIDTH_S * vGrid),
		steppers: [],
		sliders: [
			{
				height: 50,
				id: 'offset',
				maxValue: I16_SIGNED_LARGEST_NUMBER,
				minValue: 0,
				resolution: 100,
				width: 10,
				x: 10,
				y: 20,
			},
		],
		switches: [],
		width: MODULE_WIDTH_S * vGrid,
	};
}
