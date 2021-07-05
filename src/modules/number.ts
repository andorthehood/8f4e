import addDefaultInputPositions from './helpers/addDefaultInputPositions';
import addDefaultOutputPositions from './helpers/addDefaultOutputPositions';
import { ModuleGeneratorProps, ModuleType } from '../state/types';
import { MODULE_HEIGHT_S, MODULE_WIDTH_S } from './consts';
import generateBorderLines from './helpers/generateBorderLines';
import { Config } from 'compiler/modules/buffer';

export default function number({ vGrid, hGrid }: ModuleGeneratorProps): ModuleType<Config> {
	const width = MODULE_WIDTH_S * vGrid;
	const height = MODULE_HEIGHT_S * hGrid;

	return {
		buttons: [],
		category: 'Inspection',
		engine: { name: 'buffer', config: { numberOfPorts: 1 } },
		height,
		initialState: {},
		inputs: addDefaultInputPositions([{ id: 'in:1', label: 'in' }], vGrid, hGrid),
		lines: [...generateBorderLines(vGrid, hGrid, width, height)],
		name: 'Number',
		outputs: addDefaultOutputPositions([{ id: 'out:1', label: 'out' }], vGrid, hGrid, width),
		sliders: [],
		steppers: [],
		width,
	};
}
