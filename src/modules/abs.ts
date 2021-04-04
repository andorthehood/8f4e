import { ModuleType } from '../state/types';

const abs: ModuleType = {
	width: 100,
	height: 100,
	connectors: [
		{ id: 'in', x: 5, y: 20, isInput: true },
		{ id: 'out', x: 85, y: 20 },
	],
	name: 'Abs',
	switches: [],
	sliders: [],
	steppers: [],
	engine: 'abs',
	category: 'Math',
};

export default abs;
