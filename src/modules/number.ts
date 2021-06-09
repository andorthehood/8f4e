import addDefaultInputPositions from '../helpers/addDefaultInputPositions';
import addDefaultOutputPositions from '../helpers/addDefaultOutputPositions';
import { ModuleType } from '../state/types';

const number: ModuleType = {
	category: 'Inspection',
	engine: 'through',
	height: 10,
	inputs: addDefaultInputPositions([{ id: 'in:1' }]),
	name: 'Number',
	outputs: addDefaultOutputPositions([{ id: 'out:1' }], 20),
	sliders: [],
	steppers: [],
	switches: [],
	width: 20,
	config: {
		numberOfPorts: 1,
	},
};

export default number;
