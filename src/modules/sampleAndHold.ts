import addDefaultInputPositions from '../helpers/addDefaultInputPositions';
import addDefaultOutputPositions from '../helpers/addDefaultOutputPositions';
import { ModuleType } from '../state/types';

const min: ModuleType = {
	category: 'Other',
	engine: 'sampleAndHold',
	height: 10,
	inputs: addDefaultInputPositions([{ id: 'in' }, { id: 'in:trigger' }]),
	name: 'Sample & Hold',
	outputs: addDefaultOutputPositions([{ id: 'out' }], 20),
	sliders: [],
	steppers: [],
	switches: [],
	width: 20,
};

export default min;
