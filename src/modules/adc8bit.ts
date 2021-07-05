import addDefaultInputPositions from './helpers/addDefaultInputPositions';
import addDefaultOutputPositions from './helpers/addDefaultOutputPositions';
import { ModuleGeneratorProps, ModuleType } from '../state/types';
import { MODULE_HEIGHT_M, MODULE_WIDTH_S } from './consts';
import generateBorderLines from './helpers/generateBorderLines';
import { Config } from 'compiler/modules/adc';

export default function adc8bit({ vGrid, hGrid }: ModuleGeneratorProps): ModuleType<Config> {
	const width = MODULE_WIDTH_S * vGrid;
	const height = MODULE_HEIGHT_M * hGrid;
	return {
		buttons: [],
		category: 'Bitwise',
		engine: { name: 'adc', config: { resolution: 8 } },
		height,
		initialState: {},
		inputs: addDefaultInputPositions([{ id: 'in' }], vGrid, hGrid),
		lines: [...generateBorderLines(vGrid, hGrid, width, height)],
		name: '8bit ADC',
		outputs: addDefaultOutputPositions(
			[...new Array(8).fill(0).map((item, i) => ({ id: 'out:' + (i + 1), label: 'bit' + i }))],
			vGrid,
			hGrid,
			width
		),
		sliders: [],
		steppers: [],
		width,
	};
}
