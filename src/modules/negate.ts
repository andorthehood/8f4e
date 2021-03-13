import { ModuleType } from '../state/types';

const negate: ModuleType = {
	width: 100,
	height: 100,
	connectors: [
		{ id: 'in', x: 5, y: 20, isInput: true },
		{ id: 'out', x: 85, y: 20, isInput: false },
	],
	name: 'Negate',
	sliders: [],
	switches: [],
	steppers: [],
	engine: 'negate',
};

export default negate;
