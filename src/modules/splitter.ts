import addDefaultInputPositions from '../helpers/addDefaultInputPositions';
import addDefaultOutputPositions from '../helpers/addDefaultOutputPositions';
import { ModuleType } from '../state/types';
import { MODULE_HEIGHT_S, MODULE_WIDTH_S } from './consts';

const splitter: ModuleType = {
	category: 'Other',
	engine: 'splitter',
	height: MODULE_HEIGHT_S,
	inputs: addDefaultInputPositions([{ id: 'in' }]),
	name: 'Splitter',
	outputs: addDefaultOutputPositions(
		[{ id: 'out:1' }, { id: 'out:2' }, { id: 'out:3' }, { id: 'out:4' }],
		MODULE_WIDTH_S
	),
	sliders: [],
	steppers: [],
	switches: [],
	width: MODULE_WIDTH_S,
};

export default splitter;
