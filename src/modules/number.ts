import addDefaultInputPositions from '../helpers/addDefaultInputPositions';
import addDefaultOutputPositions from '../helpers/addDefaultOutputPositions';
import { ModuleType } from '../state/types';
import { MODULE_HEIGHT_S, MODULE_WIDTH_S } from './consts';

const number: ModuleType = {
	category: 'Inspection',
	config: {
		numberOfPorts: 1,
	},
	engine: 'through',
	height: MODULE_HEIGHT_S,
	inputs: addDefaultInputPositions([{ id: 'in:1' }]),
	name: 'Number',
	outputs: addDefaultOutputPositions([{ id: 'out:1' }], MODULE_WIDTH_S),
	sliders: [],
	steppers: [],
	switches: [],
	width: MODULE_WIDTH_S,
};

export default number;
