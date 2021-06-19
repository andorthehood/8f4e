import addDefaultInputPositions from './helpers/addDefaultInputPositions';
import addDefaultOutputPositions from './helpers/addDefaultOutputPositions';
import { ModuleGeneratorProps, ModuleType } from '../state/types';
import { MODULE_HEIGHT_S, MODULE_WIDTH_S } from './consts';
import generateBorderLines from './helpers/generateBorderLines';

export default function splitter({ vGrid, hGrid }: ModuleGeneratorProps): ModuleType {
	const width = MODULE_WIDTH_S * vGrid;
	const height = MODULE_HEIGHT_S * hGrid;

	return {
		category: 'Other',
		engine: 'splitter',
		height,
		inputs: addDefaultInputPositions([{ id: 'in' }], vGrid, hGrid),
		lines: [...generateBorderLines(vGrid, hGrid, width, height)],
		name: 'Splitter',
		outputs: addDefaultOutputPositions(
			[
				{ id: 'out:1', label: 'out' },
				{ id: 'out:2', label: 'out' },
				{ id: 'out:3', label: 'out' },
				{ id: 'out:4', label: 'out' },
			],
			vGrid,
			hGrid,
			width
		),
		sliders: [],
		steppers: [],
		switches: [],
		width,
	};
}
