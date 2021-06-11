import addDefaultInputPositions from '../helpers/addDefaultInputPositions';
import addDefaultOutputPositions from '../helpers/addDefaultOutputPositions';
import { ModuleType } from '../state/types';
import { MODULE_HEIGHT_S, MODULE_WIDTH_S } from './consts';

const min: ModuleType = {
	category: 'Other',
	engine: 'sampleAndHold',
	height: MODULE_HEIGHT_S,
	inputs: addDefaultInputPositions([{ id: 'in' }, { id: 'in:trigger' }]),
	name: 'Sample & Hold',
	outputs: addDefaultOutputPositions([{ id: 'out' }], MODULE_WIDTH_S),
	sliders: [],
	steppers: [],
	switches: [],
	width: MODULE_WIDTH_S,
};

export default min;
