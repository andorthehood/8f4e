import { ModuleType } from '../state/types';

const randomGenerator: ModuleType = {
	category: 'Random',
	engine: 'random',
	height: 10,
	inputs: [],
	name: 'Random',
	outputs: [{ id: 'out', x: 85, y: 20, isInput: false }],
	sliders: [],
	steppers: [],
	switches: [],
	width: 20,
};

export default randomGenerator;
