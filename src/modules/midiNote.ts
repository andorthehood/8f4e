import addDefaultInputPositions from './helpers/addDefaultInputPositions';
import addDefaultOutputPositions from './helpers/addDefaultOutputPositions';
import { MODULE_HEIGHT_S, MODULE_WIDTH_S } from './consts';

import { ModuleType } from '../state/types';

export default function number(): ModuleType {
	const width = MODULE_WIDTH_S;
	const height = MODULE_HEIGHT_S;

	return {
		buttons: [],
		category: 'Inspection',
		engine: { name: 'buffer', config: {} },
		height,
		initialState: {},
		inputs: addDefaultInputPositions([{ id: 'in' }]),
		name: 'MIDI Note',
		outputs: addDefaultOutputPositions([{ id: 'out' }], width),
		sliders: [],
		steppers: [],
		width,
	};
}
