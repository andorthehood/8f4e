import { ModuleType } from '../state/types';

const logicAnd: ModuleType = {
	category: 'Logic',
	connectors: [
		{ id: 'in:1', x: 5, y: 20, isInput: true },
		{ id: 'in:2', x: 5, y: 35, isInput: true },
		{ id: 'out', x: 85, y: 20, isInput: false },
	],
	engine: 'logicAnd',
	height: 100,
	name: 'Logic AND',
	sliders: [],
	steppers: [],
	switches: [],
	width: 100,
};

export default logicAnd;
