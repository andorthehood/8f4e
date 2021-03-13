import { ModuleType } from '../state/types';

const triangle: ModuleType = {
	width: 100,
	height: 100,
	connectors: [{ id: 'out', x: 85, y: 20, isInput: false }],
	name: 'Triangle',
	switches: [],
	sliders: [],
	steppers: [],
	engine: 'triangle',
};

export default triangle;
