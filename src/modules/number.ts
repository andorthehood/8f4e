import { ModuleType } from '../state/types';

const number: ModuleType = {
	category: 'Inspection',
	engine: 'through',
	height: 10,
	inputs: [{ id: 'in:1', x: 5, y: 45, isInput: true }],
	name: 'Number',
	outputs: [{ id: 'out:1', x: 85, y: 45 }],
	sliders: [],
	steppers: [],
	switches: [],
	width: 20,
	config: {
		numberOfPorts: 1,
	},
};

export default number;
