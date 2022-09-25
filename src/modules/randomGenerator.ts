import addDefaultOutputPositions from './helpers/addDefaultOutputPositions';

import { ModuleType } from '../state/types';
import { HGRID } from '../view/drawers/consts';

export default function randomGenerator(): ModuleType {
	const width = 8 * HGRID;
	const height = 8 * HGRID;

	return {
		buttons: [],
		category: 'Random',
		engine: { name: 'random', config: {} },
		height,
		initialState: {},
		inputs: [],
		name: 'Random',
		outputs: addDefaultOutputPositions([{ id: 'out' }], width),
		width,
	};
}
