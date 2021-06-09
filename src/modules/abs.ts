import addDefaultInputPositions from '../helpers/addDefaultInputPositions';
import addDefaultOutputPositions from '../helpers/addDefaultOutputPositions';
import { ModuleType } from '../state/types';

const abs: ModuleType = {
	category: 'Math',
	engine: 'abs',
	height: 10,
	inputs: addDefaultInputPositions([{ id: 'in' }]),
	name: 'Abs',
	outputs: addDefaultOutputPositions([{ id: 'out' }], 20),
	sliders: [],
	steppers: [],
	switches: [],
	width: 20,
};

export default abs;
