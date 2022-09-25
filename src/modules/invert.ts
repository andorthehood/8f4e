import addDefaultInputPositions from './helpers/addDefaultInputPositions';
import addDefaultOutputPositions from './helpers/addDefaultOutputPositions';
import source from './engines/invert.asm';

import { ModuleType } from '../state/types';
import { HGRID } from '../view/drawers/consts';

export default function invert(): ModuleType {
	const width = 8 * HGRID;
	const height = 8 * HGRID;

	return {
		buttons: [],
		category: 'Math',
		engine: { source },
		height,
		initialState: {},
		inputs: addDefaultInputPositions([{ id: 'in' }]),
		name: 'Invert',
		outputs: addDefaultOutputPositions([{ id: 'out' }], width),
		width,
	};
}
