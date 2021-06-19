import addDefaultInputPositions from './helpers/addDefaultInputPositions';
import addDefaultOutputPositions from './helpers/addDefaultOutputPositions';
import { ModuleGeneratorProps, ModuleType } from '../state/types';
import { MODULE_HEIGHT_S, MODULE_WIDTH_S } from './consts';

export default function splitter({ vGrid, hGrid }: ModuleGeneratorProps): ModuleType {
	return {
		category: 'Other',
		engine: 'splitter',
		height: MODULE_HEIGHT_S * hGrid,
		inputs: addDefaultInputPositions([{ id: 'in' }], vGrid, hGrid),
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
			MODULE_WIDTH_S * vGrid
		),
		sliders: [],
		steppers: [],
		switches: [],
		width: MODULE_WIDTH_S * vGrid,
	};
}
