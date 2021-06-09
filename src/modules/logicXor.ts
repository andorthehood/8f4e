import addDefaultInputPositions from '../helpers/addDefaultInputPositions';
import addDefaultOutputPositions from '../helpers/addDefaultOutputPositions';
import { ModuleType } from '../state/types';

const logicXor: ModuleType = {
	category: 'Logic',
	engine: 'logicXor',
	height: 10,
	inputs: addDefaultInputPositions([{ id: 'in:1' }, { id: 'in:2' }]),
	name: 'Logic XOR',
	outputs: addDefaultOutputPositions([{ id: 'out' }], 20),
	sliders: [],
	steppers: [],
	switches: [],
	width: 20,
};

export default logicXor;
