import addDefaultInputPositions from '../helpers/addDefaultInputPositions';
import addDefaultOutputPositions from '../helpers/addDefaultOutputPositions';
import { ModuleType } from '../state/types';

const attenuator: ModuleType = {
	category: 'Other',
	config: {
		divisor: 1,
	},
	engine: 'attenuator',
	height: 10,
	inputs: addDefaultInputPositions([{ id: 'in' }]),
	name: 'Attenuator',
	outputs: addDefaultOutputPositions([{ id: 'out' }], 20),
	sliders: [{ id: 'divisor', x: 10, y: 20, width: 10, height: 50, minValue: 1, maxValue: 100, resolution: 1 }],
	steppers: [],
	switches: [],
	width: 20,
};

export default attenuator;
