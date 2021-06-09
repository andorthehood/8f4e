import addDefaultOutputPositions from '../helpers/addDefaultOutputPositions';
import { ModuleType } from '../state/types';

const randomGenerator: ModuleType = {
	category: 'Random',
	engine: 'random',
	height: 10,
	inputs: [],
	name: 'Random',
	outputs: addDefaultOutputPositions([{ id: 'out' }], 20),
	sliders: [],
	steppers: [],
	switches: [],
	width: 20,
};

export default randomGenerator;
