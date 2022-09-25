import addDefaultInputPositions from './helpers/addDefaultInputPositions';
import addDefaultOutputPositions from './helpers/addDefaultOutputPositions';
import source from './engines/abs.asm';

import { ModuleType } from '../state/types';
import { HGRID } from '../view/drawers/consts';

export default function abs(): ModuleType {
	const width = 8 * HGRID;
	const height = 8 * HGRID;

	return {
		buttons: [],
		category: 'Math',
		engine: { source },
		height,
		initialState: {},
		inputs: addDefaultInputPositions([{ id: 'in' }]),
		name: 'Abs',
		outputs: addDefaultOutputPositions([{ id: 'out' }], width),
		width,
	};
}
