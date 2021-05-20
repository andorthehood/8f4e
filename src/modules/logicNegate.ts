import { ModuleType } from '../state/types';

const logicNegate: ModuleType = {
	category: 'Logic',
	connectors: [
		{ id: 'in', x: 5, y: 20, isInput: true },
		{ id: 'out', x: 85, y: 20, isInput: false },
	],
	engine: 'logicNegate',
	height: 10,
	name: 'Logic Negate',
	sliders: [],
	steppers: [],
	switches: [],
	width: 20,
};

export default logicNegate;
