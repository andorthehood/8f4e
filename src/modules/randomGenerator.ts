import { ModuleType } from '../state/types';

const randomGenerator: ModuleType = {
	width: 100,
	height: 100,
	connectors: [{ id: 'out', x: 85, y: 20, isInput: false }],
	name: 'Random',
	switches: [],
	sliders: [],
	steppers: [],
	engine: 'random',
	category: 'Random',
};

export default randomGenerator;
