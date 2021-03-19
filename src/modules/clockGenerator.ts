import { ModuleType } from '../state/types';

const clockGenerator: ModuleType = {
	width: 100,
	height: 100,
	connectors: [{ id: 'out', x: 85, y: 20 }],
	name: 'Clock generator',
	switches: [],
	sliders: [{ id: 'rate', x: 10, y: 20, width: 10, height: 50, minValue: 0, maxValue: 3000, resolution: 10 }],
	config: {
		rate: 10,
	},
	steppers: [],
	engine: 'clockGenerator',
};

export default clockGenerator;
