import { ModuleType } from '../state/types';

const invert: ModuleType = {
	category: 'Math',
	connectors: [
		{ id: 'in', x: 5, y: 20, isInput: true },
		{ id: 'out', x: 85, y: 20 },
	],
	engine: 'invert',
	height: 100,
	name: 'Invert',
	sliders: [],
	steppers: [],
	switches: [],
	width: 100,
};

export default invert;
