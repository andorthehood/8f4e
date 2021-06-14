import addDefaultInputPositions from '../helpers/addDefaultInputPositions';
import addDefaultOutputPositions from '../helpers/addDefaultOutputPositions';
import { ModuleGeneratorProps, ModuleType } from '../state/types';
import { MODULE_HEIGHT_S, MODULE_WIDTH_S } from './consts';

export default function mixer({ vGrid, hGrid }: ModuleGeneratorProps): ModuleType {
	return {
		category: 'Other',
		engine: 'mixer',
		height: MODULE_HEIGHT_S * hGrid,
		inputs: addDefaultInputPositions([{ id: 'in:1' }, { id: 'in:2' }, { id: 'in:3' }, { id: 'in:4' }], vGrid, hGrid),
		name: 'Mixer',
		outputs: addDefaultOutputPositions([{ id: 'out' }], vGrid, hGrid, MODULE_WIDTH_S * vGrid),
		sliders: [],
		steppers: [],
		switches: [],
		width: MODULE_WIDTH_S * vGrid,
	};
}
