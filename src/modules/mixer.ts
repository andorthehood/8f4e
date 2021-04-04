import { ModuleType } from '../state/types';

const mixer: ModuleType = {
	width: 100,
	height: 100,
	connectors: [
		{ id: 'in:1', x: 5, y: 20, isInput: true },
		{ id: 'in:2', x: 5, y: 35, isInput: true },
		{ id: 'in:3', x: 5, y: 50, isInput: true },
		{ id: 'in:4', x: 5, y: 65, isInput: true },
		{ id: 'out', x: 85, y: 20 },
	],
	name: 'Mixer',
	switches: [],
	sliders: [],
	steppers: [],
	engine: 'mixer',
	category: 'Other',
};

export default mixer;
