import { ModuleType } from '../state/types';

const number: ModuleType = {
	category: 'Inspection',
	connectors: [
		{ id: 'in', x: 5, y: 45, isInput: true },
		{ id: 'out', x: 85, y: 45 },
	],
	engine: 'through',
	height: 10,
	name: 'MIDI Note',
	sliders: [],
	steppers: [],
	switches: [],
	width: 20,
};

export default number;
