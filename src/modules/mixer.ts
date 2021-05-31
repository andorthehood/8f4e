import { ModuleType } from '../state/types';

const mixer: ModuleType = {
	category: 'Other',
	engine: 'mixer',
	height: 10,
	inputs: [
		{ id: 'in:1', x: 5, y: 20 },
		{ id: 'in:2', x: 5, y: 35 },
		{ id: 'in:3', x: 5, y: 50 },
		{ id: 'in:4', x: 5, y: 65 },
	],
	name: 'Mixer',
	outputs: [{ id: 'out', x: 85, y: 20 }],
	sliders: [],
	steppers: [],
	switches: [],
	width: 20,
};

export default mixer;
