import addDefaultInputPositions from '../helpers/addDefaultInputPositions';
import addDefaultOutputPositions from '../helpers/addDefaultOutputPositions';
import { ModuleType } from '../state/types';

const invert: ModuleType = {
	category: 'Math',

	engine: 'invert',
	height: 10,
	inputs: addDefaultInputPositions([{ id: 'in' }]),
	name: 'Invert',
	outputs: addDefaultOutputPositions([{ id: 'out' }], 20),
	sliders: [],
	steppers: [],
	switches: [],
	width: 20,
};

export default invert;
