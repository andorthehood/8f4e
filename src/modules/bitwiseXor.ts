import addDefaultInputPositions from '../helpers/addDefaultInputPositions';
import addDefaultOutputPositions from '../helpers/addDefaultOutputPositions';
import { ModuleType } from '../state/types';

const bitwiseXor: ModuleType = {
	category: 'Bitwise',
	engine: 'bitwiseXor',
	height: 10,
	inputs: addDefaultInputPositions([{ id: 'in:1' }, { id: 'in:2' }]),
	name: 'Bitwise XOR',
	outputs: addDefaultOutputPositions([{ id: 'out' }], 20),
	sliders: [],
	steppers: [],
	switches: [],
	width: 20,
};

export default bitwiseXor;
