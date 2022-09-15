import addDefaultOutputPositions from './helpers/addDefaultOutputPositions';
import { MODULE_HEIGHT_S, MODULE_WIDTH_S } from './consts';
import generateBorderLines from './helpers/generateBorderLines';

import { ModuleType } from '../state/types';

export default function randomGenerator(): ModuleType {
	const width = MODULE_WIDTH_S;
	const height = MODULE_HEIGHT_S;

	return {
		buttons: [],
		category: 'Random',
		engine: { name: 'random', config: {} },
		height,
		initialState: {},
		inputs: [],
		lines: [...generateBorderLines(width, height)],
		name: 'Random',
		outputs: addDefaultOutputPositions([{ id: 'out' }], width),
		sliders: [],
		steppers: [],
		width,
	};
}
