import { ModuleType } from '../state/types';

const attenuator: ModuleType = {
	width: 100,
	height: 100,
	connectors: [
		{ id: 'out', x: 85, y: 20, isInput: false },
		{ id: 'in', x: 5, y: 20, isInput: true },
	],
	name: 'Attenuator',
	switches: [],
	sliders: [{ id: 'divisor', x: 10, y: 20, width: 10, height: 50, minValue: 1, maxValue: 100, resolution: 1 }],
	config: {
		divisor: 1,
	},
	steppers: [],
	engine: 'attenuator',
};

export default attenuator;
