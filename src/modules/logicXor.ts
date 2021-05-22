import { ModuleType } from '../state/types';

const logicXor: ModuleType = {
	category: 'Logic',
	engine: 'logicXor',
	height: 10,
	inputs: [
		{ id: 'in:1', x: 5, y: 20, isInput: true },
		{ id: 'in:2', x: 5, y: 35, isInput: true },
	],
	name: 'Logic XOR',
	outputs: [{ id: 'out', x: 85, y: 20, isInput: false }],
	sliders: [],
	steppers: [],
	switches: [],
	width: 20,
};

export default logicXor;
