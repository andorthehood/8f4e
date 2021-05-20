import { ModuleType } from '../state/types';

const splitter: ModuleType = {
	category: 'Other',
	connectors: [
		{ id: 'in', x: 5, y: 20, isInput: true },
		{ id: 'out:1', x: 85, y: 20 },
		{ id: 'out:2', x: 85, y: 35 },
		{ id: 'out:3', x: 85, y: 50 },
		{ id: 'out:4', x: 85, y: 65 },
	],
	engine: 'splitter',
	height: 10,
	name: 'Splitter',
	sliders: [],
	steppers: [],
	switches: [],
	width: 20,
};

export default splitter;
