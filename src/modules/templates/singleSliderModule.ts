import addDefaultInputPositions from '../helpers/addDefaultInputPositions';
import addDefaultOutputPositions from '../helpers/addDefaultOutputPositions';
import { ModuleType, SliderChangeHandler } from '../../state/types';
import { HGRID, VGRID } from '../../view/drawers/consts';

interface SliderConfig {
	minValue: number;
	maxValue: number;
	resolution: number;
	id: string;
	onChange: SliderChangeHandler;
}

export default function singleSliderModule({ minValue, maxValue, resolution, id, onChange }: SliderConfig): ModuleType {
	const width = 8 * HGRID;
	const height = 8 * HGRID;

	return {
		buttons: [],
		category: '',
		engine: { name: '', config: {} },
		height,
		initialState: {},
		inputs: addDefaultInputPositions([{ id: 'in' }]),
		name: '',
		outputs: addDefaultOutputPositions([{ id: 'out' }], width),
		sliders: [
			{
				height: HGRID * 5,
				id,
				maxValue,
				minValue,
				resolution,
				width: VGRID * 2,
				x: VGRID * 8,
				y: HGRID * 3,
				onChange,
			},
		],
		width,
	};
}
