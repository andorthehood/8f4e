import addDefaultOutputPositions from '../helpers/addDefaultOutputPositions';
import { ModuleType } from '../state/types';
import { MODULE_HEIGHT_S, MODULE_WIDTH_S } from './consts';

const triangle: ModuleType = {
	category: 'Oscillator',
	engine: 'triangle',
	height: MODULE_HEIGHT_S,
	inputs: [],
	name: 'Triangle',
	outputs: addDefaultOutputPositions([{ id: 'out' }], MODULE_WIDTH_S),
	sliders: [],
	steppers: [],
	switches: [],
	width: MODULE_WIDTH_S,
};

export default triangle;
