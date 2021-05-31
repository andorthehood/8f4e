import { ModuleType } from '../state/types';

const max: ModuleType = {
	category: 'Logic',
	engine: 'max',
	height: 10,
	inputs: [
		{ id: 'in:1', x: 5, y: 20 },
		{ id: 'in:2', x: 5, y: 35 },
	],
	name: 'Max',
	outputs: [{ id: 'out', x: 85, y: 20 }],
	sliders: [],
	steppers: [],
	switches: [],
	width: 20,
};

export default max;
