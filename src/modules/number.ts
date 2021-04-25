import { ModuleType } from '../state/types';

const number: ModuleType = {
	category: 'Inspection',
	connectors: [
		{ id: 'in:1', x: 5, y: 45, isInput: true },
		{ id: 'out:1', x: 85, y: 45 },
	],
	engine: 'through',
	height: 100,
	name: 'Number',
	sliders: [],
	steppers: [],
	switches: [],
	width: 100,
	config: {
		numberOfPorts: 1,
	},
};

export default number;
