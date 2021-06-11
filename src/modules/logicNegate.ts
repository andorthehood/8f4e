import addDefaultInputPositions from '../helpers/addDefaultInputPositions';
import addDefaultOutputPositions from '../helpers/addDefaultOutputPositions';
import { ModuleType } from '../state/types';
import { MODULE_HEIGHT_S, MODULE_WIDTH_S } from './consts';

const logicNegate: ModuleType = {
	category: 'Logic',
	engine: 'logicNegate',
	height: MODULE_HEIGHT_S,
	inputs: addDefaultInputPositions([{ id: 'in' }]),
	name: 'Logic Negate',
	outputs: addDefaultOutputPositions([{ id: 'out' }], MODULE_WIDTH_S),
	sliders: [],
	steppers: [],
	switches: [],
	width: MODULE_WIDTH_S,
};

export default logicNegate;
