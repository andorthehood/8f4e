import addDefaultInputPositions from '../helpers/addDefaultInputPositions';
import addDefaultOutputPositions from '../helpers/addDefaultOutputPositions';
import { ModuleType } from '../state/types';
import { MODULE_HEIGHT_S, MODULE_WIDTH_S } from './consts';

const min: ModuleType = {
	category: 'Logic',
	engine: 'min',
	height: MODULE_HEIGHT_S,
	inputs: addDefaultInputPositions([{ id: 'in:1' }, { id: 'in:2' }]),
	name: 'Min',
	outputs: addDefaultOutputPositions([{ id: 'out' }], MODULE_WIDTH_S),
	sliders: [],
	steppers: [],
	switches: [],
	width: MODULE_WIDTH_S,
};

export default min;
