import { ModuleType } from '../state/types';

const min: ModuleType = {
	category: 'Other',
	engine: 'sampleAndHold',
	height: 10,
	inputs: [
		{ id: 'in', x: 5, y: 20, isInput: true },
		{ id: 'in:trigger', x: 5, y: 35, isInput: true },
	],
	name: 'Sample & Hold',
	outputs: [{ id: 'out', x: 85, y: 20, isInput: false }],
	sliders: [],
	steppers: [],
	switches: [],
	width: 20,
};

export default min;
