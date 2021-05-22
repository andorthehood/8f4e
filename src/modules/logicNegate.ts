import { ModuleType } from '../state/types';

const logicNegate: ModuleType = {
	category: 'Logic',
	engine: 'logicNegate',
	height: 10,
	inputs: [{ id: 'in', x: 5, y: 20, isInput: true }],
	name: 'Logic Negate',
	outputs: [{ id: 'out', x: 85, y: 20, isInput: false }],
	sliders: [],
	steppers: [],
	switches: [],
	width: 20,
};

export default logicNegate;
