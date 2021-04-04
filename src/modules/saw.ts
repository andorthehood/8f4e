import { ModuleType } from '../state/types';

const saw: ModuleType = {
	config: {
		rate: 1000,
	},
	connectors: [{ id: 'out', x: 85, y: 20, isInput: false }],
	category: 'Oscillator',
	engine: 'saw',
	height: 100,
	name: 'Saw',
	sliders: [{ id: 'rate', x: 10, y: 20, width: 10, height: 50, minValue: 0, maxValue: 2000, resolution: 10 }],
	steppers: [],
	switches: [],
	width: 100,
};
export default saw;
