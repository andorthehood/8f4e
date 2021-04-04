import { ModuleType } from '../state/types';

const mixer: ModuleType = {
	category: 'Other',
	connectors: [
		{ id: 'in:1', x: 5, y: 20, isInput: true },
		{ id: 'in:2', x: 5, y: 35, isInput: true },
		{ id: 'in:3', x: 5, y: 50, isInput: true },
		{ id: 'in:4', x: 5, y: 65, isInput: true },
		{ id: 'out', x: 85, y: 20 },
	],
	engine: 'mixer',
	height: 100,
	name: 'Mixer',
	sliders: [],
	steppers: [],
	switches: [],
	width: 100,
};

export default mixer;
