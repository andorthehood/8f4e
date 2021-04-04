import { ModuleType } from '../state/types';

const randomGenerator: ModuleType = {
	category: 'Random',
	connectors: [{ id: 'out', x: 85, y: 20, isInput: false }],
	engine: 'random',
	height: 100,
	name: 'Random',
	sliders: [],
	steppers: [],
	switches: [],
	width: 100,
};

export default randomGenerator;
