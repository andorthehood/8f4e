import addDefaultInputPositions from './helpers/addDefaultInputPositions';
import addDefaultOutputPositions from './helpers/addDefaultOutputPositions';
import { ModuleGeneratorProps, ModuleType } from '../state/types';
import { MODULE_HEIGHT_S, MODULE_WIDTH_M } from './consts';
import generateBorderLines from './helpers/generateBorderLines';
import { Config } from 'compiler/modules/triggerSequencer';

export default function eucledianRhythmGenerator({ vGrid, hGrid }: ModuleGeneratorProps): ModuleType<Config> {
	const width = MODULE_WIDTH_M * vGrid;
	const height = MODULE_HEIGHT_S * hGrid;

	return {
		buttons: [],
		category: 'Rhythm',
		engine: { name: 'triggerSequencer', config: { maxPatternSizeToAlloc: 64 } },
		height,
		initialState: {},
		inputs: addDefaultInputPositions([{ id: 'in:trigger', label: 'trig' }], vGrid, hGrid),
		lines: [...generateBorderLines(vGrid, hGrid, width, height)],
		name: 'Eucledian Rhythm',
		outputs: addDefaultOutputPositions([{ id: 'out' }], vGrid, hGrid, width),
		sliders: [],
		steppers: [],
		width,
	};
}
