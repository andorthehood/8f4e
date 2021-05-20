import { ModuleType } from '../state/types';

const invert: ModuleType = {
	category: 'Math',
	connectors: [
		{ id: 'in', x: 5, y: 20, isInput: true },
		{ id: 'out', x: 85, y: 20 },
	],
	engine: 'invert',
	height: 10,
	name: 'Invert',
	sliders: [],
	steppers: [],
	switches: [],
	width: 20,
};

export default invert;
