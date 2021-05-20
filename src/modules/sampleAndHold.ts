import { ModuleType } from '../state/types';

const min: ModuleType = {
	category: 'Other',
	connectors: [
		{ id: 'in', x: 5, y: 20, isInput: true },
		{ id: 'in:trigger', x: 5, y: 35, isInput: true },
		{ id: 'out', x: 85, y: 20, isInput: false },
	],
	engine: 'sampleAndHold',
	height: 10,
	name: 'Sample & Hold',
	sliders: [],
	steppers: [],
	switches: [],
	width: 20,
};

export default min;
