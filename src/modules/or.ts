import { ModuleType } from '../state/types';

const or: ModuleType = {
	width: 100,
	height: 100,
	connectors: [
		{ id: 'in:1', x: 5, y: 20, isInput: true },
		{ id: 'in:2', x: 5, y: 35, isInput: true },
		{ id: 'out', x: 85, y: 20, isInput: false },
	],
	name: 'Or',
	sliders: [],
	switches: [],
	steppers: [],
	engine: 'logicOr',
};

export default or;
