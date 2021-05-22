import { ModuleType } from '../state/types';

const invert: ModuleType = {
	category: 'Math',

	engine: 'invert',
	height: 10,
	inputs: [{ id: 'in', x: 5, y: 20, isInput: true }],
	name: 'Invert',
	outputs: [{ id: 'out', x: 85, y: 20 }],
	sliders: [],
	steppers: [],
	switches: [],
	width: 20,
};

export default invert;
