import addDefaultOutputPositions from './helpers/addDefaultOutputPositions';
import addDefaultInputPositions from './helpers/addDefaultInputPositions';

import { ModuleType } from '../state/types';
import { HGRID } from '../view/drawers/consts';

export default function triggerToGate(): ModuleType {
	const width = 8 * HGRID;
	const height = 8 * HGRID;

	return {
		buttons: [],
		category: 'Rhythm',
		engine: { name: 'triggerToGate', config: {} },
		height,
		initialState: {},
		inputs: addDefaultInputPositions([{ id: 'in:trigger', label: 'trig' }]),
		name: 'Trigger to Gate',
		outputs: addDefaultOutputPositions([{ id: 'out' }], width),
		sliders: [],
		steppers: [],
		width,
	};
}
