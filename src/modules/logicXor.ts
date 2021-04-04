import { ModuleType } from '../state/types';

const logicXor: ModuleType = {
	category: 'Logic',
	connectors: [
		{ id: 'in:1', x: 5, y: 20, isInput: true },
		{ id: 'in:2', x: 5, y: 35, isInput: true },
		{ id: 'out', x: 85, y: 20, isInput: false },
	],
	engine: 'logicXor',
	height: 100,
	name: 'Logic XOR',
	sliders: [],
	steppers: [],
	switches: [],
	width: 100,
};

export default logicXor;
