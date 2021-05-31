import { ModuleType } from '../state/types';

const saw: ModuleType = {
	config: {
		rate: 1000,
	},
	category: 'Oscillator',
	engine: 'saw',
	height: 10,
	inputs: [],
	name: 'Saw',
	outputs: [{ id: 'out', x: 85, y: 20 }],
	sliders: [{ id: 'rate', x: 10, y: 20, width: 10, height: 50, minValue: 0, maxValue: 2000, resolution: 10 }],
	steppers: [],
	switches: [],
	width: 20,
};
export default saw;
