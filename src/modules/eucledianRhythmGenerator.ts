import { Config } from '@8f4e/synth-compiler/dist/modules/triggerSequencer';

import addDefaultInputPositions from './helpers/addDefaultInputPositions';
import addDefaultOutputPositions from './helpers/addDefaultOutputPositions';

import { ModuleType } from '../state/types';
import { HGRID } from '../view/drawers/consts';

export default function eucledianRhythmGenerator(): ModuleType<Config> {
	const width = 8 * HGRID;
	const height = 8 * HGRID;

	return {
		buttons: [],
		category: 'Rhythm',
		engine: { name: 'triggerSequencer', config: { maxPatternSizeToAlloc: 64 } },
		height,
		initialState: {},
		inputs: addDefaultInputPositions([{ id: 'in:trigger', label: 'trig' }]),
		name: 'Eucledian Rhythm',
		outputs: addDefaultOutputPositions([{ id: 'out' }], width),
		width,
	};
}
