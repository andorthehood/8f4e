import { ModuleType } from '../state/types';

const triangle: ModuleType = {
	category: 'Oscillator',
	connectors: [{ id: 'out', x: 85, y: 20, isInput: false }],
	engine: 'triangle',
	height: 100,
	name: 'Triangle',
	sliders: [],
	steppers: [],
	switches: [],
	width: 100,
};

export default triangle;
