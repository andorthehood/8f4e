import addDefaultOutputPositions from './helpers/addDefaultOutputPositions';

import { ModuleType } from '../state/types';
import { HGRID } from '../view/drawers/consts';

export default function triangle(): ModuleType {
	const width = 8 * HGRID;
	const height = 8 * HGRID;

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
