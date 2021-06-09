import addDefaultInputPositions from '../helpers/addDefaultInputPositions';
import addDefaultOutputPositions from '../helpers/addDefaultOutputPositions';
import { ModuleType } from '../state/types';

const logicOr: ModuleType = {
	category: 'Logic',
	engine: 'logicOr',
	height: 10,
	inputs: addDefaultInputPositions([
		{ id: 'in:1', x: 5, y: 20 },
		{ id: 'in:2', x: 5, y: 35 },
	]),
	name: 'Logic OR',
	outputs: addDefaultOutputPositions([{ id: 'out', x: 85, y: 20 }], 20),
	sliders: [],
	steppers: [],
	switches: [],
	width: 20,
};

export default logicOr;
