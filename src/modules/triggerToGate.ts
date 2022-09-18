import addDefaultOutputPositions from './helpers/addDefaultOutputPositions';
import { MODULE_HEIGHT_S, MODULE_WIDTH_S } from './consts';
import addDefaultInputPositions from './helpers/addDefaultInputPositions';

import { ModuleType } from '../state/types';

export default function triggerToGate(): ModuleType {
	const width = MODULE_WIDTH_S;
	const height = MODULE_HEIGHT_S;

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
