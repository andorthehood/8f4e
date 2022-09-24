import addDefaultInputPositions from './helpers/addDefaultInputPositions';
import addDefaultOutputPositions from './helpers/addDefaultOutputPositions';

import { ModuleType } from '../state/types';
import { HGRID } from '../view/drawers/consts';

export default function sequentialSwitch(): ModuleType {
	const width = 12 * HGRID;
	const height = 9 * HGRID;

	return {
		buttons: [],
		category: 'Logic',
		engine: { name: 'sequentialSwitch', config: {} },
		height,
		initialState: {},
		inputs: addDefaultInputPositions([
			{ id: 'in:1', label: 'in' },
			{ id: 'in:2', label: 'in' },
			{ id: 'in:3', label: 'in' },
			{ id: 'in:4', label: 'in' },
			{ id: 'in:clock', label: 'clock' },
		]),
		name: 'Sequential switch',
		outputs: addDefaultOutputPositions([{ id: 'out' }], width),
		sliders: [],
		steppers: [],
		width,
	};
}
