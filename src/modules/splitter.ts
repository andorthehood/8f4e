import addDefaultInputPositions from './helpers/addDefaultInputPositions';
import addDefaultOutputPositions from './helpers/addDefaultOutputPositions';
import source from './engines/splitter.asm';

import { ModuleType } from '../state/types';
import { HGRID } from '../view/drawers/consts';
export default function splitter(): ModuleType {
	const width = 8 * HGRID;
	const height = 8 * HGRID;

	return {
		buttons: [],
		category: 'Other',
		engine: { source },
		height,
		initialState: {},
		inputs: addDefaultInputPositions([{ id: 'in' }]),
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
		width,
	};
}
