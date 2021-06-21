import addDefaultInputPositions from './helpers/addDefaultInputPositions';
import addDefaultOutputPositions from './helpers/addDefaultOutputPositions';
import { ModuleGeneratorProps, ModuleType } from '../state/types';
import { MODULE_HEIGHT_S, MODULE_WIDTH_S } from './consts';
import generateBorderLines from './helpers/generateBorderLines';

export default function logicXor({ vGrid, hGrid }: ModuleGeneratorProps): ModuleType {
	const width = MODULE_WIDTH_S * vGrid;
	const height = MODULE_HEIGHT_S * hGrid;

	return {
		category: 'Logic',
		engine: { name: 'logicXor', config: {} },
		height,
		initialState: {},
		inputs: addDefaultInputPositions(
			[
				{ id: 'in:1', label: 'in' },
				{ id: 'in:2', label: 'in' },
			],
			vGrid,
			hGrid
		),
		lines: [...generateBorderLines(vGrid, hGrid, width, height)],
		name: 'Logic XOR',
		outputs: addDefaultOutputPositions([{ id: 'out' }], vGrid, hGrid, width),
		sliders: [],
		steppers: [],
		switches: [],
		width,
	};
}
