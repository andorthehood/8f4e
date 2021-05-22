import { ModuleType } from '../state/types';

const abs: ModuleType = {
	category: 'Math',
	engine: 'abs',
	height: 10,
	inputs: [{ id: 'in', x: 0, y: 1 }],
	name: 'Abs',
	outputs: [{ id: 'out', x: 10, y: 1 }],
	sliders: [],
	steppers: [],
	switches: [],
	width: 20,
};

export default abs;
