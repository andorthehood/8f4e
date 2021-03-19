import { I16_SIGNED_LARGEST_NUMBER, I16_SIGNED_SMALLEST_NUMBER } from '../../packages/compiler/src';
import { ModuleType } from '../state/types';

const constant: ModuleType = {
	width: 100,
	height: 100,
	connectors: [{ id: 'out', x: 85, y: 20, isInput: false }],
	name: 'Constant',
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
	config: {
		out: 0,
	},
	switches: [],
	steppers: [],
	engine: 'constant',
};

export default constant;
