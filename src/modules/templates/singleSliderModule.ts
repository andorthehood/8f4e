import addDefaultInputPositions from '../helpers/addDefaultInputPositions';
import addDefaultOutputPositions from '../helpers/addDefaultOutputPositions';
import { ModuleGeneratorProps, ModuleType } from '../../state/types';
import { MODULE_HEIGHT_S, MODULE_WIDTH_S } from '../consts';

interface SliderConfig {
	minValue: number;
	maxValue: number;
	resolution: number;
	id: string;
}

export default function singleSliderModule(
	{ vGrid, hGrid }: ModuleGeneratorProps,
	{ minValue, maxValue, resolution, id }: SliderConfig
): ModuleType {
	return {
		category: '',
		engine: '',
		height: MODULE_HEIGHT_S * hGrid,
		inputs: addDefaultInputPositions([{ id: 'in' }], vGrid, hGrid),
		name: '',
		outputs: addDefaultOutputPositions([{ id: 'out' }], vGrid, hGrid, MODULE_WIDTH_S * vGrid),
		sliders: [
			{
				height: hGrid * 5,
				id,
				maxValue,
				minValue,
				resolution,
				width: vGrid * 2,
				x: vGrid * 8,
				y: hGrid * 2,
			},
		],
		steppers: [],
		switches: [],
		width: MODULE_WIDTH_S * vGrid,
	};
}
