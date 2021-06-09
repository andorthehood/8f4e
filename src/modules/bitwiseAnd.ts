import addDefaultInputPositions from '../helpers/addDefaultInputPositions';
import addDefaultOutputPositions from '../helpers/addDefaultOutputPositions';
import { ModuleType } from '../state/types';

const bitwiseAnd: ModuleType = {
	category: 'Bitwise',
	engine: 'bitwiseAnd',
	height: 10,
	inputs: addDefaultInputPositions([
		{ id: 'in:1', x: 5, y: 20 },
		{ id: 'in:2', x: 5, y: 35 },
	]),
	name: 'Bitwise AND',
	outputs: addDefaultOutputPositions([{ id: 'out' }], 20),
	sliders: [],
	steppers: [],
	switches: [],
	width: 20,
};

export default bitwiseAnd;
