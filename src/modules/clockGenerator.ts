import { ModuleType } from '../state/types';

const clockGenerator: ModuleType = {
	category: 'Clock',
	config: {
		rate: 10,
	},
	engine: 'clockGenerator',
	height: 10,
	inputs: [],
	name: 'Clock generator',
	outputs: [{ id: 'out', x: 85, y: 20 }],
	sliders: [{ id: 'rate', x: 10, y: 20, width: 10, height: 50, minValue: 0, maxValue: 3000, resolution: 10 }],
	steppers: [],
	switches: [],
	width: 20,
};

export default clockGenerator;
