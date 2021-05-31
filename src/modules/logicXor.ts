import { ModuleType } from '../state/types';

const logicXor: ModuleType = {
	category: 'Logic',
	engine: 'logicXor',
	height: 10,
	inputs: [
		{ id: 'in:1', x: 5, y: 20 },
		{ id: 'in:2', x: 5, y: 35 },
	],
	name: 'Logic XOR',
	outputs: [{ id: 'out', x: 85, y: 20 }],
	sliders: [],
	steppers: [],
	switches: [],
	width: 20,
};

export default logicXor;
