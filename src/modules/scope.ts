import addDefaultInputPositions from './helpers/addDefaultInputPositions';
import addDefaultOutputPositions from './helpers/addDefaultOutputPositions';
import { ModuleGeneratorProps, ModuleType } from '../state/types';
import { MODULE_HEIGHT_S, MODULE_WIDTH_S } from './consts';

export default function scope({ vGrid, hGrid }: ModuleGeneratorProps): ModuleType {
	return {
		category: 'Inspection',
		engine: 'scope',
		height: MODULE_HEIGHT_S * hGrid,
		inputs: addDefaultInputPositions([{ id: 'in' }], vGrid, hGrid),
		name: 'Scope',
		outputs: addDefaultOutputPositions([{ id: 'out' }], vGrid, hGrid, MODULE_WIDTH_S * vGrid),
		sliders: [],
		steppers: [],
		switches: [],
		width: MODULE_WIDTH_S * vGrid,
	};
}
