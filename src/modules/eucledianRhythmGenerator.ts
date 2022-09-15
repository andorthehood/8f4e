import { Config } from '@8f4e/synth-compiler/dist/modules/triggerSequencer';

import addDefaultInputPositions from './helpers/addDefaultInputPositions';
import addDefaultOutputPositions from './helpers/addDefaultOutputPositions';
import { MODULE_HEIGHT_S, MODULE_WIDTH_M } from './consts';
import generateBorderLines from './helpers/generateBorderLines';

import { ModuleType } from '../state/types';

export default function eucledianRhythmGenerator(): ModuleType<Config> {
	const width = MODULE_WIDTH_M;
	const height = MODULE_HEIGHT_S;

	return {
		buttons: [],
		category: 'Rhythm',
		engine: { name: 'triggerSequencer', config: { maxPatternSizeToAlloc: 64 } },
		height,
		initialState: {},
		inputs: addDefaultInputPositions([{ id: 'in:trigger', label: 'trig' }]),
		lines: [...generateBorderLines(width, height)],
		name: 'Eucledian Rhythm',
		outputs: addDefaultOutputPositions([{ id: 'out' }], width),
		sliders: [],
		steppers: [],
		width,
	};
}
