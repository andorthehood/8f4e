import addDefaultOutputPositions from '../helpers/addDefaultOutputPositions';
import { ModuleType } from '../state/types';

const triangle: ModuleType = {
	category: 'Oscillator',
	engine: 'triangle',
	height: 10,
	inputs: [],
	name: 'Triangle',
	outputs: addDefaultOutputPositions([{ id: 'out' }], 20),
	sliders: [],
	steppers: [],
	switches: [],
	width: 20,
};

export default triangle;
