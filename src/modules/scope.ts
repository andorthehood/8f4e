import addDefaultInputPositions from './helpers/addDefaultInputPositions';
import addDefaultOutputPositions from './helpers/addDefaultOutputPositions';
import source from './engines/scope.asm';

import { ModuleType } from '../state/types';
import { HGRID } from '../view/drawers/consts';
export default function scope(): ModuleType {
	const width = 8 * HGRID;
	const height = 8 * HGRID;

	return {
		buttons: [],
		category: 'Inspection',
		engine: { source },
		height,
		initialState: {},
		inputs: addDefaultInputPositions([{ id: 'in' }]),
		name: 'Scope',
		outputs: addDefaultOutputPositions([{ id: 'out' }], width),
		width,
	};
}
