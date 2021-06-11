import addDefaultOutputPositions from '../helpers/addDefaultOutputPositions';
import { ModuleType } from '../state/types';
import { MODULE_HEIGHT_S, MODULE_WIDTH_S } from './consts';

const randomGenerator: ModuleType = {
	category: 'Random',
	engine: 'random',
	height: MODULE_HEIGHT_S,
	inputs: [],
	name: 'Random',
	outputs: addDefaultOutputPositions([{ id: 'out' }], MODULE_WIDTH_S),
	sliders: [],
	steppers: [],
	switches: [],
	width: MODULE_WIDTH_S,
};

export default randomGenerator;
