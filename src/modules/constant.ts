import { I16_SIGNED_LARGEST_NUMBER, I16_SIGNED_SMALLEST_NUMBER } from 'compiler';
import { ModuleType } from '../state/types';

const constant: ModuleType = {
	category: 'Other',
	config: {
		out: 0,
	},
	engine: 'constant',
	height: 10,
	inputs: [{ id: 'out', x: 85, y: 20 }],
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
	width: 20,
};

export default constant;
