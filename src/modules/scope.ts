import addDefaultInputPositions from '../helpers/addDefaultInputPositions';
import addDefaultOutputPositions from '../helpers/addDefaultOutputPositions';
import { ModuleType } from '../state/types';

const scope: ModuleType = {
	category: 'Inspection',
	engine: 'scope',
	height: 10,
	inputs: addDefaultInputPositions([{ id: 'in' }]),
	name: 'Scope',
	outputs: addDefaultOutputPositions([{ id: 'out' }], 20),
	sliders: [],
	steppers: [],
	switches: [],
	width: 20,
};

export default scope;
