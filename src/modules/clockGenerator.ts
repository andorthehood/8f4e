import addDefaultOutputPositions from '../helpers/addDefaultOutputPositions';
import { ModuleType } from '../state/types';
import { MODULE_HEIGHT_S, MODULE_WIDTH_S } from './consts';

const clockGenerator: ModuleType = {
	category: 'Clock',
	config: {
		rate: 10,
	},
	engine: 'clockGenerator',
	height: MODULE_HEIGHT_S,
	inputs: [],
	name: 'Clock generator',
	outputs: addDefaultOutputPositions([{ id: 'out' }], MODULE_WIDTH_S),
	sliders: [{ id: 'rate', x: 10, y: 20, width: 10, height: 50, minValue: 0, maxValue: 3000, resolution: 10 }],
	steppers: [],
	switches: [],
	width: MODULE_WIDTH_S,
};

export default clockGenerator;
