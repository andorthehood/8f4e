import { ModuleType } from '../state/types';

const splitter: ModuleType = {
	width: 100,
	height: 100,
	connectors: [
		{ id: 'in', x: 5, y: 20, isInput: true },
		{ id: 'out:1', x: 85, y: 20 },
		{ id: 'out:2', x: 85, y: 35 },
		{ id: 'out:3', x: 85, y: 50 },
		{ id: 'out:4', x: 85, y: 65 },
	],
	name: 'Splitter',
	switches: [],
	sliders: [],
	steppers: [],
	engine: 'splitter',
};

export default splitter;
