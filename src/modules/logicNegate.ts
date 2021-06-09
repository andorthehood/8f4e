import addDefaultInputPositions from '../helpers/addDefaultInputPositions';
import addDefaultOutputPositions from '../helpers/addDefaultOutputPositions';
import { ModuleType } from '../state/types';

const logicNegate: ModuleType = {
	category: 'Logic',
	engine: 'logicNegate',
	height: 10,
	inputs: addDefaultInputPositions([{ id: 'in' }]),
	name: 'Logic Negate',
	outputs: addDefaultOutputPositions([{ id: 'out' }], 20),
	sliders: [],
	steppers: [],
	switches: [],
	width: 20,
};

export default logicNegate;
