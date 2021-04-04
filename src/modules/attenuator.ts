import { ModuleType } from '../state/types';

const attenuator: ModuleType = {
	category: 'Other',
	config: {
		divisor: 1,
	},
	connectors: [
		{ id: 'out', x: 85, y: 20, isInput: false },
		{ id: 'in', x: 5, y: 20, isInput: true },
	],
	engine: 'attenuator',
	height: 100,
	name: 'Attenuator',
	sliders: [{ id: 'divisor', x: 10, y: 20, width: 10, height: 50, minValue: 1, maxValue: 100, resolution: 1 }],
	steppers: [],
	switches: [],
	width: 100,
};

export default attenuator;
