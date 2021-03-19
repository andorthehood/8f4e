import { I16_SIGNED_LARGEST_NUMBER } from '../../packages/compiler/src';
import { ModuleType } from '../state/types';

const offset: ModuleType = {
	width: 100,
	height: 100,
	connectors: [
		{ id: 'in', x: 5, y: 20, isInput: true },
		{ id: 'out', x: 85, y: 20, isInput: false },
	],
	name: 'Offset',
	sliders: [
		{
			id: 'offset',
			x: 10,
			y: 20,
			width: 10,
			height: 50,
			minValue: 0,
			maxValue: I16_SIGNED_LARGEST_NUMBER,
			resolution: 100,
		},
	],
	config: {
		offset: 0,
	},
	switches: [],
	steppers: [],
	engine: 'offset',
};

export default offset;
