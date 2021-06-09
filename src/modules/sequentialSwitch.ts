import addDefaultInputPositions from '../helpers/addDefaultInputPositions';
import addDefaultOutputPositions from '../helpers/addDefaultOutputPositions';
import { ModuleType } from '../state/types';

const sequentialSwitch: ModuleType = {
	category: 'Logic',
	engine: 'sequentialSwitch',
	height: 10,
	inputs: addDefaultInputPositions([
		{ id: 'in:1' },
		{ id: 'in:2' },
		{ id: 'in:3' },
		{ id: 'in:4' },
		{ id: 'in:clock' },
	]),
	name: 'Sequential switch',
	outputs: addDefaultOutputPositions([{ id: 'out' }], 20),
	sliders: [],
	steppers: [],
	switches: [],
	width: 20,
};

export default sequentialSwitch;
