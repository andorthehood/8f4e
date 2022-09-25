import addDefaultInputPositions from './helpers/addDefaultInputPositions';
import addDefaultOutputPositions from './helpers/addDefaultOutputPositions';

import { ModuleType } from '../state/types';
import { HGRID } from '../view/drawers/consts';

export default function number(): ModuleType {
	const width = 8 * HGRID;
	const height = 8 * HGRID;

	return {
		buttons: [],
		category: 'Inspection',
		engine: { name: 'buffer', config: { numberOfPorts: 1 } },
		height,
		initialState: {},
		inputs: addDefaultInputPositions([{ id: 'in:1', label: 'in' }]),
		name: 'MIDI Note',
		outputs: addDefaultOutputPositions([{ id: 'out:1', label: 'out' }], width),
		width,
	};
}
