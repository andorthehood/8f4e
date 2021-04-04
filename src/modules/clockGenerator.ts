import { ModuleType } from '../state/types';

const clockGenerator: ModuleType = {
	category: 'Clock',
	connectors: [{ id: 'out', x: 85, y: 20 }],
	config: {
		rate: 10,
	},
	engine: 'clockGenerator',
	height: 100,
	name: 'Clock generator',
	sliders: [{ id: 'rate', x: 10, y: 20, width: 10, height: 50, minValue: 0, maxValue: 3000, resolution: 10 }],
	steppers: [],
	switches: [],
	width: 100,
};

export default clockGenerator;
