import { ModuleType } from '../state/types';

const logicOr: ModuleType = {
	category: 'Logic',
	engine: 'logicOr',
	height: 10,
	inputs: [
		{ id: 'in:1', x: 5, y: 20 },
		{ id: 'in:2', x: 5, y: 35 },
	],
	name: 'Logic OR',
	outputs: [{ id: 'out', x: 85, y: 20 }],
	sliders: [],
	steppers: [],
	switches: [],
	width: 20,
};

export default logicOr;
