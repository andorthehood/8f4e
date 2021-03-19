import { ModuleType } from '../state/types';

const logicNegate: ModuleType = {
	width: 100,
	height: 100,
	connectors: [
		{ id: 'in', x: 5, y: 20, isInput: true },
		{ id: 'out', x: 85, y: 20, isInput: false },
	],
	name: 'Logic Negate',
	sliders: [],
	switches: [],
	steppers: [],
	engine: 'logicNegate',
};

export default logicNegate;
