import addDefaultInputPositions from '../helpers/addDefaultInputPositions';
import addDefaultOutputPositions from '../helpers/addDefaultOutputPositions';
import { ModuleType } from '../state/types';

const invert: ModuleType = {
	category: 'Math',

	engine: 'invert',
	height: 10,
	inputs: addDefaultInputPositions([{ id: 'in', x: 5, y: 20 }]),
	name: 'Invert',
	outputs: addDefaultOutputPositions([{ id: 'out', x: 85, y: 20 }], 20),
	sliders: [],
	steppers: [],
	switches: [],
	width: 20,
};

export default invert;
