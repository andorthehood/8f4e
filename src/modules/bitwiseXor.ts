import addDefaultInputPositions from './helpers/addDefaultInputPositions';
import addDefaultOutputPositions from './helpers/addDefaultOutputPositions';
import { ModuleGeneratorProps, ModuleType } from '../state/types';
import { MODULE_HEIGHT_S, MODULE_WIDTH_S } from './consts';

export default function bitwiseXor({ vGrid, hGrid }: ModuleGeneratorProps): ModuleType {
	return {
		category: 'Bitwise',
		engine: 'bitwiseXor',
		height: MODULE_HEIGHT_S * hGrid,
		inputs: addDefaultInputPositions(
			[
				{ id: 'in:1', label: 'in' },
				{ id: 'in:2', label: 'in' },
			],
			vGrid,
			hGrid
		),
		name: 'Bitwise XOR',
		outputs: addDefaultOutputPositions([{ id: 'out' }], vGrid, hGrid, MODULE_WIDTH_S * vGrid),
		sliders: [],
		steppers: [],
		switches: [],
		width: MODULE_WIDTH_S * vGrid,
	};
}
