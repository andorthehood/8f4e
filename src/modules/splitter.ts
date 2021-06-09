import addDefaultInputPositions from '../helpers/addDefaultInputPositions';
import addDefaultOutputPositions from '../helpers/addDefaultOutputPositions';
import { ModuleType } from '../state/types';

const splitter: ModuleType = {
	category: 'Other',
	engine: 'splitter',
	height: 10,
	inputs: addDefaultInputPositions([{ id: 'in' }]),
	name: 'Splitter',
	outputs: addDefaultOutputPositions([{ id: 'out:1' }, { id: 'out:2' }, { id: 'out:3' }, { id: 'out:4' }], 20),
	sliders: [],
	steppers: [],
	switches: [],
	width: 20,
};

export default splitter;
