import addDefaultInputPositions from './helpers/addDefaultInputPositions';
import addDefaultOutputPositions from './helpers/addDefaultOutputPositions';

import { ModuleType } from '../state/types';
import { HGRID } from '../view/drawers/consts';

export default function min(): ModuleType {
	const width = 8 * HGRID;
	const height = 8 * HGRID;

	return {
		buttons: [],
		category: 'Other',
		engine: { name: 'sampleAndHold', config: {} },
		height,
		initialState: {},
		inputs: addDefaultInputPositions([{ id: 'in' }, { id: 'in:trigger', label: 'trigger' }]),
		name: 'Sample & Hold',
		outputs: addDefaultOutputPositions([{ id: 'out' }], width),
		width,
	};
}
