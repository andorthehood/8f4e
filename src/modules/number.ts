import { ModuleType } from '../state/types';

const number: ModuleType = {
	width: 100,
	height: 100,
	connectors: [
		{ id: 'in', x: 5, y: 45, isInput: true },
		{ id: 'out', x: 85, y: 45 },
	],
	name: 'Number',
	switches: [],
	sliders: [],
	steppers: [],
	engine: 'through',
	category: 'Inspection',
};

export default number;
