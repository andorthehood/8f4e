import { Config } from '@8f4e/synth-compiler/dist/modules/buffer';

import addDefaultInputPositions from './helpers/addDefaultInputPositions';
import addDefaultOutputPositions from './helpers/addDefaultOutputPositions';
import source from './engines/buffer.asm';

import { ModuleType } from '../state/types';
import { HGRID } from '../view/drawers/consts';

export default function number(): ModuleType<Config> {
	const width = 8 * HGRID;
	const height = 8 * HGRID;

	return {
		buttons: [],
		category: 'Inspection',
		engine: { source: source({ numberOfPorts: 1 }) },
		height,
		initialState: {},
		inputs: addDefaultInputPositions([{ id: 'in:1', label: 'in' }]),
		name: 'Number',
		outputs: addDefaultOutputPositions([{ id: 'out:1', label: 'out' }], width),
		width,
	};
}
