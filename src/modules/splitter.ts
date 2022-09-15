import addDefaultInputPositions from './helpers/addDefaultInputPositions';
import addDefaultOutputPositions from './helpers/addDefaultOutputPositions';
import { MODULE_HEIGHT_S, MODULE_WIDTH_S } from './consts';
import generateBorderLines from './helpers/generateBorderLines';

import { ModuleType } from '../state/types';

export default function splitter(): ModuleType {
	const width = MODULE_WIDTH_S;
	const height = MODULE_HEIGHT_S;

	return {
		buttons: [],
		category: 'Other',
		engine: { name: 'splitter', config: {} },
		height,
		initialState: {},
		inputs: addDefaultInputPositions([{ id: 'in' }]),
		lines: [...generateBorderLines(width, height)],
		name: 'Splitter',
		outputs: addDefaultOutputPositions(
			[
				{ id: 'out:1', label: 'out' },
				{ id: 'out:2', label: 'out' },
				{ id: 'out:3', label: 'out' },
				{ id: 'out:4', label: 'out' },
			],
			width
		),
		sliders: [],
		steppers: [],
		width,
	};
}
