import { ModuleType } from '../state/types';

const invert: ModuleType = {
	width: 100,
	height: 100,
	connectors: [
		{ id: 'in', x: 5, y: 20, isInput: true },
		{ id: 'out', x: 85, y: 20 },
	],
	name: 'Invert',
	switches: [],
	sliders: [],
	steppers: [],
	engine: 'invert',
};

export default invert;
