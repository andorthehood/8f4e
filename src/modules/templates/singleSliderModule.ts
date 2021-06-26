import addDefaultInputPositions from '../helpers/addDefaultInputPositions';
import addDefaultOutputPositions from '../helpers/addDefaultOutputPositions';
import { ModuleGeneratorProps, ModuleType, SliderChangeHandler } from '../../state/types';
import { MODULE_HEIGHT_S, MODULE_WIDTH_S } from '../consts';
import generateBorderLines from '../helpers/generateBorderLines';

interface SliderConfig {
	minValue: number;
	maxValue: number;
	resolution: number;
	id: string;
	onChange: SliderChangeHandler;
}

export default function singleSliderModule(
	{ vGrid, hGrid }: ModuleGeneratorProps,
	{ minValue, maxValue, resolution, id, onChange }: SliderConfig
): ModuleType {
	const width = MODULE_WIDTH_S * vGrid;
	const height = MODULE_HEIGHT_S * hGrid;

	return {
		buttons: [],
		category: '',
		engine: { name: '', config: {} },
		height,
		initialState: {},
		inputs: addDefaultInputPositions([{ id: 'in' }], vGrid, hGrid),
		lines: [...generateBorderLines(vGrid, hGrid, width, height)],
		name: '',
		outputs: addDefaultOutputPositions([{ id: 'out' }], vGrid, hGrid, width),
		sliders: [
			{
				height: hGrid * 5,
				id,
				maxValue,
				minValue,
				resolution,
				width: vGrid * 2,
				x: vGrid * 8,
				y: hGrid * 3,
				onChange,
			},
		],
		steppers: [],
		width,
	};
}
