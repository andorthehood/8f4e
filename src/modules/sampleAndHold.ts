import { ModuleType } from '../state/types';

const min: ModuleType = {
	category: 'Other',
	engine: 'sampleAndHold',
	height: 10,
	inputs: [
		{ id: 'in', x: 5, y: 20 },
		{ id: 'in:trigger', x: 5, y: 35 },
	],
	name: 'Sample & Hold',
	outputs: [{ id: 'out', x: 85, y: 20 }],
	sliders: [],
	steppers: [],
	switches: [],
	width: 20,
};

export default min;
