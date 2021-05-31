import { ModuleType } from '../state/types';

const number: ModuleType = {
	category: 'Inspection',
	engine: 'through',
	height: 10,
	inputs: [{ id: 'in', x: 5, y: 45 }],
	name: 'MIDI Note',
	outputs: [{ id: 'out', x: 85, y: 45 }],
	sliders: [],
	steppers: [],
	switches: [],
	width: 20,
};

export default number;
