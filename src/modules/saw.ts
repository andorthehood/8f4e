import { ModuleType } from '../state/types';

const saw: ModuleType = {
	width: 100,
	height: 100,
	connectors: [{ id: 'out', x: 85, y: 20, isInput: false }],
	name: 'Saw',
	switches: [],
	sliders: [{ id: 'rate', x: 10, y: 20, width: 10, height: 50, minValue: 0, maxValue: 2000, resolution: 10 }],
	config: {
		rate: 1000,
	},
	steppers: [],
	engine: 'saw',
};
export default saw;
