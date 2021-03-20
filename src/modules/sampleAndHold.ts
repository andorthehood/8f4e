import { ModuleType } from '../state/types';

const min: ModuleType = {
	width: 100,
	height: 100,
	connectors: [
		{ id: 'in', x: 5, y: 20, isInput: true },
		{ id: 'in:trigger', x: 5, y: 35, isInput: true },
		{ id: 'out', x: 85, y: 20, isInput: false },
	],
	name: 'Sample & Hold',
	sliders: [],
	switches: [],
	steppers: [],
	engine: 'sampleAndHold',
};

export default min;
