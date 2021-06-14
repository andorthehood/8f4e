import addDefaultInputPositions from '../helpers/addDefaultInputPositions';
import addDefaultOutputPositions from '../helpers/addDefaultOutputPositions';
import { ModuleGeneratorProps, ModuleType } from '../state/types';
import { MODULE_HEIGHT_S, MODULE_WIDTH_S } from './consts';

export default function number({ vGrid, hGrid }: ModuleGeneratorProps): ModuleType {
	return {
		category: 'Inspection',
		config: {
			numberOfPorts: 1,
		},
		engine: 'through',
		height: MODULE_HEIGHT_S * hGrid,
		inputs: addDefaultInputPositions([{ id: 'in:1' }], vGrid, hGrid),
		name: 'Number',
		outputs: addDefaultOutputPositions([{ id: 'out:1' }], vGrid, hGrid, MODULE_WIDTH_S * vGrid),
		sliders: [],
		steppers: [],
		switches: [],
		width: MODULE_WIDTH_S * vGrid,
	};
}
