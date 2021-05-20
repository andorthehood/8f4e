import { ModuleType } from '../state/types';

const abs: ModuleType = {
	category: 'Math',
	connectors: [
		{ id: 'in', x: 5, y: 20, isInput: true },
		{ id: 'out', x: 85, y: 20 },
	],
	engine: 'abs',
	height: 10,
	name: 'Abs',
	sliders: [],
	steppers: [],
	switches: [],
	width: 20,
};

export default abs;
