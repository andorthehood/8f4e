import addDefaultOutputPositions from './helpers/addDefaultOutputPositions';
import { ModuleGeneratorProps, ModuleType } from '../state/types';
import { MODULE_HEIGHT_S, MODULE_WIDTH_S } from './consts';

export default function randomGenerator({ vGrid, hGrid }: ModuleGeneratorProps): ModuleType {
	return {
		category: 'Random',
		engine: 'random',
		height: MODULE_HEIGHT_S * hGrid,
		inputs: [],
		name: 'Random',
		outputs: addDefaultOutputPositions([{ id: 'out' }], vGrid, hGrid, MODULE_WIDTH_S * vGrid),
		sliders: [],
		steppers: [],
		switches: [],
		width: MODULE_WIDTH_S * vGrid,
	};
}
