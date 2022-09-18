import { Config } from '@8f4e/synth-compiler/dist/modules/buffer';

import addDefaultInputPositions from './helpers/addDefaultInputPositions';
import addDefaultOutputPositions from './helpers/addDefaultOutputPositions';
import { MODULE_HEIGHT_S, MODULE_WIDTH_S } from './consts';

import { ModuleType } from '../state/types';

export default function number(): ModuleType<Config> {
	const width = MODULE_WIDTH_S;
	const height = MODULE_HEIGHT_S;

	return {
		buttons: [],
		category: 'Inspection',
		engine: { name: 'buffer', config: { numberOfPorts: 1 } },
		height,
		initialState: {},
		inputs: addDefaultInputPositions([{ id: 'in:1', label: 'in' }]),
		name: 'Number',
		outputs: addDefaultOutputPositions([{ id: 'out:1', label: 'out' }], width),
		sliders: [],
		steppers: [],
		width,
	};
}
