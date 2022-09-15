import addDefaultInputPositions from './helpers/addDefaultInputPositions';
import addDefaultOutputPositions from './helpers/addDefaultOutputPositions';
import { MODULE_HEIGHT_S, MODULE_WIDTH_S } from './consts';
import generateBorderLines from './helpers/generateBorderLines';

import { ModuleType } from '../state/types';

export default function invert(): ModuleType {
	const width = MODULE_WIDTH_S;
	const height = MODULE_HEIGHT_S;

	return {
		buttons: [],
		category: 'Math',
		engine: { name: 'invert', config: {} },
		height,
		initialState: {},
		inputs: addDefaultInputPositions([{ id: 'in' }]),
		lines: [...generateBorderLines(width, height)],
		name: 'Invert',
		outputs: addDefaultOutputPositions([{ id: 'out' }], width),
		sliders: [],
		steppers: [],
		width,
	};
}
