import { ModuleType } from '../state/types';

const splitter: ModuleType = {
	category: 'Other',
	engine: 'splitter',
	height: 10,
	inputs: [{ id: 'in', x: 5, y: 20, isInput: true }],
	name: 'Splitter',
	outputs: [
		{ id: 'out:1', x: 85, y: 20 },
		{ id: 'out:2', x: 85, y: 35 },
		{ id: 'out:3', x: 85, y: 50 },
		{ id: 'out:4', x: 85, y: 65 },
	],
	sliders: [],
	steppers: [],
	switches: [],
	width: 20,
};

export default splitter;
