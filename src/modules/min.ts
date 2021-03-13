import { ModuleType } from '../state/types';

const min: ModuleType = {
	width: 100,
	height: 100,
	connectors: [
		{ id: 'in1', x: 5, y: 20, isInput: true },
		{ id: 'in2', x: 5, y: 35, isInput: true },
		{ id: 'out', x: 85, y: 20, isInput: false },
	],
	name: 'Min',
	sliders: [],
	switches: [],
	steppers: [],
	engine: 'min',
};

export default min;
