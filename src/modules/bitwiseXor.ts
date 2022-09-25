import addDefaultInputPositions from './helpers/addDefaultInputPositions';
import addDefaultOutputPositions from './helpers/addDefaultOutputPositions';

import { ModuleType } from '../state/types';
import { HGRID } from '../view/drawers/consts';

export default function bitwiseXor(): ModuleType {
	const width = 8 * HGRID;
	const height = 8 * HGRID;

	return {
		buttons: [],
		category: 'Bitwise',
		engine: { name: 'bitwiseXor', config: {} },
		height,
		initialState: {},
		inputs: addDefaultInputPositions([
			{ id: 'in:1', label: 'in' },
			{ id: 'in:2', label: 'in' },
		]),
		name: 'Bitwise XOR',
		outputs: addDefaultOutputPositions([{ id: 'out' }], width),
		width,
	};
}
