import addDefaultInputPositions from './helpers/addDefaultInputPositions';
import addDefaultOutputPositions from './helpers/addDefaultOutputPositions';
import { ModuleGeneratorProps, ModuleType } from '../state/types';
import { MODULE_HEIGHT_S, MODULE_WIDTH_S } from './consts';
import generateBorderLines from './helpers/generateBorderLines';

export default function bitwiseAnd({ vGrid, hGrid }: ModuleGeneratorProps): ModuleType {
	const width = MODULE_WIDTH_S * vGrid;
	const height = MODULE_HEIGHT_S * hGrid;

	return {
		category: 'Bitwise',
		engine: 'bitwiseAnd',
		height: MODULE_HEIGHT_S * hGrid,
		inputs: addDefaultInputPositions(
			[
				{ id: 'in:1', label: 'in' },
				{ id: 'in:2', label: 'in' },
			],
			vGrid,
			hGrid
		),
		lines: [...generateBorderLines(vGrid, hGrid, width, height)],
		name: 'Bitwise AND',
		outputs: addDefaultOutputPositions([{ id: 'out' }], vGrid, hGrid, MODULE_WIDTH_S * vGrid),
		sliders: [],
		steppers: [],
		switches: [],
		width: MODULE_WIDTH_S * vGrid,
	};
}
