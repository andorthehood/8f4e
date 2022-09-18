import addDefaultOutputPositions from './helpers/addDefaultOutputPositions';
import { MODULE_HEIGHT_S, MODULE_WIDTH_S } from './consts';

import { ModuleType } from '../state/types';

export default function triangle(): ModuleType {
	const width = MODULE_WIDTH_S;
	const height = MODULE_HEIGHT_S;

	return {
		buttons: [],
		category: 'Oscillator',
		engine: { name: 'triangle', config: {} },
		height,
		initialState: {},
		inputs: [],
		name: 'Triangle',
		outputs: addDefaultOutputPositions([{ id: 'out' }], width),
		sliders: [],
		steppers: [],
		width,
	};
}
