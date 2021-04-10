import { I16_SIGNED_LARGEST_NUMBER } from 'compiler';
import { ModuleType } from '../state/types';

const offset: ModuleType = {
	category: 'Other',
	config: {
		offset: 0,
	},
	connectors: [
		{ id: 'in', x: 5, y: 20, isInput: true },
		{ id: 'out', x: 85, y: 20, isInput: false },
	],
	engine: 'offset',
	height: 100,
	name: 'Offset',
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
	width: 100,
};

export default offset;
